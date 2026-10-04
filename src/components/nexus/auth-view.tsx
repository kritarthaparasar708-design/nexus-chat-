import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Globe2,
  Hexagon,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { BrandMark } from "./primitives";
import { useNexus } from "./state";

const SIGNUP_PHONE_COUNTRIES = [
  { iso: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { iso: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { iso: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { iso: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { iso: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { iso: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { iso: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { iso: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { iso: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { iso: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { iso: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { iso: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { iso: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
] as const;

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

function phoneVerificationError(reason: unknown, fallback: string): string {
  const message = reason instanceof Error ? reason.message.toLowerCase() : "";
  const isDuplicatePhone =
    message.includes("phone") &&
    ["already", "registered", "exists", "taken"].some((part) => message.includes(part));
  if (isDuplicatePhone) {
    return "Phone number already registered. Log in or use a different number.";
  }
  if (
    (message.includes("phone") || message.includes("sms")) &&
    ["not configured", "not enabled", "disabled", "provider"].some((part) => message.includes(part))
  ) {
    return "Phone verification is not configured. Ask the administrator to enable Supabase phone authentication and SMS delivery.";
  }
  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch")
  ) {
    return "Unable to connect to the authentication service. Check your connection and try again.";
  }
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

function signupErrorMessage(reason: unknown): string {
  const message = reason instanceof Error ? reason.message : "";
  const normalized = message.toLowerCase();
  if (
    normalized.includes("user already registered") ||
    (normalized.includes("email") &&
      ["already", "registered", "exists", "taken"].some((part) =>
        normalized.includes(part),
      ))
  ) {
    return "Email already registered. Log in or use another email address.";
  }
  if (normalized.includes("invalid email")) return "Invalid email address.";
  if (
    normalized.includes("password") &&
    ["weak", "too short", "at least", "should be", "minimum"].some((part) =>
      normalized.includes(part),
    )
  ) {
    return "Password is too weak. Choose a stronger password and try again.";
  }
  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("fetch")
  ) {
    return "Unable to connect to the authentication service. Check your connection and try again.";
  }
  return message || "Unable to create your account. Please try again.";
}

function logSafeSignupDiagnostic(reason: unknown) {
  if (!import.meta.env.DEV) return;
  const detail =
    reason && typeof reason === "object" ? (reason as Record<string, unknown>) : {};
  const code =
    typeof detail["code"] === "string" &&
    /^[A-Za-z0-9_-]{1,80}$/.test(detail["code"])
      ? detail["code"]
      : undefined;
  const status = typeof detail["status"] === "number" ? detail["status"] : undefined;
  console.error("Signup failed:", {
    name: reason instanceof Error ? reason.name : typeof reason,
    code,
    status,
  });
}

function googleOAuthErrorMessage(reason: unknown): string {
  const message =
    reason instanceof Error
      ? reason.message.trim()
      : typeof reason === "object" &&
          reason !== null &&
          "message" in reason &&
          typeof reason.message === "string"
        ? reason.message.trim()
        : "";
  if (/failed to fetch|network|fetch/i.test(message)) {
    return "Unable to connect to the authentication service. Check your connection and try again.";
  }
  return message || "Unable to continue with Google right now. Please try again.";
}

async function startGoogleOAuth() {
  if (!supabase) {
    throw new Error(
      "Supabase configuration is missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export function LoginView() {
  const { actions, authUser, authLoading, authConfigured } = useNexus();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && authUser) void navigate({ to: "/messages", replace: true });
  }, [authLoading, authUser, navigate]);

  async function continueWithGoogle() {
    setError("");
    if (!authConfigured) {
      setError(
        "Supabase configuration is missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      return;
    }
    setBusy(true);
    try {
      await startGoogleOAuth();
    } catch (reason) {
      setError(googleOAuthErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanIdentifier = identifier.trim();
    const compactPhone = cleanIdentifier.replace(/[\s().-]/g, "");
    const isPhone = /^\+[1-9]\d{7,14}$/.test(compactPhone);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier);
    if (!isEmail && !isPhone) {
      setError(
        "Enter a valid email address or phone number with its country code (for example, +14155550123).",
      );
      return;
    }
    if (password.length === 0) {
      setError("Enter your password.");
      return;
    }
    if (!authConfigured) {
      setError(
        "Supabase configuration is missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      return;
    }
    setBusy(true);
    try {
      await actions.signIn(cleanIdentifier, password);
      await navigate({ to: "/messages", replace: true });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message.toLowerCase() : "";
      if (message.includes("email not confirmed")) {
        setError("Please verify your email before logging in.");
      } else if (message.includes("phone not confirmed")) {
        setError("Please verify your phone number before logging in.");
      } else if (
        message.includes("invalid login credentials") ||
        message.includes("invalid credentials") ||
        message.includes("user not found")
      ) {
        setError(
          "Your email or phone number and password don't match. Check your details or create an account.",
        );
      } else if (
        message.includes("failed to fetch") ||
        message.includes("network") ||
        message.includes("fetch")
      ) {
        setError(
          "Unable to connect to the authentication service. Check your connection and try again.",
        );
      } else {
        setError("Unable to log in right now. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nexus-auth-page nexus-login-page">
      <div className="nexus-login-ambient" aria-hidden="true" />
      <main className="nexus-login-main">
        <section className="nexus-login-card" aria-label="Log in to Nexus">
          <div className="nexus-login-form-panel">
            <Link to="/welcome" className="nexus-login-brand" aria-label="Nexus Chat home">
              <BrandMark compact />
              <span className="nexus-login-brand-copy">
                <strong>Nexus</strong>
                <small>Chat Beyond Limits</small>
              </span>
            </Link>

            <div className="nexus-login-intro">
              <span className="nexus-login-eyebrow">
                <Sparkles className="size-3.5" /> YOUR SPACE, YOUR PEOPLE
              </span>
              <h1 id="nexus-login-title">
                Log in to <span>Nexus</span>
              </h1>
              <p>
                Continue your conversations, stay connected
                <br className="hidden sm:block" /> and never miss a moment.
              </p>
            </div>

            <div
              className="nexus-login-social"
              role="group"
              aria-label="Social login options"
              aria-describedby="nexus-social-status"
            >
              <button
                type="button"
                className="nexus-login-social-button"
                disabled={busy || !authConfigured}
                onClick={() => void continueWithGoogle()}
              >
                <span className="nexus-google-g" aria-hidden="true">
                  G
                </span>
                Continue with Google
              </button>
              <button
                type="button"
                className="nexus-login-social-button"
                disabled
                title="Apple login is not configured yet."
              >
                <span className="nexus-apple-mark" aria-hidden="true">
                  ●
                </span>
                Continue with Apple
              </button>
            </div>
            <p id="nexus-social-status" className="nexus-login-social-note">
              Apple login is unavailable until its provider is configured in Supabase.
            </p>

            <div className="nexus-divider nexus-login-divider">
              <span>OR CONTINUE WITH EMAIL OR PHONE</span>
            </div>

            <form
              className="nexus-login-form"
              onSubmit={(event) => void submit(event)}
              aria-labelledby="nexus-login-title"
              noValidate
            >
              <div className="nexus-login-field">
                <label htmlFor="nexus-login-identifier">Email or Phone number</label>
                <span className="nexus-login-input-wrap">
                  <Mail className="nexus-login-input-icon" aria-hidden="true" />
                  <input
                    id="nexus-login-identifier"
                    className="nexus-login-input"
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="Enter your email or phone number"
                    aria-describedby={error ? "nexus-login-error" : undefined}
                    required
                  />
                </span>
              </div>

              <div className="nexus-login-field">
                <label htmlFor="nexus-login-password">Password</label>
                <span className="nexus-login-input-wrap">
                  <LockKeyhole className="nexus-login-input-icon" aria-hidden="true" />
                  <input
                    id="nexus-login-password"
                    className="nexus-login-input nexus-login-password-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    aria-describedby={error ? "nexus-login-error" : undefined}
                    required
                  />
                  <button
                    type="button"
                    className="nexus-password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </span>
              </div>

              <div className="nexus-login-forgot-row">
                <Link to="/reset-password" className="nexus-login-link">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p id="nexus-login-error" className="nexus-login-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="nexus-login-submit"
                disabled={busy || authLoading}
                aria-busy={busy}
              >
                <span>{busy ? "Logging in..." : "Log in"}</span>
                {busy ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight className="size-4" aria-hidden="true" />
                )}
              </button>
            </form>

            <p className="nexus-login-signup">
              Don't have an account?{" "}
              <Link to="/signup" className="nexus-login-link">
                Create one
              </Link>
            </p>
          </div>

          <aside className="nexus-login-promo" aria-labelledby="nexus-login-promo-title">
            <div className="nexus-login-promo-copy">
              <span className="nexus-login-promo-kicker">
                <span className="nexus-live-dot" /> THE CONVERSATION, REIMAGINED
              </span>
              <h2 id="nexus-login-promo-title">More Than Just Chat</h2>
              <p>
                Fast. Private. Real-time.
                <br />
                <strong>That's Nexus.</strong>
              </p>
            </div>

            <div
              className="nexus-login-artwork"
              role="img"
              aria-label="Decorative demo conversation with fictional participants, not connected to a real account"
            >
              <div className="nexus-login-art-orbit nexus-login-art-orbit-one" />
              <div className="nexus-login-art-orbit nexus-login-art-orbit-two" />
              <div className="nexus-login-float-chip">
                <span className="nexus-login-float-icon">
                  <MessageCircle className="size-4" />
                </span>
                <span>
                  <strong>Moments, together</strong>
                  <small>Even miles apart</small>
                </span>
                <span className="nexus-login-float-spark">✦</span>
              </div>
              <div className="nexus-login-chat-preview" aria-hidden="true">
                <div className="nexus-login-chat-header">
                  <span className="nexus-login-demo-avatar">K</span>
                  <span className="nexus-login-demo-profile">
                    <strong>Kryt</strong>
                    <small>
                      <i /> Online
                    </small>
                  </span>
                  <span className="nexus-login-chat-menu">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
                <div className="nexus-login-chat-messages">
                  <div className="nexus-login-demo-message">
                    <span>Hey! Are you free now?</span>
                    <time>10:42</time>
                  </div>
                  <div className="nexus-login-demo-message nexus-login-demo-message-out">
                    <span>Yeah, let's talk! 🚀</span>
                    <time>
                      10:42 <b>✓✓</b>
                    </time>
                  </div>
                  <div className="nexus-login-demo-typing">
                    <i />
                    <i />
                    <i />
                    <span>Kryt is typing</span>
                  </div>
                </div>
                <div className="nexus-login-chat-compose">
                  <span>Write a message...</span>
                  <span className="nexus-login-compose-send">
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
              <div className="nexus-login-art-caption">
                <span className="nexus-login-caption-signal">
                  <i />
                  <i />
                  <i />
                </span>{" "}
                A little closer, wherever you are
              </div>
            </div>

            <div className="nexus-login-features" aria-label="Nexus features">
              <div>
                <Zap aria-hidden="true" />
                <span>
                  <strong>Real-time</strong>
                  <small>Messaging</small>
                </span>
              </div>
              <div>
                <ShieldCheck aria-hidden="true" />
                <span>
                  <strong>Privacy</strong>
                  <small>Protected</small>
                </span>
              </div>
              <div>
                <UsersRound aria-hidden="true" />
                <span>
                  <strong>Stay Close</strong>
                  <small>With Friends</small>
                </span>
              </div>
              <div>
                <Globe2 aria-hidden="true" />
                <span>
                  <strong>Available</strong>
                  <small>Everywhere</small>
                </span>
              </div>
            </div>
          </aside>
        </section>
      </main>
      <footer className="nexus-login-footer">
        Nexus Chat <span>·</span> Chat Beyond Limits
      </footer>
    </div>
  );
}
export function SignupView() {
  const { actions, authUser, authLoading, authConfigured } = useNexus();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryIso, setCountryIso] = useState("IN");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<
    "email" | "phone" | "password" | "confirm" | "form" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const selectedCountry =
    SIGNUP_PHONE_COUNTRIES.find((country) => country.iso === countryIso) ??
    SIGNUP_PHONE_COUNTRIES[0];

  useEffect(() => {
    if (!authLoading && authUser) void navigate({ to: "/verify", replace: true });
  }, [authLoading, authUser, navigate]);

  async function continueWithGoogle() {
    setError("");
    setErrorField(null);
    if (!authConfigured) {
      setError(
        "Supabase configuration is missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      setErrorField("form");
      return;
    }
    setBusy(true);
    try {
      await startGoogleOAuth();
    } catch (reason) {
      setError(googleOAuthErrorMessage(reason));
      setErrorField("form");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setErrorField(null);
    const cleanEmail = email.trim().toLowerCase();
    const compactPhone = phone.trim().replace(/[\s().-]/g, "");
    const hasInternationalPrefix = compactPhone.startsWith("+") || compactPhone.startsWith("00");
    let nationalDigits = compactPhone.replace(/\D/g, "");
    const callingCodeDigits = selectedCountry.dialCode.slice(1);
    if (hasInternationalPrefix) {
      nationalDigits = nationalDigits.replace(/^00/, "");
      if (!nationalDigits.startsWith(callingCodeDigits)) {
        setError("Invalid phone number. Choose the matching country code and try again.");
        setErrorField("phone");
        return;
      }
      nationalDigits = nationalDigits.slice(callingCodeDigits.length);
    }
    nationalDigits = nationalDigits.replace(/^0+/, "");
    const cleanPhone = `${selectedCountry.dialCode}${nationalDigits}`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Invalid email address.");
      setErrorField("email");
      return;
    }
    if (/[^\d+]/.test(compactPhone) || !/^\+[1-9]\d{7,14}$/.test(cleanPhone)) {
      setError("Invalid phone number. Check the number and country calling code.");
      setErrorField("phone");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setErrorField("password");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setErrorField("confirm");
      return;
    }
    if (!authConfigured) {
      setError(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for this environment, then reload the app.",
      );
      setErrorField("form");
      return;
    }
    setBusy(true);
    try {
      await actions.signUp(cleanEmail, cleanPhone, password);
      await navigate({ to: "/verify", replace: true });
    } catch (reason) {
      logSafeSignupDiagnostic(reason);
      const userMessage = signupErrorMessage(reason);
      setError(userMessage);
      if (userMessage === "Invalid email address.") setErrorField("email");
      setErrorField((current) => current ?? "form");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nexus-auth-page nexus-login-page nexus-signup-page">
      <div className="nexus-login-ambient" aria-hidden="true" />
      <main className="nexus-login-main">
        <section className="nexus-login-card nexus-signup-card" aria-label="Create a Nexus account">
          <div className="nexus-login-form-panel nexus-signup-form-panel">
            <Link to="/welcome" className="nexus-login-brand" aria-label="Nexus Chat home">
              <BrandMark compact />
              <span className="nexus-login-brand-copy">
                <strong>Nexus</strong>
                <small>Chat Beyond Limits</small>
              </span>
            </Link>

            <div className="nexus-login-intro nexus-signup-intro">
              <span className="nexus-login-eyebrow">
                <Sparkles className="size-3.5" aria-hidden="true" /> YOUR SPACE, YOUR PEOPLE
              </span>
              <h1 id="nexus-signup-title">
                Create your
                <br /> <span>Nexus</span> account
              </h1>
              <p>
                Create your account and start chatting,
                <br className="hidden sm:block" /> sharing moments, and staying connected.
              </p>
            </div>

            <div
              className="nexus-login-social nexus-signup-social"
              role="group"
              aria-label="Social signup options"
              aria-describedby="nexus-signup-social-status"
            >
              <button
                type="button"
                className="nexus-login-social-button"
                disabled={busy || !authConfigured}
                onClick={() => void continueWithGoogle()}
              >
                <svg className="nexus-signup-provider-icon" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"
                  />
                </svg>
                Continue with Google
              </button>
              <button
                type="button"
                className="nexus-login-social-button"
                disabled
                title="Apple signup is unavailable until Apple is configured in Supabase."
              >
                <svg
                  className="nexus-signup-provider-icon nexus-signup-apple-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M16.37 12.43c.02 2.12 1.86 2.83 1.88 2.84-.02.05-.29 1.02-.96 2.02-.58.86-1.19 1.72-2.14 1.74-.93.02-1.23-.56-2.3-.56-1.06 0-1.4.54-2.28.58-.91.04-1.6-.93-2.18-1.78-1.19-1.72-2.1-4.86-.88-6.98.61-1.05 1.7-1.72 2.88-1.74.9-.02 1.74.61 2.29.61.54 0 1.56-.76 2.63-.65.45.02 1.72.18 2.54 1.38-.07.04-1.52.89-1.5 2.54Zm-1.73-5.1c.48-.58.81-1.39.72-2.19-.7.03-1.55.46-2.05 1.04-.45.52-.84 1.34-.73 2.12.78.06 1.58-.4 2.06-.97Z" />
                </svg>
                Continue with Apple
              </button>
            </div>
            <p
              id="nexus-signup-social-status"
              className="nexus-login-social-note nexus-signup-social-status"
            >
              Apple signup is unavailable until its provider is enabled in Supabase.
            </p>

            <div
              className="nexus-divider nexus-login-divider nexus-signup-divider"
              aria-hidden="true"
            >
              <span>OR</span>
            </div>

            <form
              className="nexus-login-form nexus-signup-form"
              onSubmit={(event) => void submit(event)}
              aria-labelledby="nexus-signup-title"
              noValidate
            >
              <div className="nexus-login-field">
                <label htmlFor="nexus-signup-email">Email / Gmail</label>
                <span className="nexus-login-input-wrap">
                  <Mail className="nexus-login-input-icon" aria-hidden="true" />
                  <input
                    id="nexus-signup-email"
                    className="nexus-login-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setErrorField(null);
                    }}
                    placeholder="Enter your email address"
                    aria-invalid={errorField === "email"}
                    aria-describedby={errorField === "email" ? "nexus-signup-error" : undefined}
                    required
                  />
                </span>
                {errorField === "email" && (
                  <p id="nexus-signup-error" className="nexus-login-error" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="nexus-login-field">
                <label htmlFor="nexus-signup-phone">Phone number</label>
                <div className="nexus-signup-phone-control">
                  <span className="nexus-signup-country-select-wrap">
                    <span className="nexus-signup-country-display" aria-hidden="true">
                      <span className="nexus-signup-country-flag">{selectedCountry.flag}</span>
                      <span>{selectedCountry.dialCode}</span>
                      <ChevronDown className="nexus-signup-country-chevron" />
                    </span>
                    <select
                      id="nexus-signup-country"
                      className="nexus-signup-country-select"
                      value={countryIso}
                      aria-label="Country calling code"
                      onChange={(event) => {
                        setCountryIso(event.target.value);
                        setError("");
                        setErrorField(null);
                      }}
                    >
                      {SIGNUP_PHONE_COUNTRIES.map((country) => (
                        <option key={country.iso} value={country.iso}>
                          {country.flag} {country.name} ({country.dialCode})
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className="nexus-login-input-wrap nexus-signup-phone-input-wrap">
                    <Phone className="nexus-login-input-icon" aria-hidden="true" />
                    <input
                      id="nexus-signup-phone"
                      className="nexus-login-input nexus-signup-phone-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setError("");
                        setErrorField(null);
                      }}
                      placeholder="Enter your phone number"
                      aria-invalid={errorField === "phone"}
                      aria-describedby={`nexus-signup-phone-help${errorField === "phone" ? " nexus-signup-error" : ""}`}
                      required
                    />
                  </span>
                </div>
                <span id="nexus-signup-phone-help" className="nexus-signup-field-help">
                  Include your country code. This number is private.
                </span>
                {errorField === "phone" && (
                  <p id="nexus-signup-error" className="nexus-login-error" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="nexus-login-field">
                <label htmlFor="nexus-signup-password">Password</label>
                <span className="nexus-login-input-wrap">
                  <LockKeyhole className="nexus-login-input-icon" aria-hidden="true" />
                  <input
                    id="nexus-signup-password"
                    className="nexus-login-input nexus-login-password-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                      setErrorField(null);
                    }}
                    placeholder="Create a password"
                    aria-invalid={errorField === "password"}
                    aria-describedby={errorField === "password" ? "nexus-signup-error" : undefined}
                    required
                  />
                  <button
                    type="button"
                    className="nexus-password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </span>
                {errorField === "password" && (
                  <p id="nexus-signup-error" className="nexus-login-error" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="nexus-login-field">
                <label htmlFor="nexus-signup-confirm-password">Confirm password</label>
                <span className="nexus-login-input-wrap">
                  <LockKeyhole className="nexus-login-input-icon" aria-hidden="true" />
                  <input
                    id="nexus-signup-confirm-password"
                    className="nexus-login-input nexus-login-password-input"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                      setErrorField(null);
                    }}
                    placeholder="Confirm your password"
                    aria-invalid={errorField === "confirm"}
                    aria-describedby={errorField === "confirm" ? "nexus-signup-error" : undefined}
                    required
                  />
                  <button
                    type="button"
                    className="nexus-password-toggle"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    aria-label={
                      showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </span>
                {errorField === "confirm" && (
                  <p id="nexus-signup-error" className="nexus-login-error" role="alert">
                    {error}
                  </p>
                )}
              </div>

              {error &&
                errorField !== "email" &&
                errorField !== "phone" &&
                errorField !== "password" &&
                errorField !== "confirm" && (
                  <p id="nexus-signup-error" className="nexus-login-error" role="alert">
                    {error}
                  </p>
                )}

              <button
                type="submit"
                className="nexus-login-submit nexus-signup-submit"
                disabled={busy || authLoading}
                aria-busy={busy}
              >
                <span>{busy ? "Creating account..." : "Create account"}</span>
                {busy ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight className="size-4" aria-hidden="true" />
                )}
              </button>
            </form>

            <p className="nexus-login-signup">
              Already have an account?{" "}
              <Link to="/login" className="nexus-login-link">
                Log in
              </Link>
            </p>
          </div>

          <aside
            className="nexus-login-promo nexus-signup-promo"
            aria-labelledby="nexus-signup-promo-title"
          >
            <div className="nexus-login-promo-copy nexus-signup-promo-copy">
              <span className="nexus-login-promo-kicker">
                <span className="nexus-live-dot" aria-hidden="true" /> THE NEXUS CONNECTION
              </span>
              <h2 id="nexus-signup-promo-title">Connect. Chat. Stay Close.</h2>
              <p>
                Everything you need to stay connected
                <br className="hidden sm:block" /> with the people who matter.
              </p>
            </div>

            <div className="nexus-signup-artwork" aria-hidden="true">
              <div className="nexus-signup-network-orbit nexus-signup-network-orbit-one" />
              <div className="nexus-signup-network-orbit nexus-signup-network-orbit-two" />
              <div className="nexus-signup-contact-card nexus-signup-contact-one">
                <span className="nexus-signup-avatar nexus-signup-avatar-violet">M</span>
                <span className="nexus-signup-contact-copy">
                  <strong>Maya Chen</strong>
                  <small>
                    <i /> Online now
                  </small>
                </span>
                <MessageCircle className="nexus-signup-contact-icon" />
              </div>
              <div className="nexus-signup-contact-card nexus-signup-contact-two">
                <span className="nexus-signup-avatar nexus-signup-avatar-blue">T</span>
                <span className="nexus-signup-contact-copy">
                  <strong>Theo Park</strong>
                  <small>New conversation</small>
                </span>
                <span className="nexus-signup-unread">2</span>
              </div>
              <div className="nexus-signup-connected">
                <span className="nexus-signup-connected-icon">
                  <Check className="size-4" />
                </span>
                <span>
                  <strong>You're connected</strong>
                  <small>Your people, all in one place</small>
                </span>
              </div>
              <div className="nexus-signup-message-float">
                <span className="nexus-signup-message-mark">
                  <MessageCircle className="size-3.5" />
                </span>
                <span>Good to hear from you ✨</span>
              </div>
            </div>

            <div className="nexus-login-features nexus-signup-features" aria-label="Nexus features">
              <div>
                <Zap aria-hidden="true" />
                <span>
                  <strong>Real-time</strong>
                  <small>Messaging</small>
                </span>
              </div>
              <div>
                <UsersRound aria-hidden="true" />
                <span>
                  <strong>Stay Connected</strong>
                  <small>With Friends</small>
                </span>
              </div>
              <div>
                <Search aria-hidden="true" />
                <span>
                  <strong>Find People</strong>
                  <small>Instantly</small>
                </span>
              </div>
              <div>
                <Globe2 aria-hidden="true" />
                <span>
                  <strong>Available</strong>
                  <small>Everywhere</small>
                </span>
              </div>
            </div>
          </aside>
        </section>
      </main>
      <footer className="nexus-login-footer">
        Nexus Chat <span>·</span> Chat Beyond Limits
      </footer>
    </div>
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
  const {
    actions,
    authUser,
    authLoading,
    authConfigured,
    signupNeedsEmailConfirmation,
  } = useNexus();
  const navigate = useNavigate();
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const requested = useRef(false);
  const signupPhone =
    typeof authUser?.user_metadata["signup_phone"] === "string"
      ? authUser.user_metadata["signup_phone"]
      : "";
  const phone = signupPhone || authUser?.phone || "";
  const activePhone = phone || phoneNumber;
  const emailVerified = Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
  const phoneVerified = Boolean(authUser?.phone_confirmed_at && authUser.phone);

  useEffect(() => {
    if (emailVerified && phoneVerified) void navigate({ to: "/profile", replace: true });
  }, [emailVerified, phoneVerified, navigate]);

  useEffect(() => {
    if (
      authLoading ||
      !authUser ||
      !emailVerified ||
      phoneVerified ||
      !phone ||
      requested.current
    ) return;
    requested.current = true;
    setSending(true);
    void actions.sendPhoneVerification(phone).then(() => {
      setPhoneSubmitted(true);
      setNotice(`A verification code was sent to ${phone}.`);
    }).catch((reason: unknown) => {
      setError(phoneVerificationError(reason, "Unable to send a phone verification code."));
    }).finally(() => setSending(false));
  }, [actions, authLoading, authUser, emailVerified, phoneVerified, phone]);

  async function submitPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const fullInternationalPhoneNumber = phoneNumber.trim().replace(/[\s().-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(fullInternationalPhoneNumber)) {
      setError(
        "Enter a valid phone number in international format, including its country code (for example, +14155550123).",
      );
      return;
    }
    requested.current = true;
    setSending(true);
    try {
      await actions.sendPhoneVerification(fullInternationalPhoneNumber);
      setPhoneNumber(fullInternationalPhoneNumber);
      setPhoneSubmitted(true);
      setNotice(`A verification code was sent to ${fullInternationalPhoneNumber}.`);
    } catch (reason) {
      setError(phoneVerificationError(reason, "Unable to send a phone verification code."));
    } finally {
      setSending(false);
    }
  }

  async function resend() {
    setError("");
    setNotice("");
    setSending(true);
    try {
      await actions.sendPhoneVerification(activePhone);
      setNotice(`A verification code was sent to ${activePhone}.`);
    } catch (reason) {
      setError(phoneVerificationError(reason, "Unable to send a phone verification code."));
    } finally {
      setSending(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setVerifying(true);
    try {
      await actions.verifyPhone(phoneCode.trim(), activePhone);
      await navigate({ to: "/profile", replace: true });
    } catch (reason) {
      setError(phoneVerificationError(reason, "Phone verification failed."));
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
          {signupNeedsEmailConfirmation && !authUser ? (
            <AuthNotice>
              Account created. Check your email to verify your account. After confirming, return here
              to verify your phone and complete your profile.
            </AuthNotice>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Check your email for a confirmation link. After confirming it, this page will continue
              to phone verification. If you already confirmed, open the link again to return here.
            </p>
          )}
          {authUser?.email && <AuthNotice>A confirmation email was sent to {authUser.email}.</AuthNotice>}
          <Link to="/login" className="nexus-secondary-button w-full justify-center">Return to log in</Link>
        </div>
      </AuthLayout>
    );
  }
  if (!phone && !phoneSubmitted) {
    return (
      <AuthLayout
        title="Phone verification required"
        subtitle="Enter your phone number in international format to receive a verification code."
        backTo="/login"
      >
        <form className="space-y-4" onSubmit={(event) => void submitPhone(event)}>
          <AuthNotice>
            <ShieldCheck className="mr-1 inline size-3.5" />
            Email verified. Add a phone number to complete your account.
          </AuthNotice>
          <label className="nexus-form-label">
            Phone number
            <input
              className="nexus-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(event) => {
                setPhoneNumber(event.target.value);
                setError("");
              }}
              placeholder="+14155550123"
              required
            />
          </label>
          {error && <AuthNotice error>{error}</AuthNotice>}
          <button type="submit" className="nexus-primary-button w-full" disabled={sending}>
            {sending ? <LoaderCircle className="size-4 animate-spin" /> : null} Send verification code
          </button>
        </form>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title="Verify your phone" subtitle={`Enter the code sent to ${activePhone}.`} backTo="/login">
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
