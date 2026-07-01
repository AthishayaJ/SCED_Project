import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const makeDefaultForm = (settings) => ({
  title: "",
  description: "",
  type: "",
  priority: settings.defaultPriority || "",
  dueDate: "",
  eventTime: "09:00",
  remindBefore: settings.defaultReminder || "",
});

const fieldLabelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500";
const inputClass =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100";
const selectClass =
  "h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100";
const textareaClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100";

const TAB_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];
const VALID_TABS = new Set(TAB_OPTIONS.map((tab) => tab.value));

const PRIORITY_RANK = { High: 3, Medium: 2, Low: 1 };
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const EMPTY_STATE_SUBTITLE = "Click Add Event to add your first event";

function formatDateTime(dateInput, timeInput) {
  return new Date(`${dateInput}T${timeInput || "23:59"}:00`).toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function getTimelineStatus(task, computedStatus, getEventDateTime) {
  if (computedStatus === "completed") return "Completed";
  if (computedStatus === "archived") return "Archived";

  const eventDate = getEventDateTime(task);
  const now = new Date();
  const isSameDay =
    eventDate.getFullYear() === now.getFullYear() &&
    eventDate.getMonth() === now.getMonth() &&
    eventDate.getDate() === now.getDate();

  if (eventDate.getTime() < now.getTime()) return "Overdue";
  if (isSameDay) return "Today";
  return "";
}

function getTimelineStatusClass(status) {
  if (status === "Overdue") return "bg-red-100 text-red-700";
  if (status === "Today") return "bg-amber-100 text-amber-700";
  if (status === "Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "Archived") return "bg-slate-200 text-slate-700";
  return "bg-blue-100 text-blue-700";
}

function getPriorityPillClass(priority) {
  if (priority === "High") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "Medium")
    return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getEventCardClass(priority) {
  if (priority === "High") return "border-red-500/40 bg-red-900/25";
  if (priority === "Medium") return "border-amber-500/40 bg-amber-900/25";
  return "border-emerald-500/40 bg-emerald-900/25";
}

function getStartStatus(diffMs) {
  if (diffMs < 0) {
    return {
      label: "Past Event",
      className: "bg-red-100 text-red-700",
    };
  }

  if (diffMs < ONE_HOUR_MS) {
    return {
      label: "Starts < 1h",
      className: "bg-amber-100 text-amber-700",
    };
  }

  if (diffMs < ONE_DAY_MS) {
    return {
      label: `Starts in ${Math.ceil(diffMs / ONE_HOUR_MS)}h`,
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: `Starts in ${Math.ceil(diffMs / ONE_DAY_MS)}d`,
    className: "bg-blue-100 text-blue-700",
  };
}

function TasksPage() {
  const {
    tasks,
    settings,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    markUpcoming,
    getEventDateTime,
    getComputedStatus,
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(searchParams.get("tab") || "active");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(makeDefaultForm(settings));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const emptyStateText =
    tab === "active"
      ? {
          title: "No active events yet",
          subtitle: EMPTY_STATE_SUBTITLE,
        }
      : tab === "completed"
        ? {
            title: "No completed events yet",
            subtitle: EMPTY_STATE_SUBTITLE,
          }
        : {
            title: "No events yet",
            subtitle: EMPTY_STATE_SUBTITLE,
          };

  const openAddModal = () => {
    setEditingId(null);
    setForm(makeDefaultForm(settings));
    setIsModalOpen(true);
  };

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      priority: prev.priority || settings.defaultPriority,
      remindBefore: prev.remindBefore || settings.defaultReminder,
    }));
  }, [settings.defaultPriority, settings.defaultReminder]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (VALID_TABS.has(tabFromUrl)) {
      setTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("add") !== "1") return;
    openAddModal();

    const next = new URLSearchParams(searchParams);
    next.delete("add");
    setSearchParams(next, { replace: true });
  }, [searchParams, settings, setSearchParams]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    window.addEventListener("open-add-event-modal", openAddModal);
    return () => window.removeEventListener("open-add-event-modal", openAddModal);
  }, [settings]);

  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isModalOpen]);

  const tasksWithMeta = useMemo(
    () =>
      tasks.map((task) => {
        const computedStatus = getComputedStatus(task);
        return {
          task,
          computedStatus,
          timelineStatus: getTimelineStatus(task, computedStatus, getEventDateTime),
          eventDate: getEventDateTime(task),
        };
      }),
    [tasks, getComputedStatus, getEventDateTime],
  );

  const visibleEvents = useMemo(() => {
    let list = tasksWithMeta;
    if (tab === "active") {
      list = list.filter((item) => item.computedStatus === "upcoming");
    } else if (tab === "completed") {
      list = list.filter((item) => item.computedStatus === "completed");
    }

    if (priorityFilter !== "all") {
      list = list.filter((item) => item.task.priority === priorityFilter);
    }

    const sorted = [...list];
    if (sortBy === "date_desc") {
      sorted.sort((a, b) => b.eventDate - a.eventDate);
    } else if (sortBy === "priority_desc") {
      sorted.sort(
        (a, b) => (PRIORITY_RANK[b.task.priority] || 0) - (PRIORITY_RANK[a.task.priority] || 0),
      );
    } else if (sortBy === "priority_asc") {
      sorted.sort(
        (a, b) => (PRIORITY_RANK[a.task.priority] || 0) - (PRIORITY_RANK[b.task.priority] || 0),
      );
    } else {
      sorted.sort((a, b) => a.eventDate - b.eventDate);
    }
    const seen = new Set();
    const deduped = [];
    for (const item of sorted) {
      const signature = [
        (item.task.title || "").trim().toLowerCase(),
        (item.task.type || "").trim().toLowerCase(),
        (item.task.description || "").trim().toLowerCase(),
        item.task.priority || "",
        item.task.dueDate || "",
        item.task.eventTime || "",
        item.computedStatus,
      ].join("|");

      if (seen.has(signature)) continue;
      seen.add(signature);
      deduped.push(item);
    }

    return deduped;
  }, [tasksWithMeta, tab, priorityFilter, sortBy]);

  const openEditModal = (task) => {
    setEditingId(task.id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      type: task.type || "",
      priority: task.priority || settings.defaultPriority || "",
      dueDate: task.dueDate || "",
      eventTime: task.eventTime || "09:00",
      remindBefore: task.remindBefore || settings.defaultReminder || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.dueDate || isSubmitting) return;
    const today = new Date().toISOString().slice(0, 10);
    if (form.dueDate < today) {
        setToast("Event date cannot be in the past.");
        return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      if (editingId) {
        await updateTask(editingId, form);
        setToast("Event updated successfully.");
      } else {
        await addTask(form);
        setToast("Event added successfully.");
      }

      setIsModalOpen(false);
      setEditingId(null);
      setForm(makeDefaultForm(settings));
    } catch (err) {
      setToast(err.response?.data?.message || "Could not save event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (taskId) => {
    const ok = window.confirm("Are you sure you want to delete this event?");
    if (!ok) return;
    try {
      await deleteTask(taskId);
      setToast("Event deleted.");
    } catch (err) {
      setToast(err.response?.data?.message || "Could not delete event.");
    }
  };

  const handleDiscard = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(makeDefaultForm(settings));
  };

  const totalCount = tasksWithMeta.length;
  const activeCount = tasksWithMeta.filter((i) => i.computedStatus === "upcoming").length;
  const completedCount = tasksWithMeta.filter((i) => i.computedStatus === "completed").length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed left-1/2 top-20 z-30 w-[calc(100%-1.25rem)] max-w-sm -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-md sm:left-auto sm:right-4 sm:w-auto sm:max-w-none sm:translate-x-0">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/80 px-4 py-3 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total Events</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/80 px-4 py-3 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/80 px-4 py-3 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-blue-400">{completedCount}</p>
        </div>
      </div>

      <section className="fade-up flex min-h-[60vh] flex-col rounded-2xl border border-slate-700/40 bg-slate-800/80 p-3 shadow-sm backdrop-blur-sm sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/40 pb-3">
          <div className="inline-flex rounded-lg border border-slate-700/50 bg-slate-900/50 p-1">
            {TAB_OPTIONS.map((tabOption) => (
              <button
                key={tabOption.value}
                type="button"
                onClick={() => setTab(tabOption.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  tab === tabOption.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tabOption.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="h-8 rounded-lg border border-slate-600 bg-slate-900/70 px-2.5 text-xs text-slate-300 outline-none"
            >
              <option value="all">All priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-8 rounded-lg border border-slate-600 bg-slate-900/70 px-2.5 text-xs text-slate-300 outline-none"
            >
              <option value="date_asc">Date (Nearest first)</option>
              <option value="date_desc">Date (Latest first)</option>
              <option value="priority_desc">Priority (High to Low)</option>
              <option value="priority_asc">Priority (Low to High)</option>
            </select>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {!visibleEvents.length && (
            <div className="flex min-h-[38vh] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-600 bg-slate-700/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-200">{emptyStateText.title}</p>
                <p className="mt-1 text-xs text-slate-500">{emptyStateText.subtitle}</p>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <span>+</span> Add Event
                </button>
              </div>
            </div>
          )}

          {visibleEvents.map(({ task, computedStatus, timelineStatus, eventDate }) => {
            const diffMs = eventDate.getTime() - Date.now();
            const isCompletedTab = tab === "completed";
            const startStatus = getStartStatus(diffMs);
            const eventType = task.type || "General";
            const eventDescription = task.description?.trim() || "No description provided.";

            return (
              <div
                key={task.id}
                className={`rounded-lg border p-3 ${getEventCardClass(task.priority)}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      {eventType + " • " + formatDateTime(task.dueDate, task.eventTime)}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">{eventDescription}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getPriorityPillClass(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                    {timelineStatus && !isCompletedTab && (
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getTimelineStatusClass(timelineStatus)}`}
                      >
                        {timelineStatus}
                      </span>
                    )}
                    {!isCompletedTab && (
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${startStatus.className}`}
                      >
                        {startStatus.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(task)}
                    className="rounded-lg border border-blue-500/50 bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/30"
                  >
                    Edit
                  </button>
                  {task.status !== "archived" && computedStatus !== "completed" ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await archiveTask(task.id);
                          setToast("Event archived.");
                        } catch (err) {
                          setToast(err.response?.data?.message || "Could not archive event.");
                        }
                      }}
                      className="rounded-lg border border-amber-500/50 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30"
                    >
                      Archive
                    </button>
                  ) : task.status === "archived" ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await markUpcoming(task.id);
                          setToast("Event unarchived.");
                        } catch (err) {
                          setToast(err.response?.data?.message || "Could not unarchive event.");
                        }
                      }}
                      className="rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                    >
                      Unarchive
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg border border-red-500/50 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-900/45 p-4">
          <div className="app-modal-panel w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-800">
                {editingId ? "Edit Event" : "Add Event"}
              </h4>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={fieldLabelClass}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                  className={inputClass}
                  placeholder="Enter event title"
                />
              </div>

              <div className="md:col-span-2">
                <label className={fieldLabelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                  className={textareaClass}
                  placeholder="Add event details"
                  required
                />
              </div>

              <div>
                <label className={fieldLabelClass}>Priority</label>
                <div className="relative">
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, priority: event.target.value }))
                    }
                    className={selectClass}
                  >
                    <option value="">Auto (by deadline)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    ▾
                  </span>
                </div>
              </div>

              <div>
                <label className={fieldLabelClass}>Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      dueDate: event.target.value,
                    }))
                  }
                  min={new Date().toISOString().slice(0, 10)}
                  max="2099-12-31"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={fieldLabelClass}>Time</label>
                <input
                  type="time"
                  value={form.eventTime}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      eventTime: event.target.value,
                    }))
                  }
                  required
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={fieldLabelClass}>Remind Before</label>
                <div className="relative">
                  <select
                    value={form.remindBefore}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, remindBefore: event.target.value }))
                    }
                    className={selectClass}
                  >
                    <option value="">Auto (by priority)</option>
                    <option value="10_minutes">10 minutes</option>
                    <option value="30_minutes">30 minutes</option>
                    <option value="6_hours">6 hours</option>
                    <option value="12_hours">12 hours</option>
                    <option value="1_hour">1 hour</option>
                    <option value="1_day">1 day</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    ▾
                  </span>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                      ? "Update Event"
                      : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage;