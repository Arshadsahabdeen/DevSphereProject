// frontend/src/pages/Login.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

interface LoginProps {
  onLogin?: () => void;
  onNavigate?: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [remember, setRemember] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const auth = useAuth();
  const navigate = useNavigate();

  // typed event handlers to avoid TS7006
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRemember(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Expecting auth.login to accept an object like { email, password, remember }
      // and return a result with { success: boolean, error?: string }
      const result = await auth.login({
        email: formData.email,
        password: formData.password,
        remember,
      });

      if (result?.success) {
        toast.success("Login successful!");
        if (onLogin) onLogin();
        else navigate("/dashboard");
      } else {
        const message =
          typeof result?.error === "string"
            ? result.error
            : "Login failed. Check credentials.";
        toast.error(message);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Simple SSO demo handler (replace with your real SSO flow)
  const handleSSOLogin = async (provider: string) => {
    setLoading(true);
    try {
      if ((auth as any).ssoLogin) {
        const res = await (auth as any).ssoLogin(provider);
        if (res?.success) {
          toast.success(`Signed in with ${provider}`);
          if (onLogin) onLogin();
          else navigate("/dashboard");
          return;
        } else {
          toast.error(res?.error || `SSO with ${provider} failed`);
        }
      } else {
        await new Promise((r) => setTimeout(r, 800));
        toast.success(`Signed in with ${provider} (demo)`);
        if (onLogin) onLogin();
        else navigate("/dashboard");
      }
    } catch (err) {
      console.error("SSO error:", err);
      toast.error("SSO failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-900 flex items-center justify-center p-4"
      style={{ background: "var(--gray-900)" }}
    >
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div
            className="size-14 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, var(--gray-600) 0%, var(--gray-800) 100%)",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>DS</span>
          </div>
          <div>
            <h1
              className="text-[32px] font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              DevSphere
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Collaborative Development Platform
            </p>
          </div>
        </div>

        <h2
          className="text-[24px] font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Build Better, Together
        </h2>
        <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
          Ship faster with real-time collaboration, integrated workflows, and
          powerful developer tools.
        </p>

        <div className="space-y-4">
          {[
            {
              icon: "🚀",
              title: "Real-time Collaboration",
              desc: "Work together seamlessly with your team",
            },
            {
              icon: "⚡",
              title: "Lightning Fast",
              desc: "Optimized for speed and performance",
            },
            {
              icon: "🔒",
              title: "Enterprise Security",
              desc: "Bank-level encryption and compliance",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg transition-smooth hover-lift"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-2xl">{feature.icon}</span>
              <div>
                <h4
                  className="font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feature.title}
                </h4>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-1/2 max-w-md">
        <div
          className="p-8 rounded-xl shadow-lg"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div
              className="size-12 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--gray-600) 0%, var(--gray-800) 100%)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>DS</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2
              className="text-[22px] font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* SSO Buttons (simple HTML buttons) */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              className="w-full h-11 rounded-lg border transition-smooth press-scale"
              style={{
                borderColor: "var(--border)",
                background: "transparent",
                color: "var(--text-primary)",
              }}
              onClick={() => handleSSOLogin("github")}
              disabled={loading}
            >
              <span style={{ marginRight: 8 }}>🐙</span>
              Continue with GitHub
            </button>

            <button
              type="button"
              className="w-full h-11 rounded-lg border transition-smooth press-scale"
              style={{
                borderColor: "var(--border)",
                background: "transparent",
                color: "var(--text-primary)",
              }}
              onClick={() => handleSSOLogin("google")}
              disabled={loading}
            >
              <span style={{ marginRight: 8 }}>📧</span>
              Continue with Google
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm" style={{ background: "var(--surface)", color: "var(--text-secondary)" }}>
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <span className="size-4">✉️</span>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                disabled={loading}
                aria-label="Email address"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <span className="size-4">🔒</span>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                disabled={loading}
                aria-label="Password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={handleCheckbox}
                  disabled={loading}
                />
                <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                  Remember me
                </label>
              </div>

              <button
                type="button"
                className="text-sm hover:underline transition-smooth"
                style={{ color: "var(--accent)", background: "transparent", border: "none" }}
                onClick={() => (onNavigate ? onNavigate("forgot-password") : navigate("/forgot-password"))}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 px-4 rounded-lg transition-colors"
              style={{ background: "var(--accent)", border: "none" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
            Don't have an account?{" "}
            {onNavigate ? (
              <button
                onClick={() => onNavigate("signup")}
                className="text-sm hover:underline"
                style={{ color: "var(--accent)", background: "transparent", border: "none" }}
                disabled={loading}
              >
                Sign up
              </button>
            ) : (
              <Link to="/register" className="text-sm" style={{ color: "var(--accent)" }}>
                Sign up
              </Link>
            )}
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-secondary)" }}>
          By signing in, you agree to our{" "}
          <button className="hover:underline" style={{ color: "var(--accent)", background: "transparent", border: "none" }}>
            Terms of Service
          </button>{" "}
          and{" "}
          <button className="hover:underline" style={{ color: "var(--accent)", background: "transparent", border: "none" }}>
            Privacy Policy
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
