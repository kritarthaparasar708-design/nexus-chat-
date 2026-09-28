import { useState } from "react";
import { Camera, Mic, MicOff, PhoneOff, ScreenShare, Volume2, VolumeX, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, IconButton, Modal } from "./primitives";
import type { Conversation } from "./types";

export function CallDialog({
  conversation,
  kind,
  onClose,
}: {
  conversation: Conversation;
  kind: "voice" | "video";
  onClose: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [camera, setCamera] = useState(kind === "video");
  const [screenShared, setScreenShared] = useState(false);

  return (
    <Modal
      title={`${kind === "video" ? "Video" : "Voice"} call`}
      description="Demo call controls. A production WebRTC service is not connected."
      onClose={onClose}
    >
      <div className="overflow-hidden rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_top,#3b1c68,transparent_60%),#0b0b19] p-7 text-center">
        <Avatar
          src={conversation.avatar}
          initials={conversation.initials}
          name={conversation.name}
          size="xl"
          status={conversation.status}
          className="mx-auto"
        />
        <h3 className="mt-4 text-lg font-semibold text-white">{conversation.name}</h3>
        <p className="mt-1 text-xs text-white/60">
          {camera ? "Connecting securely..." : "Connected · demo mode"}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <IconButton
            label={muted ? "Unmute microphone" : "Mute microphone"}
            active={muted}
            onClick={() => setMuted((value) => !value)}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </IconButton>
          <IconButton
            label={speaker ? "Turn speaker off" : "Turn speaker on"}
            active={!speaker}
            onClick={() => setSpeaker((value) => !value)}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            {speaker ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </IconButton>
          {kind === "video" && (
            <IconButton
              label={camera ? "Turn camera off" : "Turn camera on"}
              active={!camera}
              onClick={() => setCamera((value) => !value)}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              {camera ? <Camera className="size-5" /> : <Video className="size-5" />}
            </IconButton>
          )}
          <IconButton
            label={screenShared ? "Stop sharing screen" : "Share screen"}
            active={screenShared}
            onClick={() => setScreenShared((value) => !value)}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <ScreenShare className="size-5" />
          </IconButton>
          <button
            type="button"
            onClick={onClose}
            aria-label="End call"
            className="grid size-11 place-items-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-900/30 hover:bg-rose-400"
          >
            <PhoneOff className="size-5" />
          </button>
        </div>
      </div>
      <div
        className={cn(
          "mt-3 rounded-xl border px-3 py-2 text-center text-[11px]",
          camera
            ? "border-amber-400/20 bg-amber-400/8 text-amber-200"
            : "border-emerald-400/20 bg-emerald-400/8 text-emerald-300",
        )}
      >
        {camera
          ? "Connecting state is simulated locally."
          : screenShared
            ? "Screen sharing is simulated locally."
            : "Your call controls are active locally."}
      </div>
    </Modal>
  );
}
