import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SideNavigation } from "@/components/project/side-navigation";
import { ProjectHeader } from "@/components/project/project-header";
import { SimpleProjectHeader } from "@/components/project/simple-project-header";
import { useMobile } from "@/hooks/use-mobile";
import { Toaster } from "sonner";
import { AlertTriangle, FolderOpen, Calendar, UserCheck, Lightbulb, User, UserPlus, ClipboardList, MessageSquareText } from "lucide-react";
import { SharedNavigation } from "@/components/shared-navigation";

interface ProjectLayoutProps {
  children: React.ReactNode;
  projectId?: number;
}

export default function ProjectLayout({ children, projectId }: ProjectLayoutProps) {
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [location, setLocation] = useLocation();

  // Validate the projectId if provided
  useEffect(() => {
    if (projectId && (isNaN(projectId) || projectId <= 0)) {
      setLocation("/");
    }
  }, [projectId, setLocation]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Check if current page is a wiki or document page
  // Note: collab is excluded from isWikiPage so it can use ProjectHeader with tabs
  const isWikiPage = location.includes('/under-construction/ProjectDailyProgress') ||
    location.includes('/under-construction/ProjectDailyResourceDeployed') ||
    location.includes('/under-construction/RiskRegister') ||
    location.includes('/under-construction/LessonLearntRegister') ||
    location.includes('/under-construction/DirectManpowerList') ||
    location.includes('/under-construction/IndirectManpowerList') ||
    location.includes('/under-construction/DailyActivityTasksPlanned') ||
    location.includes('/under-construction/OtherWiki') ||
    location.includes('/risk-register') ||
    location.includes('/project-daily-progress') ||
    location.includes('/resource-plan') ||
    location.includes('/lesson-learnt-register') ||
    location.includes('/direct-manpower-list') ||
    location.includes('/indirect-manpower-list') ||
    location.includes('/planned-activity-tasks');

  const isDocumentPage = location.includes('/under-construction/ProjectDrawings') ||
    location.includes('/under-construction/ProjectBOQ') ||
    location.includes('/under-construction/ProjectScope') ||
    location.includes('/under-construction/EquipmentCatalogue') ||
    location.includes('/under-construction/ClientCorrespondence') ||
    location.includes('/under-construction/SupplierCorrespondence') ||
    location.includes('/under-construction/SubcontractCorrespondence') ||
    location.includes('/under-construction/RequestForInspection') ||
    location.includes('/under-construction/ITPAndReports') ||
    location.includes('/under-construction/OtherDocuments');

  // Determine page title and icon
  const getPageInfo = () => {
    if (location.includes('/collab')) {
      return { title: 'Collaboration Hub', icon: <MessageSquareText className="h-4 w-4" /> };
    }
    if (location.includes('/risk-register')) {
      return { title: 'Risk Register', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (location.includes('/project-daily-progress')) {
      return { title: 'Project Daily Progress', icon: <Calendar className="h-4 w-4" /> };
    }
    if (location.includes('/resource-plan')) {
      return { title: 'Resource Plan', icon: <UserCheck className="h-4 w-4" /> };
    }
    if (location.includes('/lesson-learnt-register')) {
      return { title: 'Lesson Learnt Register', icon: <Lightbulb className="h-4 w-4" /> };
    }
    if (location.includes('/direct-manpower-list')) {
      return { title: 'Direct Manpower List', icon: <User className="h-4 w-4" /> };
    }
    if (location.includes('/indirect-manpower-list')) {
      return { title: 'Indirect Manpower List', icon: <UserPlus className="h-4 w-4" /> };
    }
    if (location.includes('/planned-activity-tasks')) {
      return { title: 'Planned Activity/Tasks', icon: <ClipboardList className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/RiskRegister')) {
      return { title: 'Risk Register', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/ProjectDailyProgress')) {
      return { title: 'Project Daily Progress', icon: <Calendar className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/ProjectDailyResourceDeployed')) {
      return { title: 'Project Daily Resource Deployed', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/LessonLearntRegister')) {
      return { title: 'Lesson Learnt Register', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/DirectManpowerList')) {
      return { title: 'Direct Manpower List', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/IndirectManpowerList')) {
      return { title: 'Indirect Manpower List', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/DailyActivityTasksPlanned')) {
      return { title: 'Daily Activity/Tasks Planned', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/OtherWiki')) {
      return { title: 'Other Wiki', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/ProjectDrawings')) {
      return { title: 'Project Drawings', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/ProjectBOQ')) {
      return { title: 'Project BOQ', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/ProjectScope')) {
      return { title: 'Project Scope Document (PTS)', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/EquipmentCatalogue')) {
      return { title: 'Equipment Catalogue', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/ClientCorrespondence')) {
      return { title: 'Client Correspondence', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/SupplierCorrespondence')) {
      return { title: 'Supplier Correspondence', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/SubcontractCorrespondence')) {
      return { title: 'Subcontract Correspondence', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/RequestForInspection')) {
      return { title: 'Request for Inspection', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/ITPAndReports')) {
      return { title: 'ITP and Reports', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (location.includes('/under-construction/OtherDocuments')) {
      return { title: 'Other Documents', icon: <FolderOpen className="h-4 w-4" /> };
    }
    if (isWikiPage) {
      return { title: 'Project Wiki', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (isDocumentPage) {
      return { title: 'Project Documents', icon: <FolderOpen className="h-4 w-4" /> };
    }
    return { title: '', icon: null };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {/* Top Navigation - Fixed */}
      <SharedNavigation variant="app" />
      
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)', paddingTop: '4rem' }}>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar Navigation */}
          <SideNavigation currentProjectId={projectId} />

          {/* Main Content Area - Updated to enable scrolling */}
          <main className="flex-1 flex flex-col">
            {/* Project Header & Tabs */}
            {projectId && (
              isWikiPage || isDocumentPage ? (
                <SimpleProjectHeader
                  projectId={projectId}
                  pageTitle={pageInfo.title}
                  pageIcon={pageInfo.icon}
                />
              ) : (
                <ProjectHeader
                  projectId={projectId}
                  onToggleSidebar={toggleSidebar}
                />
              )
            )}

            {/* Content - Updated to enable scrolling with overflow-y-auto */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
