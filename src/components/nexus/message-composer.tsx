import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { useNexus } from "./state";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const { actions } = useNexus();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function submit() {
    const text = draft.trim();
    if (!text || sending) return;
    setError("");
    setSending(true);
    try {
      await actions.sendMessage(conversationId, { text });
      setDraft("");
      inputRef.current?.focus();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div className="border-t border-border bg-card/80 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5">
      {error && <p role="alert" className="mb-2 text-xs text-destructive">{error}</p>}
      <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-2xl border border-border bg-background/70 p-2 focus-within:border-primary/40">
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message…"
          aria-label="Message"
          className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
          disabled={sending}
        />
        <button type="submit" className="nexus-primary-button !size-9 !min-h-9 !justify-center !rounded-xl !p-0" aria-label="Send message" disabled={!draft.trim() || sending}>
          {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </form>
      <p className="mt-1 px-2 text-[10px] text-muted-foreground">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}
