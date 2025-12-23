import { useState, useEffect, useRef } from "react";
import MasterLayout from "@/layouts/master-layout";
import ReactECharts from "echarts-for-react";
import anime from "animejs";
import {
    Building2,
    MapPin,
    User,
    Calendar,
    MoreHorizontal,
    ChevronRight,
    ChevronDown,
    Plus,
    ArrowLeft,
    Settings,
    Download,
    Activity,
    ListTodo,
    AlertTriangle,
    Lightbulb,
    Briefcase,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample data from project.js
const sampleWBSData = [
    {
        id: 'wbs-1',
        name: 'Site Preparation',
        type: 'wbs',
        expanded: true,
        children: [
            {
                id: 'wp-1-1',
                name: 'Land Clearing',
                type: 'workpackage',
                budget: { allocated: 150000, spent: 120000 },
                progress: 80,
                children: [
                    {
                        id: 'act-1-1-1',
                        name: 'Tree Removal',
                        type: 'activity',
                        duration: 5,
                        startDate: '2024-04-15',
                        endDate: '2024-04-20',
                        status: 'completed',
                        progress: 100
                    },
                    {
                        id: 'act-1-1-2',
                        name: 'Grading',
                        type: 'activity',
                        duration: 8,
                        startDate: '2024-04-21',
                        endDate: '2024-04-29',
                        status: 'in-progress',
                        progress: 60
                    }
                ]
            },
            {
                id: 'wp-1-2',
                name: 'Utility Relocation',
                type: 'workpackage',
                budget: { allocated: 200000, spent: 180000 },
                progress: 90,
                children: [
                    {
                        id: 'act-1-2-1',
                        name: 'Water Lines',
                        type: 'activity',
                        duration: 6,
                        startDate: '2024-04-25',
                        endDate: '2024-05-01',
                        status: 'completed',
                        progress: 100
                    },
                    {
                        id: 'act-1-2-2',
                        name: 'Electrical',
                        type: 'activity',
                        duration: 4,
                        startDate: '2024-04-28',
                        endDate: '2024-05-02',
                        status: 'in-progress',
                        progress: 75
                    }
                ]
            }
        ]
    },
    {
        id: 'wbs-2',
        name: 'Foundation',
        type: 'wbs',
        expanded: true,
        children: [
            {
                id: 'wp-2-1',
                name: 'Excavation',
                type: 'workpackage',
                budget: { allocated: 300000, spent: 150000 },
                progress: 50,
                children: [
                    {
                        id: 'act-2-1-1',
                        name: 'Site Excavation',
                        type: 'activity',
                        duration: 10,
                        startDate: '2024-05-03',
                        endDate: '2024-05-13',
                        status: 'in-progress',
                        progress: 50
                    }
                ]
            },
            {
                id: 'wp-2-2',
                name: 'Base Layer',
                type: 'workpackage',
                budget: { allocated: 400000, spent: 0 },
                progress: 0,
                children: [
                    {
                        id: 'act-2-2-1',
                        name: 'Aggregate Base',
                        type: 'activity',
                        duration: 12,
                        startDate: '2024-05-14',
                        endDate: '2024-05-26',
                        status: 'not-started',
                        progress: 0
                    }
                ]
            }
        ]
    },
    {
        id: 'wbs-3',
        name: 'Pavement',
        type: 'wbs',
        expanded: false,
        children: [
            {
                id: 'wp-3-1',
                name: 'Asphalt Base',
                type: 'workpackage',
                budget: { allocated: 800000, spent: 0 },
                progress: 0,
                children: [
                    {
                        id: 'act-3-1-1',
                        name: 'Asphalt Installation',
                        type: 'activity',
                        duration: 15,
                        startDate: '2024-05-27',
                        endDate: '2024-06-11',
                        status: 'not-started',
                        progress: 0
                    }
                ]
            }
        ]
    },
    {
        id: 'wbs-4',
        name: 'Signage',
        type: 'wbs',
        expanded: false,
        children: [
            {
                id: 'wp-4-1',
                name: 'Regulatory Signs',
                type: 'workpackage',
                budget: { allocated: 50000, spent: 0 },
                progress: 0,
                children: [
                    {
                        id: 'act-4-1-1',
                        name: 'Sign Installation',
                        type: 'activity',
                        duration: 5,
                        startDate: '2024-06-10',
                        endDate: '2024-06-15',
                        status: 'not-started',
                        progress: 0
                    }
                ]
            }
        ]
    }
];

const activityDependencies = [
    { from: 'act-1-1-1', to: 'act-1-1-2' },
    { from: 'act-1-1-2', to: 'act-2-1-1' },
    { from: 'act-1-2-1', to: 'act-2-1-1' },
    { from: 'act-1-2-2', to: 'act-2-1-1' },
    { from: 'act-2-1-1', to: 'act-2-2-1' },
    { from: 'act-2-2-1', to: 'act-3-1-1' },
    { from: 'act-3-1-1', to: 'act-4-1-1' }
];

export default function NewProject() {
    const [wbs, setWbs] = useState(sampleWBSData);
    const [timelineView, setTimelineView] = useState<'week' | 'month' | 'quarter'>('month');
    const infoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        anime({
            targets: infoRef.current?.querySelectorAll(".animate-item"),
            opacity: [0, 1],
            translateX: [-20, 0],
            delay: anime.stagger(100),
            duration: 800,
            easing: "easeOutExpo"
        });
    }, []);

    const toggleWbs = (id: string) => {
        const updateItems = (items: any[]): any[] => {
            return items.map(item => {
                if (item.id === id) return { ...item, expanded: !item.expanded };
                if (item.children) return { ...item, children: updateItems(item.children) };
                return item;
            });
        };
        setWbs(updateItems(wbs));
    };

    const extractActivities = (wbsData: any[]) => {
        const activities: any[] = [];
        const traverse = (items: any[]) => {
            items.forEach(item => {
                if (item.type === 'activity') activities.push(item);
                if (item.children) traverse(item.children);
            });
        };
        traverse(wbsData);
        return activities;
    };

    const activities = extractActivities(wbs);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'not-started': '#9CA3AF',
            'in-progress': '#F59E0B',
            'completed': '#10B981',
            'blocked': '#EF4444'
        };
        return colors[status] || '#6B7280';
    };

    const networkOption = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                if (params.dataType === 'node') {
                    const activity = activities.find(a => a.name === params.data.name);
                    if (activity) {
                        return `
                            <div class="px-2 py-1">
                                <div class="font-bold border-b border-slate-200 mb-1">${activity.name}</div>
                                <div class="text-xs text-slate-500">Status: ${activity.status}</div>
                                <div class="text-xs text-slate-500">Duration: ${activity.duration} days</div>
                                <div class="text-xs text-slate-500">Progress: ${activity.progress}%</div>
                            </div>
                        `;
                    }
                }
                return params.name;
            }
        },
        series: [{
            type: 'graph',
            layout: 'force',
            data: activities.map(act => ({
                name: act.name,
                category: 0,
                draggable: true,
                symbolSize: 45,
                itemStyle: {
                    color: getStatusColor(act.status),
                    borderColor: '#fff',
                    borderWidth: 2,
                    shadowColor: 'rgba(0, 0, 0, 0.1)',
                    shadowBlur: 10
                },
                label: {
                    show: true,
                    position: 'bottom',
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#475569'
                }
            })),
            links: activityDependencies.map(dep => {
                const source = activities.find(a => a.id === dep.from);
                const target = activities.find(a => a.id === dep.to);
                return {
                    source: source?.name || dep.from,
                    target: target?.name || dep.to
                };
            }),
            force: {
                repulsion: 800,
                edgeLength: 120,
                gravity: 0.1
            },
            roam: true,
            lineStyle: {
                width: 2,
                curveness: 0.1,
                color: '#94a3b8',
                opacity: 0.6
            },
            emphasis: {
                focus: 'adjacency',
                lineStyle: {
                    width: 4,
                    color: '#3b82f6'
                }
            }
        }]
    };

    const getGanttOption = () => {
        const sortedActivities = [...activities].reverse();
        const categories = sortedActivities.map(act => act.name);

        const data = sortedActivities.map((act, idx) => {
            const start = new Date(act.startDate).getTime();
            const end = new Date(act.endDate).getTime();
            return {
                name: act.name,
                value: [idx, start, end, end - start],
                itemStyle: {
                    color: getStatusColor(act.status),
                    borderRadius: 4
                }
            };
        });

        const now = new Date('2024-04-15').getTime();
        let minDate, maxDate;

        if (timelineView === 'week') {
            minDate = now;
            maxDate = now + 14 * 24 * 60 * 60 * 1000; // 2 weeks
        } else if (timelineView === 'month') {
            minDate = now;
            maxDate = now + 45 * 24 * 60 * 60 * 1000; // 45 days
        } else {
            minDate = now;
            maxDate = now + 120 * 24 * 60 * 60 * 1000; // 4 months
        }

        return {
            tooltip: {
                formatter: (params: any) => {
                    const start = new Date(params.value[1]).toLocaleDateString();
                    const end = new Date(params.value[2]).toLocaleDateString();
                    return `<b>${params.name}</b><br/>${start} - ${end}`;
                }
            },
            grid: {
                left: '150',
                right: '40',
                top: '20',
                bottom: '40',
                containLabel: false
            },
            xAxis: {
                type: 'time',
                position: 'bottom',
                min: minDate,
                max: maxDate,
                axisLine: { show: true, lineStyle: { color: '#e2e8f0' } },
                splitLine: { show: true, lineStyle: { color: '#f1f5f9', type: 'dashed' } },
                axisLabel: { color: '#64748b', fontSize: 10 }
            },
            yAxis: {
                type: 'category',
                data: categories,
                axisTick: { show: false },
                axisLine: { show: true, lineStyle: { color: '#e2e8f0' } },
                axisLabel: { color: '#475569', fontSize: 11, fontWeight: 'medium' }
            },
            series: [{
                type: 'custom',
                renderItem: (params: any, api: any) => {
                    const categoryIndex = api.value(0);
                    const start = api.coord([api.value(1), categoryIndex]);
                    const end = api.coord([api.value(2), categoryIndex]);
                    const height = api.size([0, 1])[1] * 0.4;

                    const width = Math.max(end[0] - start[0], 5);

                    return {
                        type: 'rect',
                        shape: {
                            x: start[0],
                            y: start[1] - height / 2,
                            width: width,
                            height: height,
                            r: 4
                        },
                        style: api.style()
                    };
                },
                encode: { x: [1, 2], y: 0 },
                data: data
            }]
        };
    };

    const ganttOption = getGanttOption();

    const renderWbsTree = (items: any[], level = 0) => {
        return items.map(item => (
            <div key={item.id}>
                <div
                    className={cn(
                        "flex items-center justify-between py-3 px-4 hover:bg-slate-50 border-b border-slate-100 cursor-pointer group",
                        level > 0 && "ml-6 border-l-2 border-slate-200"
                    )}
                    onClick={() => toggleWbs(item.id)}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400">
                            {item.children?.length > 0 ? (item.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                        </span>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            item.type === 'wbs' ? 'bg-blue-500' : item.type === 'workpackage' ? 'bg-amber-500' : 'bg-emerald-500'
                        )} />
                        <div>
                            <div className="text-sm font-bold text-slate-800">{item.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.type}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        {item.progress !== undefined && (
                            <div className="w-24">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                    <span>{item.progress}%</span>
                                </div>
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${item.progress}%` }} />
                                </div>
                            </div>
                        )}
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all">
                            <MoreHorizontal size={14} className="text-slate-500" />
                        </button>
                    </div>
                </div>
                {item.expanded && item.children && renderWbsTree(item.children, level + 1)}
            </div>
        ));
    };

    return (
        <MasterLayout>
            <div className="min-h-screen bg-white">
                {/* Header Section */}
                <section
                    className="bg-slate-900 text-white py-12 px-8 overflow-hidden relative"
                    style={{
                        backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('/resources/project-1.jpg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10" ref={infoRef}>
                        <div className="animate-item">
                            <div className="flex items-center gap-4 mb-4">
                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className="text-3xl font-bold font-display">Highway Extension Project</h1>
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                                    ACTIVE
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                                <div className="flex items-center gap-2"><MapPin size={16} /> Downtown District</div>
                                <div className="flex items-center gap-2"><User size={16} /> Sarah Johnson</div>
                                <div className="flex items-center gap-2"><Calendar size={16} /> Apr 15, 2024 - Apr 15, 2025</div>
                            </div>
                        </div>
                        <div className="animate-item flex gap-12">
                            <div className="text-center">
                                <div className="text-2xl font-bold">65%</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-500">$2.5M</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">34 / 47</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tasks</div>
                            </div>
                        </div>
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                </section>

                <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* WBS Section */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <ListTodo className="w-5 h-5 text-amber-500" />
                                    Work Breakdown Structure
                                </h3>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
                                        <Plus size={16} className="text-slate-600" />
                                    </button>
                                    <button className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
                                        <Settings size={16} className="text-slate-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2">
                                {renderWbsTree(wbs)}
                            </div>
                        </div>

                        {/* Network Diagram */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                    Activity Network Diagram
                                </h3>
                            </div>
                            <div className="p-6 h-[400px]">
                                <ReactECharts option={networkOption} style={{ height: '100%' }} />
                            </div>
                        </div>

                        {/* Activity Timeline (Gantt) */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-emerald-500" />
                                    Activity Timeline
                                </h3>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    {['Week', 'Month', 'Quarter'].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setTimelineView(v.toLowerCase() as any)}
                                            className={cn(
                                                "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                timelineView === v.toLowerCase()
                                                    ? "bg-white text-blue-600 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-6 h-[400px]">
                                <ReactECharts
                                    option={ganttOption}
                                    style={{ height: '100%' }}
                                    notMerge={true}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Budget Breakdown */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-emerald-500" />
                                Budget Overview
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: "Allocated", value: "$2,500,000", color: "text-slate-600" },
                                    { label: "Spent to date", value: "$1,800,000", color: "text-slate-600" },
                                    { label: "Remaining", value: "$700,000", color: "text-emerald-600 font-bold" },
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">{row.label}</span>
                                        <span className={row.color}>{row.value}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Usage</span>
                                        <span className="text-xs font-bold text-slate-900">72%</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: '72%' }} />
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-white/50 transition-colors uppercase tracking-widest shadow-sm">
                                Edit Allocation
                            </button>
                        </div>

                        {/* Project Stats */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-6">Project Metadata</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Total WBS", value: "4", icon: ListTodo },
                                    { label: "Critical Path", value: "12d", icon: Activity },
                                    { label: "Risks", value: "2 High", icon: AlertTriangle },
                                    { label: "Learnt", value: "8 Items", icon: Lightbulb },
                                ].map((stat, i) => (
                                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <stat.icon className="w-4 h-4 text-slate-400 mb-2" />
                                        <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20 uppercase tracking-widest flex items-center justify-center gap-2">
                                <Plus size={14} /> New Activity
                            </button>
                            <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm">
                                <FileText size={14} /> Generate Report
                            </button>
                            <div className="flex gap-3">
                                <button className="flex-1 py-3 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                                    <Download size={14} /> Export
                                </button>
                                <button className="flex-1 py-3 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                                    <Settings size={14} /> Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
}
