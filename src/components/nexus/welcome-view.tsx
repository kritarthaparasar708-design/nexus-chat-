import { useEffect } from "react";
import { ArrowRight, Check, LockKeyhole, MessageCircle, Search, ShieldCheck, UserRound, Zap } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BrandMark } from "./primitives";
import { useNexus } from "./state";

const features = [
  { icon: LockKeyhole, title: "Private by default", text: "One-to-one conversations protected by database access rules." },
  { icon: Zap, title: "Live conversations", text: "New messages arrive in real time without refreshing." },
  { icon: UserRound, title: "Find your people", text: "Search public names and usernames, never private contact details." },
  { icon: ShieldCheck, title: "Verified accounts", text: "Email and phone verification use your Supabase settings." },
];

export function WelcomeView() {
  const { authConfigured, authLoading, authUser, profile } = useNexus();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading && authUser) void navigate({ to: profile ? "/messages" : "/profile", replace: true });
  }, [authLoading, authUser, profile, navigate]);

  return (
    <div className="nexus-auth-page">
      <div className="nexus-welcome-orb nexus-welcome-orb-one" />
      <div className="nexus-welcome-orb nexus-welcome-orb-two" />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/welcome"><BrandMark /></Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="hidden sm:inline">Already have an account?</span><Link to="/login" className="nexus-text-button">Log in</Link></div>
      </header>
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-5 pb-10 pt-6 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-16 lg:pt-10">
        <section className="max-w-2xl">
          <div className="nexus-eyebrow"><span className="size-1.5 rounded-full bg-primary" /> Real conversations, closer together</div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl">Connect with the people who <span className="nexus-gradient-text">matter most.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Nexus Chat brings your private messages and everyday conversations into one thoughtful space, built for real people and real connections.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className="nexus-primary-button justify-center px-6 py-3">Create an account <ArrowRight className="size-4" /></Link>
            <Link to="/login" className="nexus-secondary-button justify-center px-6 py-3">Log in</Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Secure Supabase sign-in</span><span className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Works on every screen</span></div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2">{features.map(({ icon: Icon, title, text }) => <div key={title} className="nexus-feature-card"><span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary"><Icon className="size-4" /></span><span><strong>{title}</strong><small>{text}</small></span></div>)}</div>
        </section>
        <section className="relative mx-auto w-full max-w-xl">
          <div className="nexus-landing-window">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2"><BrandMark compact /><span className="text-[10px] text-white/45">Your conversations</span></div><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/60">Nexus Chat</span></div>
            <div className="grid min-h-72 gap-3 p-3 sm:grid-cols-[.82fr_1.18fr]">
              <div className="rounded-2xl border border-white/8 bg-black/15 p-3"><div className="flex items-center justify-between text-[11px] font-semibold text-white/80"><span>Inbox</span><Search className="size-3.5 text-white/45" /></div><div className="mt-3 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-3 text-center"><MessageCircle className="size-6 text-violet-300/70" /><p className="mt-2 text-[11px] font-medium text-white/70">Your chats start here</p><p className="mt-1 text-[10px] leading-4 text-white/40">Find a registered user to begin.</p></div></div>
              <div className="flex min-h-64 flex-col overflow-hidden rounded-2xl border border-white/8 bg-black/15"><div className="flex items-center gap-2 border-b border-white/8 px-3 py-3"><span className="grid size-8 place-items-center rounded-full bg-violet-400/15 text-violet-200"><MessageCircle className="size-4" /></span><span><span className="block text-[11px] font-semibold text-white/80">Private conversation</span><span className="block text-[9px] text-white/40">Realtime · Supabase</span></span></div><div className="flex flex-1 flex-col items-center justify-center px-4 text-center"><span className="grid size-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-200"><ShieldCheck className="size-5" /></span><p className="mt-3 text-xs font-medium text-white/75">A private space for your messages</p><p className="mt-1 max-w-52 text-[10px] leading-4 text-white/40">Messages are saved to your account and delivered live.</p></div><div className="m-2 flex items-center rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-[10px] text-white/35">Write a message…<span className="ml-auto rounded-md bg-violet-500/30 px-2 py-1 text-white/80">Send</span></div></div>
            </div>
          </div>
          {!authConfigured && <p className="mt-3 text-center text-[11px] text-amber-200/80">Supabase environment variables are required to create an account.</p>}
        </section>
      </main>
      <footer className="px-5 pb-5 text-center text-[10px] text-muted-foreground">Nexus Chat · Developed by KrynPy Studio</footer>
    </div>
  );
}
