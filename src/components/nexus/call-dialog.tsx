import { MessageCircle } from "lucide-react";
import { Modal } from "./primitives";
import type { Conversation } from "./types";

export function CallDialog({ conversation, kind, onClose }: { conversation: Conversation; kind: "voice" | "video"; onClose: () => void }) {
  return (
    <Modal title={`${kind === "video" ? "Video" : "Voice"} calling`} description={`Calling ${conversation.name}`} onClose={onClose}>
      <div className="py-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary"><MessageCircle className="size-5" /></span>
        <h3 className="mt-4 text-sm font-semibold text-foreground">Calling is not available yet</h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Nexus Chat currently supports private text messaging. No call is being placed.</p>
        <button type="button" className="nexus-secondary-button mt-5" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
