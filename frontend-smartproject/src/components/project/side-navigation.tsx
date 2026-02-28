import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  Building,
  Building2,
  BringToFront,
  Settings,
  Download,
  Plus,
  Activity,
  ListTodo,
  Users,
  PieChart,
  FileText,
  FolderOpen,
  Folder,
  ChevronDown,
  ChevronRight,
  FileImage,
  FileSpreadsheet,
  FileText as FileTextIcon,
  HardDrive,
  MessageSquare,
  MessageCircle,
  MessageSquareText,
  ClipboardCheck,
  FileCheck,
  BarChart3,
  FolderOpen as FolderOpenIcon,
  BookOpen,
  Calendar,
  UserCheck,
  AlertTriangle,
  Lightbulb,
  User,
  UserPlus,
  ClipboardList,
  MoreHorizontal,
  MessageSquareText as MessageSquareTextIcon,
  LayoutDashboard,
  Briefcase,
  Package,
  LayoutGrid
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/use-mobile";
import { AddProjectModal } from "./add-project-modal";

interface SideNavigationProps {
  currentProjectId?: number;
}

export function SideNavigation({ currentProjectId }: SideNavigationProps) {
  const [location, setLocation] = useLocation();
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Toggle sidebar when mobile state changes
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  // Fetch all projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Get the current project
  const currentProject = projects.find(project => project.id === currentProjectId);

  // Check if a path is active
  const isActive = (path: string) => {
    return location.includes(path);
  };

  // Treat any of the project document routes as \"Project Documents\" active
  const isDocumentsRoute = [
    '/project-docs/ProjectDrawings',
    '/project-docs/ProjectBOQ',
    '/project-docs/ProjectScope',
    '/project-docs/EquipmentCatalogue',
    '/project-docs/ClientCorrespondence',
    '/project-docs/SupplierCorrespondence',
    '/project-docs/SubcontractCorrespondence',
    '/project-docs/RequestForInspection',
    '/project-docs/ITPAndReports',
    '/project-docs/OtherDocuments',
  ].some((p) => location.includes(p));

  const isWikiRoute = [
    "/project-daily-progress",
    "/resource-plan",
    "/risk-register",
    "/lesson-learnt-register",
    "/direct-manpower-list",
    "/indirect-manpower-list",
    "/planned-activity-tasks",
    "/project-docs/OtherWiki",
  ].some((p) => location.includes(p));

  if (isMobile && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-16 left-0 z-20 p-2 bg-white rounded-r-md shadow-md text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>
    );
  }

  return (
    <>
      <aside className={cn(
        "bg-slate-900/95 border-r border-slate-800 flex-shrink-0 transition-all duration-300 app-shell-sidebar z-30 shadow-lg text-slate-100",
        isOpen ? "w-56 left-0" : "-left-full md:left-0 md:w-0"
      )}>
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 border-b border-slate-800 bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.2em' }}>PROJECTS</h2>
              <button
                className="text-primary-600 hover:text-primary-800 transition-all hover:scale-110"
                onClick={() => setIsAddProjectModalOpen(true)}
              >
                <Plus size={16} />
              </button>

              {isMobile && (
                <button
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="x">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 bg-slate-900/60 backdrop-blur-sm">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <>
                <ul className="py-2">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <Link href={`/projects/${project.id}`}>
                        <a className={cn(
                          "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                          currentProjectId === project.id && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                        )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: currentProjectId === project.id ? 600 : 500, letterSpacing: '0.12em' }}>
                          {currentProjectId === project.id ? (
                            <Building2 className="mr-3 h-4 w-4" />
                          ) : (
                            <Building className="mr-3 h-4 w-4" />
                          )}
                          <span className="truncate">{project.name}</span>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Project-specific tools, only shown when a project is selected */}
                {currentProjectId && (
                  <>
                    <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/95">
                      <h2 className="text-xs font-extrabold text-emerald-300 uppercase tracking-widest" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.2em' }}>
                        Project Tools
                      </h2>
                    </div>
                    <ul className="py-1">
                      <li>
                        <Link href={`/newproject/${currentProjectId}`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                            isActive(`/newproject/${currentProjectId}`) && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                          )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive(`/newproject/${currentProjectId}`) ? 600 : 500, letterSpacing: '0.12em' }}>
                            <Briefcase className="mr-3 h-4 w-4" />
                            <span>{currentProject?.name}</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                            location === `/projects/${currentProjectId}` && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                          )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: location === `/projects/${currentProjectId}` ? 600 : 500, letterSpacing: '0.12em' }}>
                            <LayoutDashboard className="mr-3 h-4 w-4" />
                            <span>WBS and work packages</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}/collab`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                            isActive('/collab') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                          )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/collab') ? 600 : 500, letterSpacing: '0.12em' }}>
                            <MessageSquareTextIcon className="mr-3 h-4 w-4" />
                            <span>Collaboration Hub</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}/activities`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                            isActive('/activities') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                          )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/activities') ? 600 : 500, letterSpacing: '0.12em' }}>
                            <Activity className="mr-3 h-4 w-4" />
                            <span>Activities</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}/tasks`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                            isActive('/tasks') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                          )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/tasks') ? 600 : 500, letterSpacing: '0.12em' }}>
                            <ListTodo className="mr-3 h-4 w-4" />
                            <span>Tasks</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}/kanban`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                            isActive('/kanban') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                          )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/kanban') ? 600 : 500, letterSpacing: '0.12em' }}>
                            <LayoutGrid className="mr-3 h-4 w-4" />
                            <span>Kanban</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}/charts`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                            isActive('/charts') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                          )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/charts') ? 600 : 500, letterSpacing: '0.12em' }}>
                            <PieChart className="mr-3 h-4 w-4" />
                            <span>PERT & Gantt Charts</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}/materials-services/materials`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                            isActive('/materials-services') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                          )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/materials-services') ? 600 : 500, letterSpacing: '0.12em' }}>
                            <Package className="mr-3 h-4 w-4" />
                            <span>Materials, Services &amp; Resources</span>
                          </a>
                        </Link>
                      </li>

                      {/* Project Documents Section - single entry, details handled via tabs on page */}
                      <li>
                        <Link href={`/projects/${currentProjectId}/project-docs/ProjectDrawings`}>
                          <a
                            className={cn(
                              "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                              isDocumentsRoute && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                            )}
                            style={{
                              fontFamily:
                                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              fontSize: "0.65rem",
                              fontWeight: isDocumentsRoute ? 600 : 500,
                              letterSpacing: "0.12em",
                            }}
                          >
                            <FolderOpen className="mr-3 h-4 w-4" />
                            <span>Project Documents</span>
                          </a>
                        </Link>
                      </li>

                      {/* Project Wiki - single link; tabs in page header */}
                      <li>
                        <Link href={`/projects/${currentProjectId}/project-daily-progress`}>
                          <a
                            className={cn(
                              "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                              isWikiRoute && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                            )}
                            style={{
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              fontSize: "0.65rem",
                              fontWeight: isWikiRoute ? 600 : 500,
                              letterSpacing: "0.12em",
                            }}
                          >
                            <BookOpen className="mr-3 h-4 w-4" />
                            <span>Project Wiki</span>
                          </a>
                        </Link>
                      </li>
                    </ul>
                  </>
                )}

                {/* Global tools, always visible */}
                <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/95">
                  <h2 className="text-xs font-extrabold text-emerald-300 uppercase tracking-widest" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.2em' }}>
                    Global Tools
                  </h2>
                </div>
                <ul className="py-1">
                  <li>
                    <Link href="/collab">
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/collab') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/collab') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <MessageSquareTextIcon className="mr-3 h-4 w-4" />
                        <span>Collaboration Hub</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/activity-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/activity-master') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/activity-master') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <Activity className="mr-3 h-4 w-4" />
                        <span>Activity Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/task-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/task-master') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/task-master') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <ListTodo className="mr-3 h-4 w-4" />
                        <span>Task Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/resource-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/resource-master') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/resource-master') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <Users className="mr-3 h-4 w-4" />
                        <span>Resource Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/material-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/material-master') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/material-master') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <Building2 className="mr-3 h-4 w-4" />
                        <span>Material Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/service-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/service-master') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/service-master') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <Briefcase className="mr-3 h-4 w-4" />
                        <span>Service Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/vendor-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/vendor-master') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/vendor-master') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <Building className="mr-3 h-4 w-4" />
                        <span>Vendor Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/employee-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/employee-master') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/employee-master') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <UserPlus className="mr-3 h-4 w-4" />
                        <span>Employee Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/equipment-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/equipment-master') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/equipment-master') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <UserPlus className="mr-3 h-4 w-4" />
                        <span>Equipment Master</span>
                      </a>
                    </Link>
                  </li>

                </ul>

                {/* Reports & Analytics */}
                <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/95">
                  <h2 className="text-xs font-extrabold text-violet-300 uppercase tracking-widest" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.2em' }}>
                    Charts & Analytics
                  </h2>
                </div>
                <ul className="py-1">
                  <li>
                    <Link href={`/under-construction/Charts`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/under-construction/Charts') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/under-construction/Charts') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <PieChart className="mr-3 h-4 w-4" />
                        <span>Charts</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/under-construction/Reports`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-slate-100 hover:bg-slate-800/80 hover:text-white transition-colors duration-200 uppercase",
                        isActive('/under-construction/Reports') && "text-teal-300 font-semibold bg-slate-800 border-r-2 border-teal-400"
                      )} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '0.65rem', fontWeight: isActive('/under-construction/Reports') ? 600 : 500, letterSpacing: '0.12em' }}>
                        <FileText className="mr-3 h-4 w-4" />
                        <span>Reports</span>
                      </a>
                    </Link>
                  </li>
                </ul>
              </>
            )}
          </div>

          {currentProject && (
            <div className="p-3 border-t border-gray-300">
              <div className="relative bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 rounded-xl p-4 shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(20,184,166,0.4)] animate-pulse-slow" style={{
                boxShadow: '0 10px 30px rgba(20, 184, 166, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transform: 'perspective(1000px) rotateX(2deg)',
              }}>
                {/* Shine effect overlay */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>

                {/* Alert pulse ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl opacity-75 blur animate-pulse"></div>

                <div className="relative z-10">
                  <div className="text-xs font-bold text-white/90 uppercase tracking-wide mb-2 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Current Project
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white truncate drop-shadow-lg">{currentProject.name}</div>
                    <div className="flex space-x-2">
                      <button className="text-white/80 hover:text-white hover:scale-110 transition-all duration-200 p-1 rounded-lg hover:bg-white/20" title="Project Settings">
                        <Settings size={16} />
                      </button>
                      <button className="text-white/80 hover:text-white hover:scale-110 transition-all duration-200 p-1 rounded-lg hover:bg-white/20" title="Export Data">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onSuccess={(projectId) => {
          setIsAddProjectModalOpen(false);
          setLocation(`/projects/${projectId}`);
        }}
      />

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}