import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Hexagon, LoaderCircle, LockKeyhole, Mail, Phone, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BrandMark } from "./primitives";
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
        <Link to="/welcome"><BrandMark /></Link>
        <Link to={backTo} className="nexus-text-button flex items-center gap-2"><ArrowLeft className="size-3.5" /> Back</Link>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/12 text-primary shadow-[0_0_32px_-12px_rgba(168,85,247,.9)]"><Hexagon className="size-6 fill-current" /></span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
          <div className="nexus-auth-card">{children}</div>
        </div>
      </main>
      <footer className="px-5 pb-5 text-center text-[10px] text-muted-foreground">Nexus Chat · Developed by KrynPy Studio</footer>
    </div>
  );
}

function PasswordField({ label = "Password", value, onChange, autoComplete }: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="nexus-form-label">
      {label}
      <span className="relative">
        <LockKeyhole className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input className="nexus-input pl-10" type="password" autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} placeholder="At least 8 characters" required minLength={8} />
      </span>
    </label>
  );
}

function AuthNotice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <p role={error ? "alert" : "status"} className={`rounded-xl border px-3 py-2 text-xs leading-5 ${error ? "border-destructive/30 bg-destructive/8 text-destructive" : "border-primary/20 bg-primary/8 text-muted-foreground"}`}>{children}</p>;
}

export function LoginView() {
  const { actions, authUser, authLoading, authConfigured } = useNexus();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && authUser) void navigate({ to: "/messages", replace: true });
  }, [authLoading, authUser, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!authConfigured) return setError("Supabase is not configured yet. Add your project URL and anon key, then reload.");
    setBusy(true);
    try {
      await actions.signIn(identifier, password);
      await navigate({ to: "/messages", replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <label className="nexus-form-label">
          Email or phone
          <span className="relative">
            <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input className="nexus-input pl-10" type="text" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@example.com or +14155550123" required />
          </span>
        </label>
        <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="flex justify-end">
          <Link to="/reset-password" className="nexus-text-button text-xs">Forgot password?</Link>
        </div>
        {error && <AuthNotice error>{error}</AuthNotice>}
        <button type="submit" className="nexus-primary-button w-full" disabled={busy || authLoading}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : null} Log in <ArrowRight className="size-4" />
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">Don't have an account? <Link to="/signup" className="nexus-text-button">Create account</Link></p>
    </AuthLayout>
  );
}

export function SignupView() {
  const { actions, authUser, authLoading, authConfigured } = useNexus();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && authUser) void navigate({ to: "/verify", replace: true });
  }, [authLoading, authUser, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s().-]/g, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return setError("Enter a valid email address.");
    if (!/^\+[1-9]\d{7,14}$/.test(cleanPhone)) return setError("Enter a valid phone number with country code, such as +14155550123.");
    if (password.length < 8) return setError("Your password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("The passwords do not match.");
    if (!authConfigured) return setError("Supabase is not configured yet. Add your project URL and anon key, then reload.");
    setBusy(true);
    try {
      await actions.signUp(cleanEmail, cleanPhone, password);
      await navigate({ to: "/verify", replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start with your email and phone. Your profile comes after verification.">
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <label className="nexus-form-label">Email / Gmail<span className="relative"><Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><input className="nexus-input pl-10" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></span></label>
        <label className="nexus-form-label">Phone number<span className="relative"><Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><input className="nexus-input pl-10" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+14155550123" required /></span><span className="text-[10px] font-normal text-muted-foreground">Include your country code. This number is private.</span></label>
        <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        {error && <AuthNotice error>{error}</AuthNotice>}
        <button type="submit" className="nexus-primary-button w-full" disabled={busy || authLoading}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : null} Create account <ArrowRight className="size-4" />
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">Already have an account? <Link to="/login" className="nexus-text-button">Log in</Link></p>
    </AuthLayout>
  );
}

export function ResetPasswordView() {
  const { actions, authConfigured, authLoading, authUser, passwordRecovery } = useNexus();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const resetMode = passwordRecovery && Boolean(authUser);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const description = params.get("error_description");
    if (description) setError(description.replace(/\+/g, " "));
  }, []);

  async function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try { await actions.requestPasswordReset(email.trim()); setNotice("If that email belongs to an account, Supabase will send a password reset link."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to send a password reset email."); }
    finally { setBusy(false); }
  }

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (password.length < 8) return setError("Your password must be at least 8 characters.");
    if (password !== confirm) return setError("The passwords do not match.");
    setBusy(true);
    try { await actions.updatePassword(password); setNotice("Your password has been changed."); await navigate({ to: "/messages", replace: true }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "This reset link is invalid or expired. Request a new link."); }
    finally { setBusy(false); }
  }

  return (
    <AuthLayout title={resetMode ? "Choose a new password" : "Reset your password"} subtitle={resetMode ? "Set a new password for your Nexus Chat account." : "We'll send a secure reset link to your email address."} backTo="/login">
      {!authConfigured ? <AuthNotice error>Configure Supabase before resetting a password.</AuthNotice> : authLoading ? <p className="text-center text-sm text-muted-foreground">Checking your reset link…</p> : resetMode ? (
        <form className="space-y-4" onSubmit={(event) => void reset(event)}><PasswordField value={password} onChange={setPassword} autoComplete="new-password" /><PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />{error && <AuthNotice error>{error}</AuthNotice>}{notice && <AuthNotice>{notice}</AuthNotice>}<button type="submit" className="nexus-primary-button w-full" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : null} Update password</button></form>
      ) : (
        <form className="space-y-4" onSubmit={(event) => void request(event)}><label className="nexus-form-label">Account email<span className="relative"><Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><input className="nexus-input pl-10" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></span></label>{error && <AuthNotice error>{error}</AuthNotice>}{notice && <AuthNotice>{notice}</AuthNotice>}<button type="submit" className="nexus-primary-button w-full" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : null} Send reset link</button><p className="text-center text-xs text-muted-foreground">If your link expired, request a new one here.</p></form>
      )}
    </AuthLayout>
  );
}

export function VerifyView() {
  const { actions, authUser, authLoading, authConfigured } = useNexus();
  const navigate = useNavigate();
  const [phoneCode, setPhoneCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const requested = useRef(false);
  const phone = typeof authUser?.user_metadata["signup_phone"] === "string" ? authUser.user_metadata["signup_phone"] : "";
  const emailVerified = Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
  const phoneVerified = Boolean(authUser?.phone_confirmed_at && authUser.phone);

  useEffect(() => {
    if (emailVerified && phoneVerified) void navigate({ to: "/profile", replace: true });
  }, [emailVerified, phoneVerified, navigate]);

  useEffect(() => {
    if (authLoading || !authUser || !emailVerified || phoneVerified || requested.current) return;
    requested.current = true;
    setSending(true);
    void actions.sendPhoneVerification().then(() => {
      setNotice(`A verification code was sent to ${phone}.`);
    }).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Unable to send a phone verification code.");
    }).finally(() => setSending(false));
  }, [actions, authLoading, authUser, emailVerified, phoneVerified, phone]);

  async function resend() {
    setError("");
    setNotice("");
    setSending(true);
    try {
      await actions.sendPhoneVerification();
      setNotice(`A verification code was sent to ${phone}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send a phone verification code.");
    } finally {
      setSending(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setVerifying(true);
    try {
      await actions.verifyPhone(phoneCode.trim());
      await navigate({ to: "/profile", replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Phone verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  if (!authConfigured) {
    return <AuthLayout title="Verify your account" subtitle="Supabase must be configured before account verification can continue."><AuthNotice error>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload this page.</AuthNotice></AuthLayout>;
  }
  if (authLoading) return <AuthLayout title="Checking verification" subtitle="Restoring your secure session."><p className="text-center text-sm text-muted-foreground">Loading…</p></AuthLayout>;
  if (!authUser || !emailVerified) {
    return (
      <AuthLayout title="Verify your email" subtitle="Open the confirmation link sent by Supabase to activate your account." backTo="/signup">
        <div className="space-y-4 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Mail className="size-5" /></span>
          <p className="text-sm leading-6 text-muted-foreground">After confirming your email, this page will continue to phone verification. If you already confirmed, open the link again to return here.</p>
          {authUser?.email && <AuthNotice>A confirmation email was sent to {authUser.email}.</AuthNotice>}
          <Link to="/login" className="nexus-secondary-button w-full justify-center">Return to log in</Link>
        </div>
      </AuthLayout>
    );
  }
  if (!phone) {
    return <AuthLayout title="Phone verification required" subtitle="No phone number was attached to this signup."><AuthNotice error>Sign up again with a phone number in international format.</AuthNotice></AuthLayout>;
  }
  return (
    <AuthLayout title="Verify your phone" subtitle={`Enter the code sent to ${phone}.`} backTo="/login">
      <form className="space-y-4" onSubmit={(event) => void verify(event)}>
        <AuthNotice><ShieldCheck className="mr-1 inline size-3.5" />Email verified. Complete phone verification to continue.</AuthNotice>
        {notice && <AuthNotice>{notice}</AuthNotice>}
        <label className="nexus-form-label">6-digit code<input className="nexus-input text-center text-lg tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
        {error && <AuthNotice error>{error}</AuthNotice>}
        <button type="submit" className="nexus-primary-button w-full" disabled={verifying || phoneCode.length !== 6}>{verifying ? <LoaderCircle className="size-4 animate-spin" /> : null} Verify phone</button>
        <button type="button" className="nexus-text-button w-full justify-center" onClick={() => void resend()} disabled={sending}>{sending ? "Sending code…" : "Resend code"}</button>
      </form>
    </AuthLayout>
  );
}
