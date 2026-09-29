import {
  ArrowRight,
  Check,
  FileText,
  LockKeyhole,
  MessageCircle,
  Phone,
  Sparkles,
  UsersRound,
  Video,
  Zap,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BrandMark } from "./primitives";

const features = [
  {
    icon: LockKeyhole,
    title: "Private by default",
    text: "A thoughtful place for your conversations.",
  },
  { icon: Phone, title: "Voice & video", text: "Feel close, even across the distance." },
  { icon: UsersRound, title: "Group spaces", text: "Build communities around what matters." },
  { icon: FileText, title: "Share freely", text: "Keep files, photos, and ideas together." },
];

export function WelcomeView() {
  return (
    <div className="nexus-auth-page">
      <div className="nexus-welcome-orb nexus-welcome-orb-one" />
      <div className="nexus-welcome-orb nexus-welcome-orb-two" />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/welcome">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Already have an account?</span>
          <Link to="/login" className="nexus-text-button">
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-5 pb-10 pt-6 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-16 lg:pt-10">
        <section className="max-w-2xl">
          <div className="nexus-eyebrow">
            <span className="size-1.5 rounded-full bg-primary" /> A calmer way to connect
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl">
            Connect with the people who <span className="nexus-gradient-text">matter most.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Nexus Chat brings your messages, communities, and everyday moments into one beautiful
            space built for real conversations.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className="nexus-primary-button justify-center px-6 py-3">
              Create an account <ArrowRight className="size-4" />
            </Link>
            <Link to="/login" className="nexus-secondary-button justify-center px-6 py-3">
              Sign in
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="size-3.5 text-primary" /> No credit card
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-3.5 text-primary" /> Demo-ready locally
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-3.5 text-primary" /> Made for every screen
            </span>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="nexus-feature-card">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="size-4" />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="relative mx-auto w-full max-w-xl">
          <div className="nexus-landing-window">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <BrandMark compact />
                <span className="text-[10px] text-white/45">More than just messaging</span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-300" /> Live demo
              </span>
            </div>
            <div className="grid gap-3 p-3 sm:grid-cols-[.82fr_1.18fr]">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 py-2">
                  <span className="text-[11px] font-semibold text-white">Messages</span>
                  <span className="grid size-6 place-items-center rounded-lg bg-primary/20 text-primary">
                    <MessageCircle className="size-3" />
                  </span>
                </div>
                {["Sofia Chen", "Design Squad", "Marcus Webb", "Nexus Team", "Anime Squad"].map(
                  (name, index) => (
                    <div
                      key={name}
                      className={
                        "flex items-center gap-2 rounded-xl p-2 " +
                        (index === 0 ? "bg-primary/15" : "bg-white/[.03]")
                      }
                    >
                      <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-700 text-[9px] font-semibold text-white">
                        {name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[10px] font-semibold text-white/90">
                          {name}
                        </span>
                        <span className="block truncate text-[9px] text-white/40">
                          {index === 0
                            ? "Hey! Did you see the new design?"
                            : "A thoughtful message is here"}
                        </span>
                      </span>
                      {index < 2 && <span className="size-1.5 rounded-full bg-primary" />}
                    </div>
                  ),
                )}
              </div>
              <div className="nexus-landing-chat">
                <div className="flex items-center gap-2 border-b border-white/10 p-3">
                  <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-pink-300 to-violet-600 text-[10px] font-semibold">
                    SC
                  </span>
                  <span>
                    <span className="block text-[11px] font-semibold text-white">Sofia Chen</span>
                    <span className="block text-[9px] text-emerald-300">Online now</span>
                  </span>
                  <span className="ml-auto flex gap-1">
                    <span className="grid size-6 place-items-center rounded-lg bg-white/5">
                      <Phone className="size-3 text-white/60" />
                    </span>
                    <span className="grid size-6 place-items-center rounded-lg bg-white/5">
                      <Video className="size-3 text-white/60" />
                    </span>
                  </span>
                </div>
                <div className="flex min-h-72 flex-col justify-end gap-2 p-3">
                  <div className="self-start rounded-2xl rounded-bl-md bg-white/8 px-3 py-2 text-[10px] text-white/75">
                    Hey! Did you see the new design I sent?
                  </div>
                  <div className="self-end rounded-2xl rounded-br-md bg-gradient-to-br from-violet-500 to-indigo-600 px-3 py-2 text-[10px] text-white">
                    Yeah! It looks amazing. 🔥
                  </div>
                  <div className="self-start flex items-center gap-2 rounded-2xl rounded-bl-md bg-white/8 px-3 py-2 text-[10px] text-white/75">
                    <span className="grid size-6 place-items-center rounded-lg bg-rose-400/20 text-rose-200">
                      <FileText className="size-3" />
                    </span>
                    UI_Design_Final.pdf
                  </div>
                  <div className="self-end rounded-2xl rounded-br-md bg-gradient-to-br from-violet-500 to-indigo-600 px-3 py-2 text-[10px] text-white">
                    Perfect! I’ll handle the deployment.
                  </div>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2">
                    <span className="flex-1 text-[10px] text-white/35">Write a message...</span>
                    <span className="grid size-6 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="nexus-landing-glow" />
          <div className="absolute -bottom-4 -left-3 hidden rounded-2xl border border-primary/20 bg-card/90 px-4 py-3 shadow-xl sm:block">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-xl bg-emerald-400/12 text-emerald-300">
                <Zap className="size-4" />
              </span>
              <span>
                <span className="block text-[11px] font-semibold text-foreground">
                  Fast, secure, beautiful
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  Built for your everyday flow
                </span>
              </span>
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pb-5 text-[10px] text-muted-foreground sm:px-8 lg:px-10">
        <span>© 2026 Nexus Chat</span>
        <span>Demo experience · Production services not connected</span>
      </footer>
    </div>
  );
}
