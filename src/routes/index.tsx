import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // /auth already redirects signed-in users to /dashboard in a client
    // useEffect, so a plain server-side redirect here avoids the hydration
    // mismatch caused by an async ssr:false beforeLoad.
    throw redirect({ to: "/auth" });
  },
});
