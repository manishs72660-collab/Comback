import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import BrandLogo from "../components/BrandLogo";
import { json, request } from "../utils/api";

export default function AuthPage({ initialMode = "login", onBack, onAuth }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await request(`/auth/${isRegister ? "register" : "login"}`, json("POST", form), false);
      onAuth(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page redesigned-auth">
      <section className="auth-intro">
        <button className="auth-back" onClick={onBack}><ArrowLeft size={16} /> Back to Comeback</button>
        <BrandLogo />
        <div><span className="eyebrow">A LITTLE BETTER, EVERY DAY</span><h1>Make room for<br /><em>your comeback.</em></h1><p>Build routines that stick. Find your rhythm. Keep showing up.</p></div>
        <span className="auth-footnote">YOUR PACE. YOUR PROGRESS.</span>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">{isRegister ? "A FRESH START" : "WELCOME BACK"}</span>
        <h2>{isRegister ? "Begin your next chapter." : "Good to see you again."}</h2>
        <p className="muted">{isRegister ? "Let's make a little room for what matters." : "Your routines and plans are right where you left them."}</p>
        {isRegister && <label>Your name<input required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" /></label>}
        <label>Email address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
        <label>Password<input required minLength="6" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 6 characters" /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full" disabled={busy}>{busy ? "One moment…" : isRegister ? "Create your account" : "Sign in"} <ArrowRight size={16} /></button>
        <p className="switch-auth">{isRegister ? "Already have a space here?" : "New to Comeback?"} <button type="button" onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }}>{isRegister ? "Log in" : "Create an account"}</button></p>
      </form>
    </main>
  );
}
