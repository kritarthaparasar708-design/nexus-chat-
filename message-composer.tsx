import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { FilePlus2, ImagePlus, Mic, Paperclip, Send, Smile, X } from "lucide-react";
import { useNexus } from "./state";
import { formatBytes, IconButton, Modal } from "./primitives";
import type { Attachment, Message } from "./types";

const emojiOptions = ["✨", "🔥", "😍", "😂", "👍", "🎉", "🚀", "💜", "🙌", "😅", "🌙", "🎨"];

function createAttachment(file: File, dataUrl: string): Attachment {
  const type = file.type || "application/octet-stream";
  const kind: Attachment["kind"] = type.startsWith("image/")
    ? "image"
    : type.startsWith("video/")
      ? "video"
      : type.startsWith("audio/")
        ? "audio"
        : "file";
  return {
    id: `${file.name}-${file.lastModified}-${file.size}`,
    name: file.name,
    size: file.size,
    type,
    kind,
    url: kind === "image" || kind === "video" ? dataUrl : "",
    previewUrl: kind === "image" || kind === "video" ? dataUrl : "",
    progress: 100,
  };
}

export function MessageComposer({
  conversationId,
  editingMessage,
  replyingTo,
  onCancelEdit,
  onCancelReply,
  onSent,
}: {
  conversationId: string;
  editingMessage: Message | null;
  replyingTo: Message | null;
  onCancelEdit: () => void;
  onCancelReply: () => void;
  onSent: () => void;
}) {
  const { actions } = useNexus();
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(editingMessage?.text ?? "");
    if (editingMessage) inputRef.current?.focus();
  }, [editingMessage]);

  function submit() {
    const text = draft.trim();
    if (!text && attachments.length === 0) return;
    if (editingMessage) {
      actions.editMessage(conversationId, editingMessage.id, text);
      onCancelEdit();
    } else {
      actions.sendMessage(conversationId, { text, attachments, replyToId: replyingTo?.id ?? null });
      onCancelReply();
    }
    setDraft("");
    setAttachments([]);
    setEmojiOpen(false);
    onSent();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const next = await Promise.all(
      files.map(async (file) => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          });
          return createAttachment(file, dataUrl);
        }
        return createAttachment(file, "");
      }),
    );
    setAttachments((current) => [...current, ...next]);
    event.target.value = "";
  }

  function toggleRecording() {
    setRecording((current) => !current);
  }

  return (
    <div className="border-t border-border bg-card/80 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5">
      {(editingMessage || replyingTo) && (
        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/8 px-3 py-2">
          <span className="size-1.5 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-primary">
              {editingMessage ? "Editing message" : `Replying to ${replyingTo?.authorName}`}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {editingMessage?.text ?? replyingTo?.text}
            </p>
          </div>
          <IconButton
            label="Cancel composer mode"
            onClick={editingMessage ? onCancelEdit : onCancelReply}
          >
            <X className="size-3.5" />
          </IconButton>
        </div>
      )}
      {attachments.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative flex min-w-36 items-center gap-2 rounded-xl border border-border bg-secondary/70 p-2"
            >
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt="Attachment preview"
                  className="size-10 rounded-lg object-cover"
                />
              ) : (
                <FilePlus2 className="ml-1 size-5 text-primary" />
              )}
              <span className="min-w-0">
                <span className="block max-w-24 truncate text-[11px] font-medium text-foreground">
                  {attachment.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatBytes(attachment.size)}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${attachment.name}`}
                onClick={() =>
                  setAttachments((current) => current.filter((item) => item.id !== attachment.id))
                }
                className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 rounded-2xl border border-border bg-secondary/60 p-2 shadow-inner focus-within:border-primary/40"
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
          className="hidden"
          onChange={handleFiles}
        />
        <IconButton label="Attach a file" onClick={() => fileRef.current?.click()}>
          <Paperclip className="size-[18px]" />
        </IconButton>
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={recording ? "Recording a voice note..." : "Write a message..."}
            aria-label="Message"
            className="max-h-32 min-h-9 w-full resize-none bg-transparent px-1 py-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
          />
          {emojiOpen && (
            <div className="absolute bottom-12 left-0 z-20 grid w-56 grid-cols-6 gap-1 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="grid size-8 place-items-center rounded-lg text-lg hover:bg-secondary"
                  onClick={() => {
                    setDraft((current) => `${current}${emoji}`);
                    inputRef.current?.focus();
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <IconButton
          label="Choose an emoji"
          active={emojiOpen}
          onClick={() => setEmojiOpen((current) => !current)}
        >
          <Smile className="size-[18px]" />
        </IconButton>
        <IconButton
          label={recording ? "Stop voice note" : "Record voice note"}
          active={recording}
          onClick={toggleRecording}
        >
          <Mic className="size-[18px]" />
        </IconButton>
        <button
          type="submit"
          className="nexus-send-button"
          aria-label={editingMessage ? "Save message" : "Send message"}
        >
          <Send className="size-[17px]" />
        </button>
      </form>
      <p className="mt-1.5 hidden px-2 text-[10px] text-muted-foreground sm:block">
        Enter to send · Shift + Enter for a new line · Demo state stays on this device
      </p>
    </div>
  );
}

export function VoiceNoteInfo({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="Voice messages"
      description="The demo composer exposes the voice-note interaction without connecting to a microphone service."
      onClose={onClose}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/60 p-4">
        <Mic className="size-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          Voice notes are represented locally in this frontend demo.
        </p>
      </div>
    </Modal>
  );
}

export function ImageAttachmentButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton label="Attach an image" onClick={onClick}>
      <ImagePlus className="size-[18px]" />
    </IconButton>
  );
}
