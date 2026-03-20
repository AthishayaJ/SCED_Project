import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import NotificationButton from "./NotificationButton";
import { APP_NAME } from "../constants/appName";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { useAppContext } from "../context/AppContext";

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    profile,
    settings,
    updateProfile,
    updateSettings,
  } = useAppContext();

  const [appTitleMain, appTitleSuffix = ""] = APP_NAME.split(" & ");
  const [profileOpen, setProfileOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [profileForm, setProfileForm] = useState(profile);
  const [isBasicEditOpen, setIsBasicEditOpen] = useState(false);
  const profileRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    setProfileForm(profile);
    setIsBasicEditOpen(false);
  }, [profile]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  const handleLogout = () => {
    window.localStorage.removeItem(STORAGE_KEYS.session);
    window.location.replace("/login");
  };

  const openPanel = (panel) => {
    setActivePanel(panel);
    setProfileOpen(false);
    setIsBasicEditOpen(false);
  };

  const saveProfile = () => {
    updateProfile(profileForm);
    setIsBasicEditOpen(false);
    setActivePanel(null);
  };

  const openAddEventModal = () => {
    if (location.pathname === "/events") {
      window.dispatchEvent(new Event("open-add-event-modal"));
      return;
    }
    navigate("/events?add=1");
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = typeof reader.result === "string" ? reader.result : "";
      if (!imageData) return;
      setProfileForm((prev) => ({
        ...prev,
        avatarUrl: imageData,
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-12 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      <div className="flex h-full flex-col overflow-hidden">
        <header className="z-10 shrink-0 border-b border-slate-700/70 bg-slate-950/55 px-3 py-3 backdrop-blur-md sm:px-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex rounded-2xl border border-blue-900/20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 px-3.5 py-1.5 shadow-lg shadow-blue-900/20 ring-1 ring-white/30">
                  <h1 className="leading-tight text-white">
                    <span className="block text-sm font-extrabold tracking-wide sm:text-base">
                      {appTitleMain}
                    </span>
                    {appTitleSuffix && (
                      <span className="block text-right text-[10px] font-semibold tracking-wide text-blue-100 sm:text-xs">
                        &amp; {appTitleSuffix}
                      </span>
                    )}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <NotificationButton />
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white transition hover:bg-slate-50"
                    aria-label="User menu"
                  >
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="User"
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-blue-700">
                        {(profile.name || "C").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                      <button
                        type="button"
                        onClick={() => openPanel("profile")}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => openPanel("settings")}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        Settings
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
            <Outlet />
          </div>
        </main>

        <button
          type="button"
          onClick={openAddEventModal}
          className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-3xl leading-none text-white shadow-lg shadow-blue-900/30 transition hover:scale-105 hover:bg-blue-800"
          aria-label="Add event"
          title="Add event"
        >
          +
        </button>

        {activePanel === "profile" && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h3 className="text-base font-bold text-slate-800">Profile</h3>

              <div className="mt-3 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Profile Info</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16">
                        {profileForm.avatarUrl ? (
                          <img
                            src={profileForm.avatarUrl}
                            alt="Profile"
                            className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-800">
                            {profileForm.name?.slice(0, 1).toUpperCase() || "C"}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 bg-blue-700 text-xs font-bold text-white hover:bg-blue-800"
                          aria-label="Change profile image"
                          title="Change profile image"
                        >
                          +
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="hidden"
                        />
                      </div>
                      <div>
                        {isBasicEditOpen ? (
                          <input
                            value={profileForm.name}
                            onChange={(event) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                name: event.target.value,
                              }))
                            }
                            className="h-9 w-52 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800"
                          />
                        ) : (
                          <p className="text-base font-bold text-slate-800">{profileForm.name}</p>
                        )}
                        <p className="text-sm text-slate-500">{profileForm.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBasicEditOpen((prev) => !prev)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {isBasicEditOpen ? "Done" : "Edit"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {activePanel === "settings" && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h3 className="text-base font-bold text-slate-800">Settings</h3>

              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Notification Settings
                  </p>
                  <label className="mb-2 flex items-center justify-between text-sm">
                    <span>Email notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(event) =>
                        updateSettings({ emailNotifications: event.target.checked })
                      }
                      className="accent-blue-600"
                    />
                  </label>
                  <label className="mb-2 flex items-center justify-between text-sm">
                    <span>Push notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(event) =>
                        updateSettings({ pushNotifications: event.target.checked })
                      }
                      className="accent-blue-600"
                    />
                  </label>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Reminder Settings
                  </p>
                  <label className="text-sm">
                    <span className="mb-1 block">Default reminder time</span>
                    <select
                      value={settings.defaultReminder}
                      onChange={(event) =>
                        updateSettings({ defaultReminder: event.target.value })
                      }
                      className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm"
                    >
                      <option value="10_minutes">10 minutes</option>
                      <option value="1_hour">1 hour</option>
                      <option value="1_day">1 day</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Task Settings
                  </p>
                  <label className="mb-2 block text-sm">
                    <span className="mb-1 block">Auto delete after</span>
                    <select
                      value={settings.autoDeleteDays}
                      onChange={(event) =>
                        updateSettings({ autoDeleteDays: Number(event.target.value) })
                      }
                      className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm"
                    >
                      <option value={7}>7 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppShell;
