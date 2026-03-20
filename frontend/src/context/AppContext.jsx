import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../constants/storageKeys";

const AppContext = createContext(null);

const fallbackProfile = {
  name: "Campus User",
  email: "campus.user@sced.local",
  avatarUrl: "",
  joinedDate: "2026-01-15",
};

function getInitialProfile() {
  if (typeof window === "undefined") return fallbackProfile;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.profile);
    if (!raw) return fallbackProfile;
    const parsed = JSON.parse(raw);
    return {
      ...fallbackProfile,
      ...parsed,
    };
  } catch {
    return fallbackProfile;
  }
}

const initialSettings = {
  emailNotifications: true,
  pushNotifications: true,
  defaultReminder: "1_hour",
  autoDeleteDays: 30,
  defaultPriority: "Medium",
};

function getEventDateTime(task) {
  const eventTime =
    task.eventTime && /^\d{2}:\d{2}$/.test(task.eventTime)
      ? task.eventTime
      : "23:59";
  const parsed = new Date(`${task.dueDate}T${eventTime}:00`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date(task.dueDate);
  fallback.setHours(23, 59, 0, 0);
  return fallback;
}

function getComputedStatus(task, now = new Date()) {
  if (task.status === "archived") {
    return "archived";
  }
  if (task.status === "completed") {
    return "completed";
  }
  return getEventDateTime(task).getTime() < now.getTime()
    ? "completed"
    : "upcoming";
}

function shouldRetainTask(task, days = 30, now = new Date()) {
  const retentionMs = days * 24 * 60 * 60 * 1000;
  const ageMs = now.getTime() - getEventDateTime(task).getTime();
  return ageMs < retentionMs;
}

function buildNotification(task) {
  const now = new Date();
  const eventDateTime = getEventDateTime(task);
  const hoursUntil =
    (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil < 0) {
    return {
      id: `n-overdue-${task.id}`,
      level: "high",
      message: `${task.title} is overdue`,
      dueDate: task.dueDate,
      dueTime: task.eventTime || "23:59",
    };
  }

  if (hoursUntil <= 48) {
    let message = `${task.title} starts soon`;
    if (hoursUntil < 1) {
      message = `${task.title} starts in less than 1 hour`;
    } else if (hoursUntil < 24) {
      message = `${task.title} starts in ${Math.ceil(hoursUntil)} hour${Math.ceil(hoursUntil) === 1 ? "" : "s"}`;
    } else {
      const days = Math.ceil(hoursUntil / 24);
      message = `${task.title} starts in ${days} day${days === 1 ? "" : "s"}`;
    }

    return {
      id: `n-upcoming-${task.id}`,
      level:
        task.priority === "High"
          ? "high"
          : task.priority === "Low"
            ? "low"
            : "medium",
      message,
      dueDate: task.dueDate,
      dueTime: task.eventTime || "23:59",
    };
  }

  return null;
}

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(getInitialProfile);
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    const pruneExpiredTasks = () => {
      setTasks((prev) => {
        const next = prev.filter((task) =>
          shouldRetainTask(task, settings.autoDeleteDays),
        );
        return next.length === prev.length ? prev : next;
      });
    };

    pruneExpiredTasks();
    const timer = setInterval(pruneExpiredTasks, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, [settings.autoDeleteDays]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [profile]);

  const notifications = useMemo(
    () =>
      tasks
        .filter((task) => getComputedStatus(task) === "upcoming")
        .map(buildNotification)
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(`${a.dueDate}T${a.dueTime}`) -
            new Date(`${b.dueDate}T${b.dueTime}`),
        ),
    [tasks],
  );

  const addTask = (task) => {
    const taskId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `task-${Date.now()}`;

    const newTask = {
      ...task,
      eventTime: task.eventTime || "09:00",
      remindBefore: task.remindBefore || settings.defaultReminder,
      priority: task.priority || settings.defaultPriority,
      id: taskId,
      status: "upcoming",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTask = (taskId, updates) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    );
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const archiveTask = (taskId) => updateTask(taskId, { status: "archived" });
  const markUpcoming = (taskId) => updateTask(taskId, { status: "upcoming" });
  const updateProfile = (updates) =>
    setProfile((prev) => ({ ...prev, ...updates }));
  const updateSettings = (updates) =>
    setSettings((prev) => ({ ...prev, ...updates }));

  const value = {
    tasks,
    notifications,
    profile,
    settings,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    markUpcoming,
    updateProfile,
    updateSettings,
    getEventDateTime,
    getComputedStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
