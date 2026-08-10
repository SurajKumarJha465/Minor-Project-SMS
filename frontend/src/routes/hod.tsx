import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HodSidebar } from "@/features/HoD/components/Sidebar";
import { HodTopbar } from "@/features/HoD/components/Topbar";
import { HodBottomNav } from "@/features/HoD/components/BottomNav";
import { authHeader } from "@/lib/auth";

export const Route = createFileRoute("/hod")({
  component: HodLayout,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type HodProfile = { name: string; department: string; photo: string | null };

function HodLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hod, setHod] = useState<HodProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/hod/me`, { headers: { ...authHeader() } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data) setHod(data); })
      .catch(() => { /* sidebar/topbar degrade gracefully if this fails */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex min-h-screen">
      <HodSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} department={hod?.department} />
      <div className="flex min-w-0 flex-1 flex-col">
        <HodTopbar onMenu={() => setSidebarOpen(true)} hod={hod} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-6 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
        <HodBottomNav />
      </div>
    </div>
  );
}