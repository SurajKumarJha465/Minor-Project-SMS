import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/hod/")({
  beforeLoad: () => { throw redirect({ to: "/hod/dashboard" }); },
});
