import { useMemo, useState } from "react";
import { Check, MessageCircle, Plus, UserCheck, UserPlus, UsersRound, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";
import { useNexus } from "./state";
import { Avatar, EmptyState, IconButton, Modal } from "./primitives";
import type { Friend } from "./types";

type FriendTab = "all" | "requests" | "sent";

function AddFriendModal({ onClose }: { onClose: () => void }) {
  const { actions } = useNexus();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [sent, setSent] = useState(false);
  function submit() {
    if (!name.trim() || !username.trim()) return;
    actions.addFriend(name, username);
    setSent(true);
  }
  return (
    <Modal
      title="Add a friend"
      description="Send a demo request by name or username."
      onClose={onClose}
    >
      {sent ? (
        <div className="py-5 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-400/12 text-emerald-300">
            <Check className="size-5" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-foreground">Request sent</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {name} will appear in your outgoing requests.
          </p>
          <button type="button" className="nexus-primary-button mt-5 w-full" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="nexus-form-label">
            Name
            <input
              className="nexus-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alex Rivera"
            />
          </label>
          <label className="nexus-form-label">
            Username
            <input
              className="nexus-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="@alexrivera"
            />
          </label>
          <button
            type="submit"
            className="nexus-primary-button w-full"
            disabled={!name.trim() || !username.trim()}
          >
            <UserPlus className="size-4" /> Send request
          </button>
        </form>
      )}
    </Modal>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  const { actions } = useNexus();
  const incoming = friend.state === "pending-incoming";
  const pending = friend.state === "pending-outgoing";
  return (
    <div className="nexus-friend-card">
      <Avatar
        src={friend.avatar}
        initials={friend.initials}
        name={friend.name}
        size="md"
        status={friend.status}
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-foreground">{friend.name}</h3>
        <p className="truncate text-xs text-muted-foreground">{friend.username}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {friend.status === "online" ? "Online now" : friend.lastSeen} · {friend.mutualGroups}{" "}
          mutual groups
        </p>
      </div>
      {incoming ? (
        <div className="flex gap-1">
          <IconButton
            label={`Accept ${friend.name}`}
            onClick={() => actions.updateFriendState(friend.id, "accepted")}
            className="bg-emerald-400/12 text-emerald-300 hover:bg-emerald-400/20"
          >
            <Check className="size-4" />
          </IconButton>
          <IconButton
            label={`Decline ${friend.name}`}
            onClick={() => actions.updateFriendState(friend.id, "pending-outgoing")}
          >
            <X className="size-4" />
          </IconButton>
        </div>
      ) : pending ? (
        <span className="rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">
          Pending
        </span>
      ) : (
        <Link to="/messages" className="nexus-icon-button" aria-label={`Chat with ${friend.name}`}>
          <MessageCircle className="size-4" />
        </Link>
      )}
    </div>
  );
}

export function FriendsView() {
  const { state } = useNexus();
  const [tab, setTab] = useState<FriendTab>("all");
  const [addOpen, setAddOpen] = useState(false);
  const filtered = useMemo(
    () =>
      state.friends.filter((friend) =>
        tab === "all"
          ? friend.state === "accepted"
          : tab === "requests"
            ? friend.state === "pending-incoming"
            : friend.state === "pending-outgoing",
      ),
    [state.friends, tab],
  );
  const online = filtered.filter((friend) => friend.status === "online");
  const offline = filtered.filter((friend) => friend.status !== "online");
  return (
    <AppShell title="Friends" subtitle="Build your circle and keep your favorite people close.">
      <div className="nexus-page-grid">
        <section className="nexus-panel p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="nexus-section-title">Your circle</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {state.friends.filter((friend) => friend.state === "accepted").length} accepted
                friends
              </p>
            </div>
            <button type="button" onClick={() => setAddOpen(true)} className="nexus-primary-button">
              <Plus className="size-4" /> Add friend
            </button>
          </div>
          <div className="nexus-tab-row mt-5">
            {(["all", "requests", "sent"] as FriendTab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn("nexus-tab", tab === item && "nexus-tab-active")}
              >
                {item === "all"
                  ? "All friends"
                  : item === "requests"
                    ? `Requests ${state.friends.filter((friend) => friend.state === "pending-incoming").length || ""}`
                    : "Sent"}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<UsersRound className="size-6" />}
              title={tab === "all" ? "Your circle is waiting" : "No requests here"}
              description="Invite someone new or explore your messages to meet more people."
              action={
                <button
                  type="button"
                  className="nexus-secondary-button"
                  onClick={() => setAddOpen(true)}
                >
                  <UserPlus className="size-4" /> Add a friend
                </button>
              }
            />
          ) : (
            <div className="mt-6 space-y-6">
              {online.length > 0 && <FriendSection label="Online now" friends={online} />}
              {offline.length > 0 && (
                <FriendSection label="Offline / recently active" friends={offline} />
              )}
            </div>
          )}
        </section>
        <aside className="nexus-panel hidden p-5 xl:block">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
            <UserCheck className="size-6" />
          </div>
          <h2 className="mt-4 text-sm font-semibold text-foreground">Friendly by design</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Friend requests, accepted friends, and local conversations are all stored in the demo
            state. Connect a real identity provider before shipping.
          </p>
        </aside>
      </div>
      {addOpen && <AddFriendModal onClose={() => setAddOpen(false)} />}
    </AppShell>
  );
}

function FriendSection({ label, friends }: { label: string; friends: Friend[] }) {
  return (
    <section>
      <p className="nexus-list-label">{label}</p>
      <div className="grid gap-2 md:grid-cols-2">
        {friends.map((friend) => (
          <FriendCard key={friend.id} friend={friend} />
        ))}
      </div>
    </section>
  );
}
