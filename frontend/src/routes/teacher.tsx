import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/features/Teacher/components/Sidebar";
import { Topbar } from "@/features/Teacher/components/Topbar";
import { BottomNav } from "@/features/Teacher/components/BottomNav";

export const Route = createFileRoute("/teacher")({
  component: AppLayout,
});

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-6 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
