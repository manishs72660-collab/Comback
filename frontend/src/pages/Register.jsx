import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import toast from "react-hot-toast";

import AuthShell from "../components/AuthShell.jsx";
import Field from "../components/Field.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api/axios";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (form.password.length < 6) next.password = "Use at least 6 characters";
    if (form.confirm !== form.password) next.confirm = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      toast.success(`Account created. Welcome, ${user.name.split(" ")[0]}`);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Could not create your account"));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up your first routine in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field
          id="name"
          label="Name"
          icon={User}
          autoComplete="name"
          placeholder="Your name"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        <Field
          id="password"
          label="Password"
          type={show ? "text" : "password"}
          icon={Lock}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          right={
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <Field
          id="confirm"
          label="Confirm password"
          type={show ? "text" : "password"}
          icon={Lock}
          autoComplete="new-password"
          placeholder="Type it again"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
        />
        <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
