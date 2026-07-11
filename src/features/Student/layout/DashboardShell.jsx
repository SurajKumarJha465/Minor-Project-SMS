import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

/**
 * DashboardShell — composes the sidebar + topbar around the active page.
 */
export default function DashboardShell({
  nav,
  activeId,
  onNavigate,
  breadcrumb,
  user,
  brandLabel,
  roleId,
  roleOptions,
  onRoleChange,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar
        nav={nav}
        activeId={activeId}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        brandLabel={brandLabel}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          breadcrumb={breadcrumb}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onOpenMobile={() => setMobileOpen(true)}
          user={user}
          roleId={roleId}
          roleOptions={roleOptions}
          onRoleChange={onRoleChange}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
