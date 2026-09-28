import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Hexagon,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BrandMark, Modal } from "./primitives";
import { useNexus } from "./state";

function AuthLayout({
  title,
  subtitle,
  children,
  backTo = "/welcome",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  backTo?: "/welcome" | "/login" | "/signup";
}) {
  return (
    <div className="nexus-auth-page">
      <div className="nexus-auth-backdrop" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/welcome">
          <BrandMark />
        </Link>
        <Link to={backTo} className="nexus-text-button flex items-center gap-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/12 text-primary shadow-[0_0_32px_-12px_rgba(168,85,247,.9)]">
              <Hexagon className="size-6 fill-current" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
          <div className="nexus-auth-card">{children}</div>
        </div>
      </main>
      <footer className="px-5 pb-5 text-center text-[10px] text-muted-foreground">
        Nexus Chat demo · Local state only · No production authentication connected
      </footer>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  label = "Password",
  autoComplete = "current-password",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="nexus-form-label">
      {label}
      <span className="relative">
        <input
          className="nexus-input pr-10"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
        />{" "}
        <button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  );
}

export function LoginView() {
  const { actions } = useNexus();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }
    actions.setSession({ authenticated: true, email: email.trim(), pendingEmail: "" });
    navigate({ to: "/messages" });
  }
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <form className="space-y-4" onSubmit={submit}>
        <label className="nexus-form-label">
          Email address
          <span className="relative">
            <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="nexus-input pl-10"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="you@example.com"
            />
          </span>
        </label>
        <PasswordField
          value={password}
          onChange={(value) => {
            setPassword(value);
            setError("");
          }}
        />
        <div className="flex justify-end">
          <button
            type="button"
            className="nexus-text-button text-xs"
            onClick={() => setNotice("Password recovery is not connected in this local demo.")}
          >
            Forgot password?
          </button>
        </div>
        {error && (
          <p className="nexus-form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="nexus-primary-button w-full">
          Sign in <ArrowRight className="size-4" />
        </button>
      </form>
      <div className="nexus-divider">
        <span>or continue with</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            actions.setSession({ authenticated: true, email: "google-demo@nexus.chat" });
            navigate({ to: "/messages" });
          }}
          className="nexus-secondary-button justify-center"
        >
          <span className="font-bold text-red-300">G</span> Google
        </button>
        <button
          type="button"
          onClick={() => {
            actions.setSession({ authenticated: true, email: "apple-demo@nexus.chat" });
            navigate({ to: "/messages" });
          }}
          className="nexus-secondary-button justify-center"
        >
          <Apple className="size-4" /> Apple
        </button>
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        New to Nexus?{" "}
        <Link to="/signup" className="nexus-text-button">
          Create an account
        </Link>
      </p>
      {notice && (
        <p className="mt-4 rounded-xl border border-primary/20 bg-primary/8 px-3 py-2 text-center text-xs text-primary">
          {notice}
        </p>
      )}
    </AuthLayout>
  );
}

export function SignupView() {
  const { actions } = useNexus();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (
      fullName.trim().length < 2 ||
      !email.includes("@") ||
      username.trim().length < 3 ||
      password.length < 8
    ) {
      setError("Use a name, valid email, username, and an 8-character password.");
      return;
    }
    actions.updateProfile({
      name: fullName.trim(),
      username: `@${username.trim().replace(/^@/, "")}`,
      email: email.trim(),
      initials: fullName
        .trim()
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      ...(avatar ? { avatar } : {}),
    });
    actions.setSession({ authenticated: false, pendingEmail: email.trim() });
    navigate({ to: "/verify" });
  }
  return (
    <AuthLayout title="Create your account" subtitle="Start a calmer, more connected way to chat.">
      <form className="space-y-4" onSubmit={submit}>
        <label className="nexus-form-label">
          Full name
          <span className="relative">
            <UserRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="nexus-input pl-10"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Kritartha Parasar"
            />
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="nexus-form-label">
            Email
            <input
              className="nexus-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="nexus-form-label">
            Username
            <input
              className="nexus-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="kritartha"
            />
          </label>
        </div>
        <PasswordField
          label="Create password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
        <label className="nexus-secondary-button w-full cursor-pointer justify-center">
          <UserRound className="size-4" />
          {avatar ? "Avatar selected" : "Add a profile avatar"}
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </label>
        {error && (
          <p className="nexus-form-error" role="alert">
            {error}
          </p>
        )}
        <label className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
          <input type="checkbox" required className="mt-1 accent-primary" />I agree to the demo
          Terms of Service and Privacy Policy.
        </label>
        <button type="submit" className="nexus-primary-button w-full">
          Create account <ArrowRight className="size-4" />
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="nexus-text-button">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export function VerifyView() {
  const { state, actions } = useNexus();
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(28);
  const [error, setError] = useState("");
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);
  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    if (digit && index < 5) refs.current[index + 1]?.focus();
    setError("");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const entered = code.join("");
    if (entered !== state.session.verificationCode) {
      setError(`That code does not match. This demo uses ${state.session.verificationCode}.`);
      return;
    }
    actions.setSession({
      authenticated: true,
      email: state.session.pendingEmail || state.session.email,
    });
    navigate({ to: "/messages" });
  }
  return (
    <AuthLayout
      title="Verify your phone"
      subtitle={`Enter the 6-digit code sent to ${state.session.pendingEmail || "your contact"}.`}
      backTo="/signup"
    >
      <form onSubmit={submit}>
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                refs.current[index] = element;
              }}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              className="nexus-code-input"
              aria-label={`Verification digit ${index + 1}`}
            />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-primary/8 px-3 py-2 text-[11px] text-primary">
          <ShieldCheck className="size-3.5" /> Demo code: {state.session.verificationCode}
        </div>
        {error && (
          <p className="nexus-form-error mt-4 text-center" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="nexus-primary-button mt-5 w-full">
          Verify account <Check className="size-4" />
        </button>
      </form>
      <div className="mt-5 text-center text-xs text-muted-foreground">
        {seconds > 0 ? (
          <>
            Resend code in{" "}
            <span className="font-semibold text-foreground">
              00:{String(seconds).padStart(2, "0")}
            </span>
          </>
        ) : (
          <button type="button" className="nexus-text-button" onClick={() => setSeconds(28)}>
            Resend code
          </button>
        )}
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <LockKeyhole className="size-3" /> Demo verification only. No SMS is sent.
      </div>
    </AuthLayout>
  );
}

export function AuthHint({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Demo authentication" onClose={onClose}>
      <p className="text-sm leading-6 text-muted-foreground">
        This build keeps auth state in localStorage for prototyping. Replace the session actions
        with your identity provider before using real accounts.
      </p>
    </Modal>
  );
}
