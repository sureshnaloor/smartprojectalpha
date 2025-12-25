import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SideNavigation } from "@/components/project/side-navigation";
import { useMobile } from "@/hooks/use-mobile";
import { Toaster } from "sonner";
import { SharedNavigation } from "@/components/shared-navigation";

interface MasterLayoutProps {
  children: React.ReactNode;
  projectId?: number;
}

export default function MasterLayout({ children, projectId }: MasterLayoutProps) {
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [, setLocation] = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {/* Top Navigation - Fixed */}
      <SharedNavigation variant="app" />

      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)', paddingTop: '4rem' }}>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar Navigation - Show global navigation for master pages */}
          <SideNavigation currentProjectId={projectId} />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col">
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 