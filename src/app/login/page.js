"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "Invalid email or password"
        );

        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#061727]">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0">

        {/* Grid */}

        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize:
              "44px 44px",
          }}
        />

        {/* Teal glow */}

        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-teal-500/20 blur-[120px]" />

        {/* Blue glow */}

        <div className="absolute -bottom-40 -right-40 h-[550px] w-[550px] rounded-full bg-blue-600/20 blur-[130px]" />

        {/* Center glow */}

        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[100px]" />

      </div>

      {/* =====================================================
          LEFT BRAND PANEL
      ===================================================== */}

      <div className="relative hidden w-1/2 items-center justify-center px-12 lg:flex">

        <div className="relative z-10 max-w-xl">

          {/* Logo */}

          <div className="mb-8 flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 to-cyan-500 text-2xl font-black text-[#061727] shadow-xl shadow-teal-900/30">
              $
            </div>

            <div>

              <h1 className="text-xl font-black tracking-tight text-white">
                Funding Management
              </h1>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">
                Funding Opportunities Portal
              </p>

            </div>

          </div>

          {/* Heading */}

          <h2 className="text-5xl font-black leading-[1.05] tracking-tight text-white xl:text-6xl">

            Manage funding
            <span className="block bg-gradient-to-r from-teal-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              opportunities.
            </span>

          </h2>

          <p className="mt-7 max-w-lg text-base leading-7 text-slate-300">
            Access the Funding Management portal to
            manage funding services, review opportunities
            and maintain your funding database.
          </p>

          {/* Feature cards */}

          <div className="mt-10 space-y-3">

            <Feature
              number="01"
              title="Manage Funding Programs"
              text="Create, update and maintain funding opportunities."
            />

            <Feature
              number="02"
              title="Review Applications"
              text="Keep track of funding requests submitted through the portal."
            />

            <Feature
              number="03"
              title="Secure Access"
              text="Role-based access keeps administrative operations protected."
            />

          </div>

        </div>

      </div>

      {/* =====================================================
          RIGHT LOGIN AREA
      ===================================================== */}

      <div className="relative z-10 flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2">

        <div className="w-full max-w-md">

          {/* Mobile Logo */}

          <div className="mb-7 text-center lg:hidden">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 to-cyan-500 text-2xl font-black text-[#061727] shadow-xl">
              $
            </div>

            <h1 className="mt-4 text-xl font-black text-white">
              Funding Management
            </h1>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">
              Funding Opportunities Portal
            </p>

          </div>

          {/* Login Card */}

          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.07] p-1 shadow-2xl shadow-black/30 backdrop-blur-2xl">

            {/* Card glow */}

            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />

            <div className="relative rounded-[26px] border border-white/5 bg-[#f9fbfd] p-6 sm:p-8">

              {/* Heading */}

              <div className="mb-7">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-teal-700">

                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />

                  Secure Employee Access

                </div>

                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to manage your funding
                  opportunities and services.
                </p>

              </div>

              {/* Error */}

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">

                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-sm font-black text-rose-600">
                    !
                  </div>

                  <div>
                    <p className="text-xs font-black text-rose-800">
                      Login failed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-rose-700">
                      {error}
                    </p>
                  </div>

                </div>
              )}

              {/* Form */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* Email */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                  >
                    Email Address
                  </label>

                  <div className="relative">

                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">

                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />

                        <path d="m3 7 9 6 9-6" />
                      </svg>

                    </div>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                      className="h-13 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
                    />

                  </div>

                </div>

                {/* Password */}

                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">

                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="11"
                          rx="2"
                        />

                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>

                    </div>

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="h-13 w-full rounded-xl border border-slate-200 bg-white px-11 pr-12 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
                    />

                    {/* Show password */}

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >

                      {showPassword ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 3.5 10 8-0.4 1.7-1.3 3.2-2.5 4.4" />
                          <path d="M6.6 6.6C4.8 7.7 3.5 9.5 2 12c1 4.5 5 8 10 8 1.7 0 3.3-.4 4.7-1.1" />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
                        </svg>
                      )}

                    </button>

                  </div>

                </div>

                {/* Login button */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 flex h-13 w-full items-center justify-center overflow-hidden rounded-xl bg-[#071a2d] px-5 text-sm font-black text-white shadow-xl shadow-slate-900/10 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <span className="relative z-10 flex items-center gap-2">

                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In

                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}

                  </span>

                  {!loading && (
                    <span className="absolute inset-y-0 right-0 w-20 translate-x-full bg-teal-400/20 transition-transform duration-300 group-hover:translate-x-0" />
                  )}

                </button>

              </form>

              {/* Back link */}

              <div className="mt-7 border-t border-slate-100 pt-6 text-center">

                <a
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-teal-600"
                >
                  <span>←</span>
                  Back to Funding Opportunities
                </a>

              </div>

            </div>

          </div>

          {/* Security text */}

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">

            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>

            Protected employee portal

          </div>

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   FEATURE COMPONENT
========================================================= */

function Feature({
  number,
  title,
  text,
}) {
  return (
    <div className="group flex max-w-lg items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition hover:border-teal-400/20 hover:bg-white/[0.07]">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-xs font-black text-teal-300">
        {number}
      </div>

      <div>

        <h3 className="text-sm font-bold text-white">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {text}
        </p>

      </div>

    </div>
  );
}