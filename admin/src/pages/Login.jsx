import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/constants";

function getRedirectPath(role) {
  if (role === ROLES.STAFF) return "/admin/services";
  if (role === ROLES.TRAINER) return "/admin/academy/students";
  return "/admin/dashboard";
}

function Login() {
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(getRedirectPath(user?.role));
    } catch (err) {
      if (err.isPortalAccessDenied) {
        setError("This account does not have admin portal access.");
      } else {
        setError(err.response?.data?.detail || "Login failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(160deg, #0a0a0a 0%, #0e0b07 50%, #0a0a0a 100%)",
      }}
    >
      {/* Subtle gold radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,169,110,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <p
            className="text-3xl font-bold tracking-[0.2em] uppercase mb-1"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              background: "linear-gradient(135deg,#c9a96e,#dbb87a,#c9a96e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SLEITH
          </p>
          <p
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Admin Portal
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(201,169,110,0.18)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          <h2
            className="text-xl font-semibold text-white text-center mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Welcome back
          </h2>
          <p className="text-center text-sm mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            Sign in to manage SLEITH
          </p>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm mb-5"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.9)",
                }}
                placeholder="admin@sleith.com"
                autoComplete="email"
                required
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(201,169,110,0.5)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest uppercase mb-2"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.9)",
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(201,169,110,0.5)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-60 mt-2"
              style={{
                background: "linear-gradient(135deg,#c9a96e,#dbb87a,#c9a96e)",
                backgroundSize: "200% 100%",
                color: "#0a0a0a",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.target.style.backgroundPosition = "100% 0";
                  e.target.style.boxShadow = "0 4px 20px rgba(201,169,110,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundPosition = "0 0";
                e.target.style.boxShadow = "none";
              }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
