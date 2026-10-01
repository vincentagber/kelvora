import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NotificationModalContext } from "@/lib/notification-modal-context";
import {
  createNotificationController,
  type ActiveNotification,
  type NotificationController,
  type NotificationType,
} from "@/lib/notification-modal";

const APPEARANCE: Record<
  NotificationType,
  { icon: LucideIcon; accent: string; iconColor: string; iconBackground: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: "border-emerald-200",
    iconColor: "text-emerald-700",
    iconBackground: "bg-emerald-50",
  },
  error: {
    icon: AlertCircle,
    accent: "border-rose-200",
    iconColor: "text-rose-700",
    iconBackground: "bg-rose-50",
  },
  warning: {
    icon: TriangleAlert,
    accent: "border-amber-200",
    iconColor: "text-amber-700",
    iconBackground: "bg-amber-50",
  },
  info: {
    icon: Info,
    accent: "border-sky-200",
    iconColor: "text-sky-700",
    iconBackground: "bg-sky-50",
  },
};

export function NotificationModalProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(createNotificationController);

  useEffect(() => () => controller.dispose(), [controller]);

  return (
    <NotificationModalContext.Provider value={controller}>
      {children}
      <NotificationModalHost controller={controller} />
    </NotificationModalContext.Provider>
  );
}

function NotificationModalHost({ controller }: { controller: NotificationController }) {
  const notification = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    () => null,
  );

  if (!notification) return null;

  return (
    <NotificationModalView
      notification={notification}
      onDismiss={() => controller.dismiss(notification.id)}
    />
  );
}

function NotificationModalView({
  notification,
  onDismiss,
}: {
  notification: ActiveNotification;
  onDismiss: () => void;
}) {
  const appearance = APPEARANCE[notification.type];
  const Icon = appearance.icon;

  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent
        role={notification.type === "error" || notification.type === "warning" ? "alertdialog" : "dialog"}
        className={`w-[calc(100vw-2rem)] max-w-md rounded-xl border ${appearance.accent} bg-white p-0 shadow-xl`}
      >
        <div className="flex gap-3 p-6 pb-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${appearance.iconBackground} ${appearance.iconColor}`}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>
          <DialogHeader className="pr-5 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {notification.title}
            </DialogTitle>
            <DialogDescription asChild>
              <div
                aria-live={notification.type === "error" ? "assertive" : "polite"}
                aria-atomic="true"
                className="pt-1 text-sm leading-5 text-slate-600"
              >
                {notification.message}
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <DialogClose asChild>
            <Button type="button" onClick={onDismiss}>
              Dismiss
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}