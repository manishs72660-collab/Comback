import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";

import AuthShell from "../components/AuthShell.jsx";
import Field from "../components/Field.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api/axios";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Enter your password";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = await login({ email: form.email.trim().toLowerCase(), password: form.password });
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Could not log in"));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Pick up your routine where you left it."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
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
          autoComplete="current-password"
          placeholder="Your password"
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
        <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
