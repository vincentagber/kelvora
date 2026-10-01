import type { ReactNode } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationOptions {
  type: NotificationType;
  message: ReactNode;
  title?: ReactNode;
  durationMs?: number | null;
}

export interface ActiveNotification extends NotificationOptions {
  id: string;
  title: ReactNode;
}

export type NotificationDisplayOptions = {
  title?: ReactNode;
  durationMs?: number | null;
};

export interface NotificationController {
  show: (options: NotificationOptions) => string;
  success: (message: ReactNode, options?: NotificationDisplayOptions) => string;
  error: (message: ReactNode, options?: NotificationDisplayOptions) => string;
  warning: (message: ReactNode, options?: NotificationDisplayOptions) => string;
  info: (message: ReactNode, options?: NotificationDisplayOptions) => string;
  dismiss: (id?: string) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ActiveNotification | null;
  dispose: () => void;
}

export type NotificationActions = Pick<
  NotificationController,
  "show" | "success" | "error" | "warning" | "info" | "dismiss"
>;

const DEFAULT_TITLES: Record<NotificationType, string> = {
  success: "Success",
  error: "Something went wrong",
  warning: "Please note",
  info: "Information",
};

const VALID_TYPES = new Set<NotificationType>(["success", "error", "warning", "info"]);

export function createNotificationController(): NotificationController {
  let current: ActiveNotification | null = null;
  let nextId = 0;
  let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const clearAutoClose = () => {
    if (autoCloseTimer !== null) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
  };

  const dismiss = (id?: string) => {
    if (!current || (id !== undefined && id !== current.id)) return;
    clearAutoClose();
    current = null;
    emit();
  };

  const show = (options: NotificationOptions): string => {
    if (!options || !VALID_TYPES.has(options.type)) {
      throw new TypeError("A valid notification type is required.");
    }
    if (options.message === undefined) {
      throw new TypeError("Notification message is required.");
    }
    if (
      options.durationMs !== undefined &&
      options.durationMs !== null &&
      (!Number.isFinite(options.durationMs) || options.durationMs <= 0)
    ) {
      throw new RangeError("Notification duration must be a positive number or null.");
    }

    clearAutoClose();
    const id = `notification-${++nextId}`;
    const { durationMs, title, ...content } = options;
    current = {
      ...content,
      id,
      title: title ?? DEFAULT_TITLES[options.type],
      ...(durationMs === undefined ? {} : { durationMs }),
    };
    emit();

    if (durationMs != null) {
      autoCloseTimer = setTimeout(() => dismiss(id), durationMs);
    }

    return id;
  };

  const withType = (type: NotificationType) =>
    (message: ReactNode, options: NotificationDisplayOptions = {}) =>
      show({ type, message, ...options });

  return {
    show,
    success: withType("success"),
    error: withType("error"),
    warning: withType("warning"),
    info: withType("info"),
    dismiss,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => current,
    dispose: () => {
      clearAutoClose();
      current = null;
      listeners.clear();
    },
  };
}