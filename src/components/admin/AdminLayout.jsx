import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:ml-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-h-screen">
          <div className="w-full px-5 sm:px-6 sm:py-7 lg:px-10 lg:py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
