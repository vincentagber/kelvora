import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createNotificationController } from "./notification-modal.ts";

describe("notification modal controller", () => {
  it("supports success, error, warning, and info with dynamic content", () => {
    const notifications = createNotificationController();
    const methods = [
      ["success", notifications.success],
      ["error", notifications.error],
      ["warning", notifications.warning],
      ["info", notifications.info],
    ] as const;

    for (const [type, notify] of methods) {
      const message = `Request REQ-2048 ${type}`;
      const id = notify(message, { title: `Dynamic ${type} title` });
      assert.equal(notifications.getSnapshot()?.id, id);
      assert.equal(notifications.getSnapshot()?.type, type);
      assert.equal(notifications.getSnapshot()?.title, `Dynamic ${type} title`);
      assert.equal(notifications.getSnapshot()?.message, message);
    }

    notifications.dispose();
  });

  it("uses default titles and replaces an active notification", () => {
    const notifications = createNotificationController();
    const firstId = notifications.info("Saved invoice INV-42");
    const secondId = notifications.warning("Review the changed payment terms");

    assert.notEqual(firstId, secondId);
    assert.equal(notifications.getSnapshot()?.id, secondId);
    assert.equal(notifications.getSnapshot()?.title, "Please note");

    notifications.dispose();
  });

  it("dismisses only the current notification", () => {
    const notifications = createNotificationController();
    const oldId = notifications.info("Old message");
    const currentId = notifications.error("Current message");

    notifications.dismiss(oldId);
    assert.equal(notifications.getSnapshot()?.id, currentId);

    notifications.dismiss();
    assert.equal(notifications.getSnapshot(), null);
    notifications.dispose();
  });

  it("auto-closes after the configured duration", async () => {
    const notifications = createNotificationController();
    notifications.success("Export completed", { durationMs: 10 });

    await new Promise((resolve) => setTimeout(resolve, 25));

    assert.equal(notifications.getSnapshot(), null);
    notifications.dispose();
  });

  it("keeps notifications open when auto-close is disabled", async () => {
    const notifications = createNotificationController();
    const id = notifications.error("Review this error", { durationMs: null });

    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(notifications.getSnapshot()?.id, id);
    notifications.dispose();
  });

  it("rejects invalid auto-close durations", () => {
    const notifications = createNotificationController();

    assert.throws(
      () => notifications.info("Invalid duration", { durationMs: 0 }),
      /duration must be a positive number or null/,
    );
    notifications.dispose();
  });
});