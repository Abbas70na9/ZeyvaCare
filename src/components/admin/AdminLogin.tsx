import { useState } from "react";
import { setAdminAuthenticated } from "../../data/storage";

interface Props {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

const ADMIN_USER = "ZeyvaCareAdmin";
const ADMIN_PASS = "ZeyvaCare#$78654";

export default function AdminLogin({ onLoginSuccess, onBackToStore }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
        setAdminAuthenticated(true);
        onLoginSuccess();
      } else {
        setError("Invalid username or password. Please check your credentials.");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-blush-50 to-cream flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <button
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-muted hover:text-ink transition mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Live Store
          </button>
          <div className="flex flex-col items-center leading-none">
            <span className="font-serif text-3xl text-ink">
              Zeyva<span className="text-blush-400">.</span>
            </span>
            <span className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium mt-1">
              Admin Portal
            </span>
          </div>
          <h2 className="mt-6 text-center font-serif text-2xl text-ink">
            Management Sign In
          </h2>
          <p className="mt-2 text-center text-xs text-muted">
            Enter authorized credentials to manage products, pricing & content
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-xl rounded-2xl border border-cream-dark sm:px-10 zeyva-modal-in">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium tracking-wider uppercase text-ink/70 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ZeyvaCareAdmin"
                className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/40 focus:bg-white focus:outline-none focus:border-blush-300 focus:ring-2 focus:ring-blush-100 transition text-sm text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium tracking-wider uppercase text-ink/70 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/40 focus:bg-white focus:outline-none focus:border-blush-300 focus:ring-2 focus:ring-blush-100 transition text-sm text-ink pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-ink text-xs"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-cream py-3.5 rounded-full font-medium tracking-widest uppercase text-xs hover:bg-blush-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Enter Dashboard"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-cream-dark text-center">
            <p className="text-[11px] text-muted">
              🔒 Authorized staff access only. Activity is logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
