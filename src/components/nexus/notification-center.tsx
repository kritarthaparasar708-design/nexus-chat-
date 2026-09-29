import { Bell, CheckCheck, MessageCircle, UserPlus, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNexus } from "./state";
import { Avatar, formatRelativeTime, IconButton } from "./primitives";

const notificationIcon = {
  message: MessageCircle,
  "friend-request": UserPlus,
  "friend-accepted": CheckCheck,
  mention: Bell,
  "group-activity": Users,
};

export function NotificationCenter({ onClose }: { onClose: () => void }) {
  const { state, actions } = useNexus();

  return (
    <div className="nexus-notification-panel" role="dialog" aria-label="Notifications">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Stay close to what matters.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="nexus-text-button text-[11px]"
            onClick={actions.markAllNotificationsRead}
          >
            Mark all read
          </button>
          <IconButton label="Close notifications" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
      </div>
      <div className="scroll-slim max-h-[min(32rem,calc(100dvh-8rem))] overflow-y-auto p-2">
        {state.notifications.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            You’re all caught up.
          </p>
        ) : (
          state.notifications.map((notification) => {
            const NotificationIcon = notificationIcon[notification.type];
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => actions.markNotificationRead(notification.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-secondary/70",
                  !notification.read && "bg-primary/8",
                )}
              >
                <span className="relative">
                  <Avatar
                    src={notification.avatar}
                    initials={notification.initials}
                    name={notification.title}
                    size="sm"
                  />
                  <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border border-card bg-primary text-primary-foreground">
                    <NotificationIcon className="size-3" />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {notification.description}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
