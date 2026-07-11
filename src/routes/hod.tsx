import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { HodSidebar } from "@/components/hod/Sidebar";
import { HodTopbar } from "@/components/hod/Topbar";
import { HodBottomNav } from "@/components/hod/BottomNav";

export const Route = createFileRoute("/hod")({
  component: HodLayout,
});

function HodLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <HodSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <HodTopbar onMenu={() => setSidebarOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-6 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
        <HodBottomNav />
      </div>
    </div>
  );
}
