import { useMemo, useState, useRef, useEffect } from "react";
import { useAppContext } from "../context/AppContext";

function NotificationButton() {
  const { notifications } = useAppContext();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState([]);
  const [clearedIds, setClearedIds] = useState([]);
  const containerRef = useRef(null);

  const formatDue = (dueDate, dueTime) =>
    new Date(`${dueDate}T${dueTime || "23:59"}:00`).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const visibleNotifications = useMemo(
    () => notifications.filter((note) => !clearedIds.includes(note.id)),
    [notifications, clearedIds],
  );

  const counterLabel = useMemo(() => {
    const unreadCount = visibleNotifications.filter(
      (note) => !readIds.includes(note.id),
    ).length;
    if (!unreadCount) return "0";
    return unreadCount > 9 ? "9+" : `${unreadCount}`;
  }, [visibleNotifications, readIds]);

  const markAsRead = (id) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const clearAll = () => {
    const ids = visibleNotifications.map((note) => note.id);
    setReadIds((prev) => [...new Set([...prev, ...ids])]);
    setClearedIds((prev) => [...new Set([...prev, ...ids])]);
  };

  useEffect(() => {
    const activeIds = new Set(notifications.map((note) => note.id));
    setClearedIds((prev) => prev.filter((id) => activeIds.has(id)));
    setReadIds((prev) => prev.filter((id) => activeIds.has(id)));
  }, [notifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg border border-slate-300 bg-white p-2 text-blue-800 transition hover:bg-blue-50"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {counterLabel}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[min(24rem,calc(100vw-1rem))] max-w-[24rem] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700">Alerts</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>

          {!visibleNotifications.length && (
            <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
              No urgent campus events right now.
            </p>
          )}

          <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
            {visibleNotifications.map((note) => {
              const isRead = readIds.includes(note.id);
              return (
                <div
                  key={note.id}
                  className={`rounded-lg border p-2 text-xs ${
                    note.level === "high"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : note.level === "medium"
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-emerald-300 bg-emerald-50 text-emerald-700"
                  }`}
                  style={{ opacity: isRead ? 0.65 : 1 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{note.message}</p>
                      <p className="mt-1 opacity-80">
                        Due: {formatDue(note.dueDate, note.dueTime)}
                      </p>
                    </div>
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(note.id)}
                        className="rounded-md bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-white"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationButton;
