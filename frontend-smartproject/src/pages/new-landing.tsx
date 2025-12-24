import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MasterLayout from "@/layouts/master-layout";
import ReactECharts from "echarts-for-react";
import anime from "animejs";
import {
  Building2,
  DollarSign,
  CheckCircle2,
  ListTodo,
  Search,
  Filter,
  ArrowUpRight,
  User,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddProjectModal } from "@/components/project/add-project-modal";
import { EditProjectModal } from "@/components/project/edit-project-modal";
import { DeleteProjectDialog } from "@/components/project/delete-project-dialog";

// Project type from API
interface Project {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: string;
  currency: string;
  projectType: string | null;
  status: string | null;
  createdAt: string;
}

// Map project types to images
const projectTypeImages: Record<string, string> = {
  "Highway": "/resources/project-1.jpg",
  "Infrastructure": "/resources/project-2.jpg",
  "Power": "/resources/project-3.jpg",
  "Commercial": "/resources/project-2.jpg",
  "Petrochem": "/resources/project-1.jpg",
  "Oil&Gas": "/resources/project-3.jpg",
};

const recentActivity = [
  {
    id: 1,
    project: "Highway Extension Project",
    action: "Completed Task",
    description: "Finished rough grading for north section",
    timestamp: "2 hours ago",
    type: "task",
    user: "John Smith"
  },
  {
    id: 2,
    project: "Office Complex Construction",
    action: "Budget Update",
    description: "Added $150K for additional steel reinforcement",
    timestamp: "4 hours ago",
    type: "budget",
    user: "Michael Chen"
  }
];

export default function NewLanding() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch projects from API
  const { data: projects = [], isLoading, isError } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  useEffect(() => {
    // Hero Animations
    anime({
      targets: heroRef.current?.querySelectorAll(".animate-text"),
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(100),
      duration: 1000,
      easing: "easeOutExpo"
    });

    // Cards Scroll Animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          anime({
            targets: entry.target,
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
            easing: "easeOutExpo"
          });
        }
      });
    }, { threshold: 0.1 });

    const cards = cardsRef.current?.querySelectorAll(".card-animate");
    cards?.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesTypeFilter = typeFilter === "all" || p.projectType === typeFilter;
    const matchesStatusFilter = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesTypeFilter && matchesStatusFilter;
  });

  // Calculate stats from real data
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget), 0);
  const activeProjects = projects.length;

  // Get image for project
  const getProjectImage = (project: Project) => {
    if (project.projectType && projectTypeImages[project.projectType]) {
      return projectTypeImages[project.projectType];
    }
    // Default image based on project id
    const images = ["/resources/project-1.jpg", "/resources/project-2.jpg", "/resources/project-3.jpg"];
    return images[project.id % 3];
  };

  // Determine project status based on dates
  const getProjectStatus = (project: Project): "active" | "planning" | "completed" => {
    const now = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);

    if (now < startDate) return "planning";
    if (now > endDate) return "completed";
    return "active";
  };

  // Calculate progress based on timeline
  const getProjectProgress = (project: Project): number => {
    const now = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);

    if (now < startDate) return 0;
    if (now > endDate) return 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.round((elapsed / totalDuration) * 100);
  };

  // Format currency
  const formatBudget = (budget: string, currency: string): string => {
    const num = Number(budget);
    if (num >= 1000000) {
      return `${currency} ${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${currency} ${(num / 1000).toFixed(0)}K`;
    }
    return `${currency} ${num.toFixed(0)}`;
  };

  // Get unique project types for filter
  const projectTypes = Array.from(new Set(projects.map(p => p.projectType).filter(Boolean)));

  // Chart data based on project types
  const chartData = projectTypes.map((type, index) => {
    const colors = ['#475569', '#F59E0B', '#10B981', '#EA580C', '#8B5CF6', '#EC4899'];
    const typeProjects = projects.filter(p => p.projectType === type);
    const totalBudget = typeProjects.reduce((sum, p) => sum + Number(p.budget), 0) / 1000000;
    return {
      name: type || 'Other',
      value: Math.round(totalBudget * 10) / 10,
      itemStyle: { color: colors[index % colors.length] }
    };
  });

  const chartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ${c}M ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#6B7280' }
    },
    series: [
      {
        name: 'Budget Allocation',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: '18', fontWeight: 'bold' }
        },
        data: chartData.length > 0 ? chartData : [
          { name: 'No Projects', value: 1, itemStyle: { color: '#E5E7EB' } }
        ]
      }
    ]
  };

  // Navigate to project
  const handleProjectClick = (projectId: number) => {
    setLocation(`/projects/${projectId}`);
  };

  return (
    <MasterLayout>
      <div className="min-h-screen bg-gray-50/50">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative py-20 bg-slate-900 overflow-hidden"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('/resources/project-1.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <h1 className="animate-text text-4xl md:text-6xl font-bold text-white mb-6 font-display">
              Construction Project Management
            </h1>
            <p className="animate-text text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Streamline your infrastructure delivery with advanced WBS controls,
              real-time budget tracking, and automated reporting.
            </p>
            <div className="animate-text flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsAddProjectModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Project
              </button>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-8 py-3 rounded-lg font-semibold transition-all">
                View Portfolios
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              { label: "Active Projects", value: activeProjects.toString(), icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Total Budget", value: formatBudget(totalBudget.toString(), "USD"), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Projects Control Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <select
                    className="flex-1 sm:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="Highway">Highway</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Power">Power</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Petrochem">Petrochem</option>
                    <option value="Oil&Gas">Oil & Gas</option>
                  </select>
                  <select
                    className="flex-1 sm:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="concept">Concept</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="in progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="aborted">Aborted</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => setIsAddProjectModalOpen(true)}
                    className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <span className="ml-2 text-slate-600">Loading projects...</span>
                </div>
              )}

              {/* Error State */}
              {isError && (
                <div className="text-center py-20 bg-white rounded-2xl border border-red-200">
                  <p className="text-red-600">Failed to load projects. Please try again.</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !isError && filteredProjects.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects found</h3>
                  <p className="text-slate-500 mb-6">
                    {search || typeFilter !== "all" ? "Try adjusting your filters" : "Create your first project to get started"}
                  </p>
                  <button
                    onClick={() => setIsAddProjectModalOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Project
                  </button>
                </div>
              )}

              {/* Projects Grid */}
              {!isLoading && !isError && filteredProjects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={cardsRef}>
                  {filteredProjects.map((project) => {
                    const status = getProjectStatus(project);
                    const progress = getProjectProgress(project);

                    return (
                      <div
                        key={project.id}
                        className="card-animate group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={getProjectImage(project)}
                            alt={project.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4">
                            {project.projectType && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/70 text-white backdrop-blur-md">
                                {project.projectType}
                              </span>
                            )}
                          </div>
                          <div className="absolute top-4 right-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md",
                              status === 'active' ? 'bg-emerald-500/20 text-emerald-600' :
                                status === 'planning' ? 'bg-amber-500/20 text-amber-600' :
                                  'bg-blue-500/20 text-blue-600'
                            )}>
                              {status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{project.name}</h3>
                          <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                            {project.description || "No description provided"}
                          </p>

                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-slate-500 uppercase tracking-wider">Completion</span>
                                <span className="text-slate-900">{progress}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                  <DollarSign className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold text-slate-600">
                                  {formatBudget(project.budget, project.currency)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditProjectId(project.id)}
                                  className="text-blue-400 hover:text-blue-600 p-1 rounded transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <DeleteProjectDialog
                                  projectId={project.id}
                                  projectName={project.name}
                                  trigger={
                                    <button className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  }
                                />
                                <button
                                  onClick={() => handleProjectClick(project.id)}
                                  className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-1"
                                >
                                  DETAILS <ArrowUpRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-8">
              {/* Budget Allocation Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  Budget by Type
                </h3>
                <div className="h-[300px]">
                  <ReactECharts option={chartOption} style={{ height: '100%' }} />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
                <div className="space-y-6">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        activity.type === 'task' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      )}>
                        {activity.type === 'task' ? <CheckCircle2 className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{activity.action}</div>
                        <div className="text-xs text-slate-500 mb-1">{activity.project}</div>
                        <p className="text-sm text-slate-600">{activity.description}</p>
                        <div className="mt-2 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {activity.user}</span>
                          <span>•</span>
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-3 text-slate-500 text-xs font-bold hover:text-slate-900 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                    View All Logs <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onSuccess={(projectId) => {
          setIsAddProjectModalOpen(false);
        }}
      />

      {/* Edit Project Modal */}
      {editProjectId && (
        <EditProjectModal
          projectId={editProjectId}
          isOpen={editProjectId !== null}
          onClose={() => setEditProjectId(null)}
          onSuccess={() => setEditProjectId(null)}
        />
      )}
    </MasterLayout>
  );
}
