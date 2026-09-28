import { useState, type ReactNode } from "react";
import { Check, CheckCheck, Hexagon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageStatus, Presence } from "./types";

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="nexus-mark" aria-hidden="true">
        <Hexagon className="size-5 fill-current" strokeWidth={1.8} />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight">
          Nexus <span className="nexus-gradient-text">Chat</span>
        </span>
      )}
    </div>
  );
}

export function Avatar({
  src,
  initials,
  name,
  size = "md",
  status,
  className,
}: {
  src: string;
  initials: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: Presence;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const sizeClass = {
    xs: "size-7 text-[10px]",
    sm: "size-9 text-xs",
    md: "size-11 text-sm",
    lg: "size-16 text-base",
    xl: "size-24 text-2xl",
  }[size];

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span className={cn("nexus-avatar", sizeClass)}>
        {src && !failed ? (
          <img src={src} alt={name} onError={() => setFailed(true)} />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </span>
      {status && <StatusDot status={status} className="absolute right-0 bottom-0" />}
    </span>
  );
}

export function StatusDot({ status, className }: { status: Presence; className?: string }) {
  return (
    <span
      className={cn(
        "nexus-status-dot ring-2 ring-background",
        status === "online" && "bg-emerald-400",
        status === "away" && "bg-amber-300",
        status === "offline" && "bg-slate-500",
        className,
      )}
      aria-label={status}
    />
  );
}

export function IconButton({
  label,
  children,
  className,
  onClick,
  active = false,
  type = "button",
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn("nexus-icon-button", active && "nexus-icon-button-active", className)}
    >
      {children}
    </button>
  );
}

export function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="nexus-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn("nexus-modal", wide && "max-w-2xl")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nexus-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id="nexus-modal-title" className="text-base font-semibold text-foreground">
              {title}
            </h2>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          <IconButton label="Close dialog" onClick={onClose} className="-mr-2 -mt-2">
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl border border-border bg-secondary/60 text-primary">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  if (status === "sending") return <span className="text-muted-foreground">•</span>;
  if (status === "sent") return <Check className="size-3" />;
  return <CheckCheck className="size-3" />;
}

export function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function highlightText(text: string, query: string): ReactNode {
  const cleanQuery = query.trim();
  if (!cleanQuery) return text;
  const parts = text.split(
    new RegExp(`(${cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"),
  );
  return parts.map((part, index) =>
    part.toLowerCase() === cleanQuery.toLowerCase() ? (
      <mark key={`${part}-${index}`}>{part}</mark>
    ) : (
      part
    ),
  );
}
