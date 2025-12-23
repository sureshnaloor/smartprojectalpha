import { useState, useEffect, useRef } from "react";
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
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample project data from main.js
const sampleProjects = [
  {
    id: 1,
    name: "Highway Extension Project",
    status: "active",
    progress: 65,
    budget: { allocated: 2500000, spent: 1800000 },
    startDate: "2024-04-15",
    endDate: "2025-04-15",
    image: "/resources/project-1.jpg",
    description: "Major highway extension connecting urban areas",
    wbsCount: 4,
    taskCount: 47,
    manager: "Sarah Johnson",
    location: "Downtown District"
  },
  {
    id: 2,
    name: "Office Complex Construction",
    status: "active",
    progress: 40,
    budget: { allocated: 5200000, spent: 2100000 },
    startDate: "2024-05-01",
    endDate: "2025-11-01",
    image: "/resources/project-2.jpg",
    description: "Modern office complex with sustainable design",
    wbsCount: 8,
    taskCount: 89,
    manager: "Michael Chen",
    location: "Business District"
  },
  {
    id: 3,
    name: "Residential Development",
    status: "planning",
    progress: 15,
    budget: { allocated: 8100000, spent: 1200000 },
    startDate: "2024-06-01",
    endDate: "2026-06-01",
    image: "/resources/project-3.jpg",
    description: "Multi-unit residential development project",
    wbsCount: 6,
    taskCount: 156,
    manager: "Emily Rodriguez",
    location: "Suburban Area"
  }
];

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
  const [projects, setProjects] = useState(sampleProjects);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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

  const filteredProjects = projects.filter(p => {
    const matchesFilter = filter === "all" || p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.manager.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
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
        data: [
          { name: 'Highway Projects', value: 4.3, itemStyle: { color: '#475569' } },
          { name: 'Commercial', value: 5.2, itemStyle: { color: '#F59E0B' } },
          { name: 'Residential', value: 8.1, itemStyle: { color: '#10B981' } },
          { name: 'Infrastructure', value: 3.6, itemStyle: { color: '#EA580C' } }
        ]
      }
    ]
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
              <button className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Active Projects", value: "12", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Total Budget", value: "$24.7M", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Done Tasks", value: "247", icon: CheckCircle2, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Pending", value: "15", icon: ListTodo, color: "text-purple-600", bg: "bg-purple-50" },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    +8%
                  </span>
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
                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    className="flex-1 sm:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                  </select>
                  <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={cardsRef}>
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="card-animate group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={project.image}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md",
                          project.status === 'active' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
                        )}>
                          {project.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{project.name}</h3>
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.description}</p>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-slate-500 uppercase tracking-wider">Completion</span>
                            <span className="text-slate-900">{project.progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                              {project.manager.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-xs font-medium text-slate-600">{project.manager}</span>
                          </div>
                          <button className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-1">
                            DETAILS <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {/* Budget Allocation Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  Budget Allocation
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
    </MasterLayout>
  );
}
