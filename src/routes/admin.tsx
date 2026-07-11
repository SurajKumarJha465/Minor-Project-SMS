import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { SaSidebar } from "@/components/superadmin/Sidebar";
import { SaTopbar } from "@/components/superadmin/Topbar";
import { SaBottomNav } from "@/components/superadmin/BottomNav";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <SaSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <SaTopbar onMenu={() => setSidebarOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-6 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
        <SaBottomNav />
      </div>
    </div>
  );
}
