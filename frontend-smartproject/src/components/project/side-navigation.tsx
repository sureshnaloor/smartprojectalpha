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
  Briefcase
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
  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(false);
  const [isWikiExpanded, setIsWikiExpanded] = useState(false);
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
        "bg-gradient-to-r from-gray-200 via-gray-100 to-blue-100 border-r border-gray-300 flex-shrink-0 transition-all duration-300 h-[calc(100vh-4rem)] fixed md:relative top-16 md:top-0 z-30 shadow-lg",
        isOpen ? "w-64 left-0" : "-left-full md:left-0 md:w-0"
      )}>
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 border-b border-gray-300 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.1em' }}>PROJECTS</h2>
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

          <div className="overflow-y-auto flex-1 bg-white/30 backdrop-blur-sm">
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
                          "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                          currentProjectId === project.id && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                        )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: currentProjectId === project.id ? 600 : 500, letterSpacing: '0.01em' }}>
                          {currentProjectId === project.id ? (
                            <Building2 className="mr-3 h-5 w-5" />
                          ) : (
                            <Building className="mr-3 h-5 w-5" />
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
                    <div className="px-4 py-3 border-t border-gray-300 bg-white">
                      <h2 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.1em' }}>
                        Project Tools
                      </h2>
                    </div>
                    <ul className="py-1">
                      <li>
                        <Link href={`/projects/${currentProjectId}/collab`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                            isActive('/collab') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                          )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/collab') ? 600 : 500, letterSpacing: '0.01em' }}>
                            <MessageSquareTextIcon className="mr-3 h-5 w-5" />
                            <span>Collaboration Hub</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}/activities`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                            isActive('/activities') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                          )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/activities') ? 600 : 500, letterSpacing: '0.01em' }}>
                            <Activity className="mr-3 h-5 w-5" />
                            <span>Activities</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}/tasks`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                            isActive('/tasks') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                          )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/tasks') ? 600 : 500, letterSpacing: '0.01em' }}>
                            <ListTodo className="mr-3 h-5 w-5" />
                            <span>Tasks</span>
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/projects/${currentProjectId}/resources`}>
                          <a className={cn(
                            "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                            isActive('/resources') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                          )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/resources') ? 600 : 500, letterSpacing: '0.01em' }}>
                            <Users className="mr-3 h-5 w-5" />
                            <span>Resources</span>
                          </a>
                        </Link>
                      </li>

                      {/* Project Documents Section */}
                      <li>
                        <button
                          onClick={() => setIsDocumentsExpanded(!isDocumentsExpanded)}
                          className={cn(
                            "flex items-center justify-between w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                            isActive('/documents') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                          )}
                          style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/documents') ? 600 : 500, letterSpacing: '0.01em' }}
                        >
                          <div className="flex items-center">
                            <FolderOpen className="mr-3 h-5 w-5" />
                            <span>Project Documents</span>
                          </div>
                          {isDocumentsExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>

                        {/* Documents Sub-menu */}
                        {isDocumentsExpanded && (
                          <ul className="ml-6 border-l border-gray-200">
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/ProjectDrawings`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200 text-sm",
                                  isActive('/project-drawings') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                                )}>
                                  <FileImage className="mr-3 h-4 w-4" />
                                  <span>Project Drawings</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/ProjectBOQ`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/project-boq') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <FileSpreadsheet className="mr-3 h-4 w-4" />
                                  <span>Project BOQ</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/ProjectScope`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/project-scope') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <FileTextIcon className="mr-3 h-4 w-4" />
                                  <span>Project Scope Document (PTS)</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/EquipmentCatalogue`}>
                                <a className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                                  location.includes('/under-construction/EquipmentCatalogue')
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                                )}>
                                  <FolderOpen className="h-4 w-4" />
                                  <span>Equipment Catalogue</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/ClientCorrespondence`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/client-correspondence') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <MessageSquare className="mr-3 h-4 w-4" />
                                  <span>Client Correspondence</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/SupplierCorrespondence`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/supplier-correspondence') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <MessageCircle className="mr-3 h-4 w-4" />
                                  <span>Supplier Correspondence</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/SubcontractCorrespondence`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/subcontract-correspondence') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <MessageSquareText className="mr-3 h-4 w-4" />
                                  <span>Subcontract Correspondence</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/RequestForInspection`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/request-for-inspection') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <ClipboardCheck className="mr-3 h-4 w-4" />
                                  <span>Request for Inspection</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/ITPAndReports`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/itp-and-reports') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <FileCheck className="mr-3 h-4 w-4" />
                                  <span>ITP and Reports</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/OtherDocuments`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/other-documents') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <FolderOpenIcon className="mr-3 h-4 w-4" />
                                  <span>Others</span>
                                </a>
                              </Link>
                            </li>
                          </ul>
                        )}
                      </li>

                      {/* Project Wiki Section */}
                      <li>
                        <button
                          onClick={() => setIsWikiExpanded(!isWikiExpanded)}
                          className={cn(
                            "flex items-center justify-between w-full px-4 py-2 text-gray-600 hover:bg-gray-50",
                            isActive('/wiki') && "text-teal-600 font-medium bg-teal-50"
                          )}
                        >
                          <div className="flex items-center">
                            <BookOpen className="mr-3 h-5 w-5" />
                            <span>Project Wiki</span>
                          </div>
                          {isWikiExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>

                        {/* Wiki Sub-menu */}
                        {isWikiExpanded && (
                          <ul className="ml-6 border-l border-gray-200">
                            <li>
                              <Link href={`/projects/${currentProjectId}/project-daily-progress`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/project-daily-progress') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <Calendar className="mr-3 h-4 w-4" />
                                  <span>Project Daily Progress</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/resource-plan`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/resource-plan') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <UserCheck className="mr-3 h-4 w-4" />
                                  <span>Resource Plan</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/risk-register`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/risk-register') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <AlertTriangle className="mr-3 h-4 w-4" />
                                  <span>Risk Register</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/lesson-learnt-register`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/lesson-learnt-register') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <Lightbulb className="mr-3 h-4 w-4" />
                                  <span>Lesson Learnt Register</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/direct-manpower-list`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/direct-manpower-list') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <User className="mr-3 h-4 w-4" />
                                  <span>Direct Manpower List</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/indirect-manpower-list`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/indirect-manpower-list') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <UserPlus className="mr-3 h-4 w-4" />
                                  <span>Indirect Manpower List</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/planned-activity-tasks`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/planned-activity-tasks') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <ClipboardList className="mr-3 h-4 w-4" />
                                  <span>Daily Activity/Tasks Planned</span>
                                </a>
                              </Link>
                            </li>
                            <li>
                              <Link href={`/projects/${currentProjectId}/under-construction/OtherWiki`}>
                                <a className={cn(
                                  "flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm",
                                  isActive('/other-wiki') && "text-teal-600 font-medium bg-teal-50"
                                )}>
                                  <MoreHorizontal className="mr-3 h-4 w-4" />
                                  <span>Others</span>
                                </a>
                              </Link>
                            </li>
                          </ul>
                        )}
                      </li>
                    </ul>
                  </>
                )}

                {/* Global tools, always visible */}
                <div className="px-4 py-3 border-t border-gray-300 bg-white">
                  <h2 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.1em' }}>
                    Global Tools
                  </h2>
                </div>
                <ul className="py-1">
                  <li>
                    <Link href="/collab">
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                        isActive('/collab') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                      )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/collab') ? 600 : 500, letterSpacing: '0.01em' }}>
                        <MessageSquareTextIcon className="mr-3 h-5 w-5" />
                        <span>Collaboration Hub</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/activity-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                        isActive('/activity-master') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                      )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/activity-master') ? 600 : 500, letterSpacing: '0.01em' }}>
                        <Activity className="mr-3 h-5 w-5" />
                        <span>Activity Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/task-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                        isActive('/task-master') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                      )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/task-master') ? 600 : 500, letterSpacing: '0.01em' }}>
                        <ListTodo className="mr-3 h-5 w-5" />
                        <span>Task Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/resource-master`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                        isActive('/resource-master') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                      )}>
                        <Users className="mr-3 h-5 w-5" />
                        <span>Resource Master</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/newlanding">
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                        isActive('/newlanding') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                      )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/newlanding') ? 600 : 500, letterSpacing: '0.01em' }}>
                        <LayoutDashboard className="mr-3 h-5 w-5" />
                        <span>New Landing</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={currentProjectId ? `/newproject/${currentProjectId}` : "/newlanding"}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                        isActive('/newproject') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                      )} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: '0.9375rem', fontWeight: isActive('/newproject') ? 600 : 500, letterSpacing: '0.01em' }}>
                        <Briefcase className="mr-3 h-5 w-5" />
                        <span>New Project Detail</span>
                      </a>
                    </Link>
                  </li>
                </ul>

                {/* Reports & Analytics */}
                <div className="px-4 py-3 border-t border-gray-300 bg-white">
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Reports & Analytics
                  </h2>
                </div>
                <ul className="py-1">
                  <li>
                    <Link href={`/under-construction/Charts`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                        isActive('/under-construction/Charts') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                      )}>
                        <PieChart className="mr-3 h-5 w-5" />
                        <span>Charts</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/under-construction/Reports`}>
                      <a className={cn(
                        "flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200",
                        isActive('/under-construction/Reports') && "text-teal-700 font-semibold bg-teal-50 border-r-2 border-teal-500"
                      )}>
                        <FileText className="mr-3 h-5 w-5" />
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