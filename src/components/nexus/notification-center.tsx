import { Bell, X } from "lucide-react";
import { IconButton } from "./primitives";

export function NotificationCenter({ onClose }: { onClose: () => void }) {
  return (
    <div className="nexus-notification-panel" role="dialog" aria-label="Notifications">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div><p className="text-sm font-semibold text-foreground">Notifications</p><p className="mt-0.5 text-[11px] text-muted-foreground">Activity from your conversations.</p></div>
        <IconButton label="Close notifications" onClick={onClose}><X className="size-4" /></IconButton>
      </div>
      <div className="flex flex-col items-center px-5 py-9 text-center">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Bell className="size-4" /></span>
        <p className="mt-3 text-xs font-medium text-foreground">No notifications</p>
        <p className="mt-1 max-w-56 text-[11px] leading-5 text-muted-foreground">Notifications are not enabled yet. This panel will show real activity when it is implemented.</p>
      </div>
    </div>
  );
}
