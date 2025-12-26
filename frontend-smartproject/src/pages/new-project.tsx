import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
    FileText,
    Loader2,
    Edit2,
    Trash2,
    Info,
    MoreVertical,
    Layers,
    DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Project, WbsItem, Dependency } from "@shared/schema";
import { AddWbsModal } from "@/components/project/add-wbs-modal";
import { EditWbsModal } from "@/components/project/edit-wbs-modal";
import { WbsDetailsSheet } from "@/components/project/wbs-details-sheet";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Types for the hierarchical WBS tree used in the UI
interface WbsTreeNode extends Omit<WbsItem, 'startDate' | 'endDate'> {
    startDate: string | null;
    endDate: string | null;
    expanded: boolean;
    children: WbsTreeNode[];
    progress?: number;
    budget?: { allocated: number; spent: number };
}

export default function NewProject() {
    const { projectId } = useParams<{ projectId: string }>();
    const [, setLocation] = useLocation();
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [timelineView, setTimelineView] = useState<'week' | 'month' | 'quarter'>('month');
    const infoRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedWbsItem, setSelectedWbsItem] = useState<{ id: number; name: string; level: number } | null>(null);
    const [editWbsId, setEditWbsId] = useState<number | null>(null);
    const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
    const [detailsWbsId, setDetailsWbsId] = useState<number | null>(null);

    // Fetch Project Details
    const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
        queryKey: [`/api/projects/${projectId}`],
        enabled: !!projectId,
    });

    // Fetch WBS Items
    const { data: flatWbsItems = [], isLoading: isWbsLoading } = useQuery<WbsItem[]>({
        queryKey: [`/api/projects/${projectId}/wbs`],
        enabled: !!projectId,
    });

    // Fetch Dependencies
    const { data: apiDependencies = [], isLoading: isDepsLoading } = useQuery<Dependency[]>({
        queryKey: [`/api/projects/${projectId}/dependencies`],
        enabled: !!projectId,
    });

    // Transform flat WBS into tree structure
    const wbsTree = useMemo(() => {
        const itemMap = new Map<number, WbsTreeNode>();
        const roots: WbsTreeNode[] = [];

        // First pass: Create nodes and map by ID
        flatWbsItems.forEach(item => {
            itemMap.set(item.id, {
                ...item,
                expanded: expandedIds.has(item.id) || item.isTopLevel || false,
                children: [],
                progress: Number(item.percentComplete || 0),
                budget: {
                    allocated: Number(item.budgetedCost || 0),
                    spent: Number(item.actualCost || 0)
                }
            });
        });

        // Second pass: Build hierarchy
        flatWbsItems.forEach(item => {
            const node = itemMap.get(item.id)!;
            if (item.parentId && itemMap.has(item.parentId)) {
                itemMap.get(item.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    }, [flatWbsItems, expandedIds]);

    // Extract activities for charts
    const activities = useMemo(() => {
        return flatWbsItems.filter(item => item.type === 'Activity');
    }, [flatWbsItems]);

    // Animations
    useEffect(() => {
        if (!isProjectLoading && infoRef.current) {
            anime({
                targets: infoRef.current?.querySelectorAll(".animate-item"),
                opacity: [0, 1],
                translateX: [-20, 0],
                delay: anime.stagger(100),
                duration: 800,
                easing: "easeOutExpo"
            });
        }
    }, [isProjectLoading]);

    const toggleWbs = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getStatusColor = (status: string | null) => {
        const colors: Record<string, string> = {
            'not-started': '#9CA3AF',
            'in-progress': '#F59E0B',
            'completed': '#10B981',
            'blocked': '#EF4444',
            'planning': '#F59E0B',
            'active': '#059669',
            'on-hold': '#F97316',
            'aborted': '#EF4444'
        };
        return colors[status?.toLowerCase() || ''] || '#6B7280';
    };

    // Delete WBS Item mutation
    const deleteWbsMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/wbs/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/wbs`] });
            toast({
                title: "Deleted",
                description: "WBS item and its children removed",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to delete item",
                variant: "destructive",
            });
        }
    });

    const handleDeleteWbs = (id: number) => {
        if (confirm("Are you sure you want to delete this WBS item and all its sub-items?")) {
            deleteWbsMutation.mutate(id);
        }
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
                                <div class="text-xs text-slate-500">Progress: ${activity.percentComplete}%</div>
                                <div class="text-xs text-slate-500">Duration: ${activity.duration} days</div>
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
                    color: getStatusColor('active'), // Default to active color for nodes
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
            links: apiDependencies.map(dep => {
                const source = flatWbsItems.find(a => a.id === dep.predecessorId);
                const target = flatWbsItems.find(a => a.id === dep.successorId);
                return {
                    source: source?.name || `ID-${dep.predecessorId}`,
                    target: target?.name || `ID-${dep.successorId}`
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
            const start = act.startDate ? new Date(act.startDate).getTime() : Date.now();
            const end = act.endDate ? new Date(act.endDate).getTime() : start + (act.duration || 1) * 24 * 60 * 60 * 1000;
            return {
                name: act.name,
                value: [idx, start, end, end - start],
                itemStyle: {
                    color: getStatusColor(Number(act.percentComplete) === 100 ? 'completed' : 'in-progress'),
                    borderRadius: 4
                }
            };
        });

        const now = project?.startDate ? new Date(project.startDate).getTime() : Date.now();
        let minDate, maxDate;

        if (timelineView === 'week') {
            minDate = now;
            maxDate = now + 14 * 24 * 60 * 60 * 1000;
        } else if (timelineView === 'month') {
            minDate = now;
            maxDate = now + 45 * 24 * 60 * 60 * 1000;
        } else {
            minDate = now;
            maxDate = now + 120 * 24 * 60 * 60 * 1000;
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
                    const coordStart = api.coord([api.value(1), categoryIndex]);
                    const coordEnd = api.coord([api.value(2), categoryIndex]);
                    const height = api.size([0, 1])[1] * 0.4;
                    const width = Math.max(coordEnd[0] - coordStart[0], 5);

                    return {
                        type: 'rect',
                        shape: {
                            x: coordStart[0],
                            y: coordStart[1] - height / 2,
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

    const renderWbsTree = (items: WbsTreeNode[], level = 0) => {
        return items.map(item => (
            <div key={item.id}>
                <div
                    className={cn(
                        "flex items-center justify-between py-3 px-4 hover:bg-slate-50 border-b border-slate-100 group transition-all"
                    )}
                    style={{ paddingLeft: `${level * 32 + 16}px` }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 cursor-pointer flex items-center justify-center w-4 h-4" onClick={() => toggleWbs(item.id)}>
                            {item.children?.length > 0 ? (item.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                        </span>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            item.type === 'Summary' ? 'bg-blue-500' : item.type === 'WorkPackage' ? 'bg-amber-500' : 'bg-emerald-500'
                        )} />
                        <div
                            className="flex-1 cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() => {
                                setDetailsWbsId(item.id);
                                setIsDetailsSheetOpen(true);
                            }}
                        >
                            <div className="text-sm font-bold text-slate-800">{item.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{item.type}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* 2 Dots Vertical Icon (::) */}
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="6" cy="4" r="1.2" fill="currentColor" />
                                        <circle cx="6" cy="8" r="1.2" fill="currentColor" />
                                    </svg>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white border-slate-200 shadow-xl min-w-40">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 px-3 py-2">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDetailsWbsId(item.id);
                                        setIsDetailsSheetOpen(true);
                                    }}
                                    className="text-xs font-semibold text-slate-700 focus:bg-slate-50 cursor-pointer px-3 py-2"
                                >
                                    <Info size={14} className="mr-2" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedWbsItem({ id: item.id, name: item.name, level: item.level });
                                        setIsAddModalOpen(true);
                                    }}
                                    disabled={item.level >= 3}
                                    className="text-xs font-semibold text-slate-700 focus:bg-slate-50 cursor-pointer px-3 py-2"
                                >
                                    <Plus size={14} className="mr-2" />
                                    Add Child WBS
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditWbsId(item.id);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="text-xs font-semibold text-slate-700 focus:bg-slate-50 cursor-pointer px-3 py-2"
                                >
                                    <Edit2 size={14} className="mr-2" />
                                    Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteWbs(item.id);
                                    }}
                                    className="text-xs font-semibold text-red-600 focus:bg-red-50 cursor-pointer px-3 py-2"
                                >
                                    <Trash2 size={14} className="mr-2" />
                                    Delete Item
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {item.expanded && item.children && renderWbsTree(item.children, level + 1)}
            </div>
        ));
    };

    if (isProjectLoading || isWbsLoading || isDepsLoading) {
        return (
            <MasterLayout projectId={projectId ? parseInt(projectId) : undefined}>
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">Loading Project Data...</h2>
                    </div>
                </div>
            </MasterLayout>
        );
    }

    if (!project) {
        return (
            <MasterLayout projectId={projectId ? parseInt(projectId) : undefined}>
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
                        <button
                            onClick={() => setLocation('/newlanding')}
                            className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold"
                        >
                            Return to Portfolio
                        </button>
                    </div>
                </div>
            </MasterLayout>
        );
    }

    return (
        <MasterLayout projectId={project.id}>
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
                                <button
                                    onClick={() => setLocation('/newlanding')}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className="text-3xl font-bold font-display">{project.name}</h1>
                                <span className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-full border",
                                    project.status === 'active' || project.status === 'in progress'
                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                )}>
                                    {project.status?.toUpperCase() || 'PLANNING'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                                <div className="flex items-center gap-2"><Briefcase size={16} /> {project.projectType || 'General'}</div>
                                <div className="flex items-center gap-2"><Calendar size={16} /> {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="animate-item flex gap-12">
                            <div className="text-center">
                                <div className="text-2xl font-bold">
                                    {Math.round(flatWbsItems.reduce((acc, item) => acc + Number(item.percentComplete || 0), 0) / (flatWbsItems.length || 1))}%
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Progress</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-500">
                                    {project.currency} {(Number(project.budget) / 1000000).toFixed(1)}M
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{activities.length} / {flatWbsItems.length}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activities</div>
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
                                    <button
                                        onClick={() => {
                                            setSelectedWbsItem(null);
                                            setIsAddModalOpen(true);
                                        }}
                                        className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                                    >
                                        <Plus size={16} className="text-slate-600" />
                                    </button>
                                    <button className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
                                        <Settings size={16} className="text-slate-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2">
                                {renderWbsTree(wbsTree)}
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
                                {activities.length > 0 ? (
                                    <ReactECharts
                                        option={getGanttOption()}
                                        style={{ height: '100%' }}
                                        notMerge={true}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                                        No activities to display on timeline
                                    </div>
                                )}
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
                                    { label: "Total Allocated", value: `${project.currency} ${Number(project.budget).toLocaleString()}`, color: "text-slate-600" },
                                    { label: "Used Budget", value: `${project.currency} ${flatWbsItems.reduce((acc, i) => acc + Number(i.actualCost || 0), 0).toLocaleString()}`, color: "text-slate-600" },
                                    { label: "Remaining", value: `${project.currency} ${(Number(project.budget) - flatWbsItems.reduce((acc, i) => acc + Number(i.actualCost || 0), 0)).toLocaleString()}`, color: "text-emerald-600 font-bold" },
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">{row.label}</span>
                                        <span className={row.color}>{row.value}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Usage</span>
                                        <span className="text-xs font-bold text-slate-900">
                                            {Math.round((flatWbsItems.reduce((acc, i) => acc + Number(i.actualCost || 0), 0) / (Number(project.budget) || 1)) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                                            style={{ width: `${Math.round((flatWbsItems.reduce((acc, i) => acc + Number(i.actualCost || 0), 0) / (Number(project.budget) || 1)) * 100)}%` }}
                                        />
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
                                    { label: "Total WBS", value: flatWbsItems.length.toString(), icon: ListTodo },
                                    { label: "Dependencies", value: apiDependencies.length.toString(), icon: Activity },
                                    { label: "Risks", value: "0", icon: AlertTriangle },
                                    { label: "Learnt", value: "0 Items", icon: Lightbulb },
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

            <AddWbsModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                projectId={project.id}
                parentId={selectedWbsItem?.id}
                parentName={selectedWbsItem?.name}
                parentLevel={selectedWbsItem?.level}
            />

            {editWbsId && (
                <EditWbsModal
                    isOpen={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    wbsId={editWbsId}
                />
            )}

            <WbsDetailsSheet
                isOpen={isDetailsSheetOpen}
                onOpenChange={setIsDetailsSheetOpen}
                wbsId={detailsWbsId}
            />
        </MasterLayout>
    );
}
