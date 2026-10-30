import { useContext } from "react";
import { NotificationModalContext } from "@/lib/notification-modal-context";
import type { NotificationActions } from "@/lib/notification-modal";

export function useNotificationModal(): NotificationActions {
  const controller = useContext(NotificationModalContext);
  if (!controller) {
    throw new Error("useNotificationModal must be used within NotificationModalProvider.");
  }
  return controller;
}