import { createContext } from "react";
import type { NotificationActions } from "./notification-modal";

export const NotificationModalContext = createContext<NotificationActions | null>(null);