import { createFileRoute } from "@tanstack/react-router";
import StudentApp from "@/features/Student/StudentApp";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Portal · Smart Student Management System" },
      {
        name: "description",
        content:
          "Student dashboard for courses, attendance, internal marks, semester results and notices.",
      },
    ],
  }),
  component: StudentApp,
});
