import { Link } from "react-router-dom";
import { useState } from "react";
import { APP_NAME } from "../constants/appName";
import { useAppContext } from "../context/AppContext";
import { STORAGE_KEYS } from "../constants/storageKeys";

function SignupPage() {
  const { updateProfile } = useAppContext();
  const [appTitleMain, appTitleSuffix = ""] = APP_NAME.split(" & ");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorText, setErrorText] = useState("");

  const getSavedAccounts = () => {
    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.accounts) || "[]",
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorText("Password and confirm password do not match.");
      return;
    }
    setErrorText("");

    const joinedDate = new Date().toISOString().slice(0, 10);
    const nextProfile = {
      name: name.trim() || "Campus User",
      email: email.trim() || "campus.user@sced.local",
      avatarUrl: "",
      joinedDate,
    };
    window.localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify(nextProfile),
    );
    window.localStorage.setItem(
      STORAGE_KEYS.account,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    );
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = getSavedAccounts();
    const nextAccounts = accounts.filter((item) => item?.email !== normalizedEmail);
    nextAccounts.push({ email: normalizedEmail, password });
    window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(nextAccounts));
    window.localStorage.setItem(STORAGE_KEYS.session, "1");
    updateProfile(nextProfile);
    window.location.replace("/events");
  };

  return (
    <div className="relative app-viewport overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-12 h-72 w-72 rounded-full bg-blue-300/25 blur-3xl" />

      <div className="flex min-h-full flex-col overflow-hidden">
        <header className="z-10 shrink-0 border-b border-slate-700/70 bg-slate-950/55 px-3 py-3 backdrop-blur-md sm:px-4">
          <div className="mx-auto max-w-7xl">
            <div className="inline-flex rounded-2xl border border-slate-700/20 bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-700 px-3.5 py-1.5 shadow-lg shadow-blue-500/20 ring-1 ring-white/30">
              <h1 className="leading-tight text-white">
                <span className="block text-sm font-extrabold tracking-wide sm:text-base">
                  {appTitleMain}
                </span>
                {appTitleSuffix && (
                  <span className="block text-right text-[10px] font-semibold tracking-wide text-cyan-100 sm:text-xs">
                    &amp; {appTitleSuffix}
                  </span>
                )}
              </h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-7xl items-center justify-center p-4 md:p-6">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-xl backdrop-blur-md sm:p-8">
              <h1 className="mb-5 text-center text-2xl font-bold sm:text-3xl">
                Sign Up
              </h1>

              {errorText && (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorText}
                </p>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="group relative my-3 rounded-xl border border-slate-300/90 bg-white/70 px-3 pb-2 pt-5 transition focus-within:border-blue-500 focus-within:bg-white">
                  <input
                    type="text"
                    required
                    placeholder=" "
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="peer w-full bg-transparent text-sm text-slate-800 outline-none"
                  />
                  <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all peer-focus:top-2 peer-focus:-translate-y-1 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1 peer-[:not(:placeholder-shown)]:text-[11px]">
                    Enter your name
                  </label>
                </div>

                <div className="group relative my-3 rounded-xl border border-slate-300/90 bg-white/70 px-3 pb-2 pt-5 transition focus-within:border-blue-500 focus-within:bg-white">
                  <input
                    type="email"
                    required
                    placeholder=" "
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="peer w-full bg-transparent text-sm text-slate-800 outline-none"
                  />
                  <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all peer-focus:top-2 peer-focus:-translate-y-1 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1 peer-[:not(:placeholder-shown)]:text-[11px]">
                    Enter your email
                  </label>
                </div>

                <div className="group relative my-3 rounded-xl border border-slate-300/90 bg-white/70 px-3 pb-2 pt-5 transition focus-within:border-blue-500 focus-within:bg-white">
                  <input
                    type="password"
                    required
                    placeholder=" "
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="peer w-full bg-transparent text-sm text-slate-800 outline-none"
                  />
                  <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all peer-focus:top-2 peer-focus:-translate-y-1 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1 peer-[:not(:placeholder-shown)]:text-[11px]">
                    Create password
                  </label>
                </div>

                <div className="group relative my-3 rounded-xl border border-slate-300/90 bg-white/70 px-3 pb-2 pt-5 transition focus-within:border-blue-500 focus-within:bg-white">
                  <input
                    type="password"
                    required
                    placeholder=" "
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="peer w-full bg-transparent text-sm text-slate-800 outline-none"
                  />
                  <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all peer-focus:top-2 peer-focus:-translate-y-1 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1 peer-[:not(:placeholder-shown)]:text-[11px]">
                    Confirm password
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md border-2 border-transparent bg-slate-900 py-3 text-sm font-bold text-white transition hover:border-slate-900 hover:bg-slate-800"
                >
                  Sign Up
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-slate-700 hover:underline"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SignupPage;
