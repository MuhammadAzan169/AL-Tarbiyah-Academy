import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { configured, supabase } from "@/lib/academy";
import { useConfirm } from "@/features/academy/confirm";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const { ask, dialog } = useConfirm();

  useEffect(() => {
    if (!supabase) return;
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("error_description") || params.get("error");
    if (authError) { setNotice(authError); return; }
    // Supabase exchanges the emailed link for a recovery session before this runs,
    // so a missing session means the link was already used or has expired.
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setReady(true);
      else setNotice("This reset link is no longer valid. Request a new one from the sign-in page.");
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    if (password !== confirm) { setNotice("Both passwords must match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setNotice(error.message); return; }
    setNotice("Password updated. Taking you to your workspace.");
    const { data } = await supabase.auth.getUser();
    const { data: profile } = data.user
      ? await supabase.from("profiles").select("role").eq("id", data.user.id).single()
      : { data: null };
    window.location.assign(profile?.role ? `/portal/${profile.role}` : "/login");
  }

  return <main className="login-page">
    <div className="login-photo">
      <a href="/" className="academy-logo light"><span className="logo-icon">✦</span><span>Al Tarbiyah <small>ACADEMY</small></span></a>
      <div><span className="academy-eyebrow">✦ ACCOUNT SECURITY</span><h1>Choose a new password.</h1><p>Pick something only you would know. You stay signed in on this device afterwards.</p></div>
    </div>
    <div className="login-panel">
      <a href="/login" className="back-link" onClick={event => { event.preventDefault(); ask({ title: "Leave without setting a password?", body: "Your password stays as it is. The emailed link can be used again until it expires.", action: "Leave", run: () => window.location.assign("/login") }); }}>← Back to sign in</a>
      <div className="login-card">
        <span className="academy-eyebrow">PASSWORD RESET</span>
        <h2>Set a new password</h2>
        <p>Use at least 8 characters. Keep it different from passwords you use elsewhere.</p>
        <form onSubmit={submit} className="academy-form">
          <label>New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters"/></label>
          <label>Confirm new password<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="Type it again"/></label>
          <button className="academy-button full" disabled={busy || !configured || !ready}><KeyRound size={18}/> Update password</button>
        </form>
        {notice && <p role="status" className="login-notice">{notice}</p>}
        {!configured && <p className="form-note">Password resets open when Supabase is configured.</p>}
        <p className="login-secure"><ShieldCheck size={16}/> This link works once and expires after a short time.</p>
      </div>
    </div>
  {dialog}
  </main>;
}
