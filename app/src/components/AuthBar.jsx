// Small header widget. Signed-out visitors see a "Sign in to upload" button
// that reveals an email + password form. Signed-in users see their email and a
// "Sign out" button. Viewing the dashboard never requires signing in — this
// only gates uploading. Passwords are managed in the Supabase dashboard; only
// the pre-approved users exist, so no self-registration is possible.
import { useState } from "react";
import { supabase, supabaseEnabled } from "../lib/supabase.js";

export default function AuthBar({ session, t }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!supabaseEnabled) return null;

  if (session) {
    return (
      <div className="auth-bar">
        <span className="auth-user">
          {t("signedInAs")} <strong>{session.user.email}</strong>
        </span>
        <button className="auth-btn" onClick={() => supabase.auth.signOut()}>
          {t("signOut")}
        </button>
      </div>
    );
  }

  async function signIn(e) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    // on success onAuthStateChange sets the session and this form unmounts
    if (error) setError(`${t("authError")}: ${error.message}`);
  }

  return (
    <div className="auth-bar">
      {!open ? (
        <button className="auth-btn" onClick={() => setOpen(true)}>
          {t("signIn")}
        </button>
      ) : (
        <form className="auth-form" onSubmit={signIn}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
          />
          <button className="auth-btn" type="submit" disabled={busy}>
            {busy ? "…" : t("signIn")}
          </button>
        </form>
      )}
      {error && <span className="auth-error">{error}</span>}
    </div>
  );
}
