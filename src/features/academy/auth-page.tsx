import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { configured, supabase, type Role } from "@/lib/academy";
import { useConfirm } from "@/features/academy/confirm";

export function AuthPage({ admin = false }: { admin?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [notice, setNotice] = useState("");
  // A refusal and a confirmation should not look the same.
  const [tone, setTone] = useState<"info" | "error">("info");
  const [busy, setBusy] = useState(false);
  const [differentAccount, setDifferentAccount] = useState(false);
  // "password" is the default because families remember a password more easily
  // than they find a one-time link; the link and reset flows share this email field.
  const [mode, setMode] = useState<"password" | "link">("password");
  const [creating, setCreating] = useState(false);
  // When the academy closes public sign up, offering a Create account tab would
  // only produce a refusal from the server, so the page asks first.
  const [signupOpen, setSignupOpen] = useState(true);
  const callback = admin ? "/admin/login" : "/login";
  const { ask, dialog } = useConfirm();

  useEffect(() => {
    const base = import.meta.env["VITE_SUPABASE_URL"];
    if (!base) return;
    let live = true;
    fetch(`${base}/auth/v1/settings`, { headers: { apikey: import.meta.env["VITE_SUPABASE_ANON_KEY"] } })
      .then(response => response.json())
      .then(settings => { if (live) setSignupOpen(!settings.disable_signup); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("error_description") || params.get("error");
    if (authError) say(authError, "error");
    let active = true;
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!active || error || !data.user) return;
      const { data: profile } = await supabase!.from("profiles").select("role").eq("id", data.user.id).single();
      if (!active) return;
      if (admin && profile?.role !== "admin") {
        setDifferentAccount(true);
        say("This account does not have academy admin access. Sign out to use a different account.", "error");
      } else if (profile?.role) {
        window.location.assign(`/portal/${profile.role}`);
      } else {
        say("Your account is signed in, but an academy role has not been assigned yet.");
        setDifferentAccount(true);
      }
    });
    return () => { active = false; };
  }, [admin]);

  function say(message: string, kind: "info" | "error" = "info") {
    setTone(kind);
    setNotice(message);
  }
  async function google() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${callback}` },
    });
    if (error) { say(error.message, "error"); setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    if (mode === "link") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}${callback}` },
      });
      setBusy(false);
      if (error) say(error.message, "error");
      else say("Check your email for a secure sign-in link.");
      return;
    }
    if (creating) {
      if (password !== confirm) { setBusy(false); say("Both passwords must match.", "error"); return; }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // The profile trigger reads full_name from here, so the academy sees a
        // person rather than an email address.
        options: { emailRedirectTo: `${window.location.origin}${callback}`, data: { full_name: name.trim() } },
      });
      setBusy(false);
      if (error) { say(error.message, "error"); return; }
      // Supabase answers a sign up for an address it already holds with a user that
      // carries no identities, and sends nothing, so that nobody can discover which
      // addresses have accounts. Saying "check your email" would leave them waiting.
      if (data.user && data.user.identities?.length === 0) {
        setCreating(false);
        say("An account already exists for this email. Sign in with Google, or choose Forgot password to set one.", "error");
        return;
      }
      // Without a session the project requires email confirmation first.
      say(data.session ? "Account created." : "Account created. Confirm your email address, then sign in.");
      if (data.session) window.location.reload();
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { say(error.message, "error"); return; }
    window.location.reload();
  }
  // The reset link returns to /reset-password, which is where the new password is set.
  async function forgot() {
    if (!supabase) return;
    if (!email) { say("Enter your email address first, then choose Forgot password.", "error"); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) say(error.message, "error");
    else say("Check your email for a link to choose a new password.");
  }
  async function signOut() {
    await supabase?.auth.signOut();
    setDifferentAccount(false);
    say("Signed out. You can choose another account.");
  }
  function askSignOut() {
    ask({
      title: "Sign out of this account?",
      body: "This signs the current account out of this browser so you can use a different one.",
      action: "Sign out",
      run: () => { void signOut(); },
    });
  }
  function demo(role: Role) {
    sessionStorage.setItem("noor-demo-role", role);
    window.location.assign(`/portal/${role}`);
  }

  return <main className="login-page">
    <div className="login-photo">
      <a href="/" className="academy-logo light"><span className="logo-icon">✦</span><span>Al Tarbiyah <small>ACADEMY</small></span></a>
      <div><span className="academy-eyebrow">✦ {admin ? "ACADEMY OPERATIONS" : "WELCOME BACK"}</span><h1>{admin ? "Lead learning with clarity." : "Continue the journey together."}</h1><p>{admin ? "A private entrance to academy forms, classes, families and reporting." : "One place for your child’s learning and teaching."}</p></div>
    </div>
    <div className="login-panel">
      <a href="/" className="back-link" onClick={event => { event.preventDefault(); ask({ title: "Leave the sign-in page?", body: "This takes you back to the public website. Anything you have typed here will be cleared.", action: "Go to website", run: () => window.location.assign("/") }); }}>← Back to website</a>
      <div className="login-card">
        <span className="academy-eyebrow">{admin ? "ADMIN ACCOUNT" : "YOUR ACCOUNT"}</span>
        <h2>{creating ? "Create your account" : admin ? "Admin sign in" : "Sign in to Al Tarbiyah"}</h2>
        <p>{creating
          ? "A new account starts with no access. An academy admin gives it a role once you have signed in."
          : "Continue with Google, or use your email address and password. Access follows the role assigned to your account."}</p>
        {signupOpen && <div className="auth-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!creating} className={creating ? "" : "active"} onClick={() => { setCreating(false); setNotice(""); }}>Sign in</button>
          <button type="button" role="tab" aria-selected={creating} className={creating ? "active" : ""} onClick={() => { setCreating(true); setNotice(""); }}>Create account</button>
        </div>}
        <button type="button" className="academy-button google-button" onClick={google} disabled={busy || !configured || differentAccount}>
          <svg className="google-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.4 30.2 0 24 0 14.6 5.4 6.4 13.2l7.9 6.1C12.2 13.6 17.6 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.88 46.98 24.55Z"/><path fill="#FBBC05" d="M10.29 28.71A14.4 14.4 0 0 1 9.5 24c0-1.64.28-3.23.79-4.71l-7.9-6.14A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.39 10.85l7.9-6.14Z"/><path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.4 0-11.8-4.1-13.71-9.79l-7.9 6.14C6.4 42.6 14.6 48 24 48Z"/></svg>
          {creating ? "Sign up with Google" : "Continue with Google"}
        </button>
        <div className="or-line">or use email</div>
        <form onSubmit={submit} className="academy-form">
          {creating && mode === "password" && <label>Full name<input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Fatima Ahmed"/></label>}
          <label>Email address<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label>
          {mode === "password" && <label>
            <span className="field-head">Password{!creating && <button type="button" onClick={forgot} disabled={busy || !configured}>Forgot password?</button>}</span>
            <span className="password-field">
              <input type={reveal ? "text" : "password"} required minLength={8} autoComplete={creating ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder={creating ? "At least 8 characters" : "Your password"}/>
              <button type="button" onClick={() => setReveal(!reveal)} aria-label={reveal ? "Hide password" : "Show password"}>{reveal ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </span>
          </label>}
          {creating && mode === "password" && <label>Confirm password<input type={reveal ? "text" : "password"} required minLength={8} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="Type it again"/></label>}
          <button className="academy-button full" disabled={busy || !configured || differentAccount}>
            {mode === "link" ? <><Mail size={18}/> Send sign-in link</> : creating ? <><UserPlus size={18}/> Create account</> : <><KeyRound size={18}/> Sign in</>}
          </button>
          {creating && mode === "password" && <p className="form-note">Use at least 8 characters, and something you do not use on another site.</p>}
        </form>
        <p className="auth-switch">
          {mode === "link" && <>A one-time link signs you in without a password. </>}
          {creating && mode === "password" && <><button type="button" onClick={forgot} disabled={busy || !configured}>Forgot your password?</button><span className="auth-switch-dot">·</span></>}
          <button type="button" onClick={() => { setMode(mode === "password" ? "link" : "password"); setNotice(""); }}>{mode === "password" ? "Email me a link instead" : "Use a password instead"}</button>
        </p>
        {notice && <p role="status" className={tone === "error" ? "login-notice is-error" : "login-notice"}>{notice}</p>}
        {differentAccount && <button type="button" className="academy-button outline full" onClick={askSignOut}>Sign out and switch account</button>}
        {!configured && <p className="form-note">Real accounts open when Supabase is configured.</p>}
        {configured && !signupOpen && <p className="form-note">Accounts are created by the academy. Ask the academy to add you, then sign in here.</p>}
        <div className="login-separator"/>
        <h3>{admin ? "Admin preview" : "Explore demo workspaces"}</h3>
        <p className="form-note">Sample data only. Demo access cannot view or change real records.</p>
        <div className="demo-grid">{(admin ? ["admin"] : ["parent", "student", "teacher"]).map(role => <button type="button" key={role} onClick={() => demo(role as Role)}>Demo {role}<ArrowRight size={16}/></button>)}</div>
        <p className="login-secure"><ShieldCheck size={16}/> Real access is checked against your role in Supabase.</p>
      </div>
    </div>
  {dialog}
  </main>;
}
