import { useState, useMemo, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { buildWbsHierarchy } from "@/lib/utils";
import type { WbsItem } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight, Package, Wrench, Users } from "lucide-react";

interface WorkPackage {
  id: number;
  wbsItemId: number;
  projectId: number;
  name: string;
  code: string;
  description: string | null;
  budgetedCost: string;
}

type TabKey = "home" | "activities" | "cost" | "schedule" | "progress";

const TAB_KEYS: TabKey[] = ["home", "activities", "cost", "schedule", "progress"];

function getTabFromHash(): TabKey {
  if (typeof window === "undefined") return "home";
  const h = (window.location.hash || "#home").slice(1).toLowerCase();
  return TAB_KEYS.includes(h as TabKey) ? (h as TabKey) : "home";
}

export default function ProjectWbsWorkPackages() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState<TabKey>(getTabFromHash);
  const [selectedWpId, setSelectedWpId] = useState<number | null>(null);
  const [expandedWbs, setExpandedWbs] = useState<Set<number>>(new Set());

  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => {
    const want = `#${activeTab}`;
    if (typeof window !== "undefined" && (window.location.hash || "#home") !== want) {
      window.history.replaceState(null, "", `${window.location.pathname}${want}`);
    }
  }, [activeTab]);

  const pid = projectId ? parseInt(projectId, 10) : 0;

  const { data: wbsItems = [], isLoading: loadingWbs } = useQuery<WbsItem[]>({
    queryKey: [`/api/projects/${pid}/wbs`],
    enabled: !!pid,
  });

  const { data: workPackages = [], isLoading: loadingWps } = useQuery<
    WorkPackage[]
  >({
    queryKey: ["work-packages", pid],
    queryFn: async () => {
      if (!pid) return [];
      const res = await fetch(`/api/projects/${pid}/work-packages`);
      if (!res.ok) throw new Error("Failed to load work packages");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!pid,
  });

  const wpsByWbs = useMemo(() => {
    const map = new Map<number, WorkPackage[]>();
    for (const wp of workPackages) {
      const list = map.get(wp.wbsItemId) ?? [];
      list.push(wp);
      map.set(wp.wbsItemId, list);
    }
    return map;
  }, [workPackages]);

  const { data: wpMaterials = [] } = useQuery<any[]>({
    queryKey: ["wp-materials", selectedWpId],
    queryFn: async () => {
      if (!selectedWpId) return [];
      const res = await fetch(`/api/work-packages/${selectedWpId}/materials`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedWpId,
  });

  const { data: wpServices = [] } = useQuery<any[]>({
    queryKey: ["wp-services", selectedWpId],
    queryFn: async () => {
      if (!selectedWpId) return [];
      const res = await fetch(`/api/work-packages/${selectedWpId}/services`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedWpId,
  });

  const { data: wpResources = [] } = useQuery<any[]>({
    queryKey: ["wp-resources", selectedWpId],
    queryFn: async () => {
      if (!selectedWpId) return [];
      const res = await fetch(`/api/work-packages/${selectedWpId}/resources`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedWpId,
  });

  const hierarchy = useMemo(
    () => buildWbsHierarchy(wbsItems),
    [wbsItems]
    );

  useEffect(() => {
    if (hierarchy.length > 0) {
      setExpandedWbs((prev) =>
        prev.size === 0 ? new Set(hierarchy.map((r) => r.id)) : prev
      );
    }
  }, [hierarchy]);

  const toggleWbs = (id: number) => {
    setExpandedWbs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedWP = workPackages.find((wp) => wp.id === selectedWpId);
  const isLoading = loadingWbs || loadingWps;

  function renderWbsNode(items: (WbsItem & { children?: WbsItem[] })[], level: number) {
    return items.map((item) => {
      const wps = wpsByWbs.get(item.id) ?? [];
      const hasChildren = (item.children?.length ?? 0) > 0 || wps.length > 0;
      const isExp = expandedWbs.has(item.id);

      return (
        <div key={item.id} className="select-none">
          <div
            className="flex items-center gap-1 py-1.5 px-2 rounded hover:bg-zinc-100 cursor-pointer"
            style={{ paddingLeft: 8 + level * 16 }}
            onClick={() => hasChildren && toggleWbs(item.id)}
          >
            {hasChildren ? (
              <span className="w-4 h-4 flex items-center justify-center">
                {isExp ? (
                  <ChevronRight className="h-4 w-4 rotate-90" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            ) : (
              <span className="w-4" />
            )}
            <span className="text-sm font-medium text-zinc-700">
              {item.code} – {item.name}
            </span>
            {item.type === "Summary" || item.type === "WBS" ? (
              <span className="text-xs text-zinc-400 ml-1">(WBS)</span>
            ) : null}
          </div>
          {isExp &&
            wps.map((wp) => (
              <div
                key={wp.id}
                className={`flex items-center py-1.5 px-2 rounded cursor-pointer ${
                  selectedWpId === wp.id ? "bg-teal-100 text-teal-800" : "hover:bg-zinc-100"
                }`}
                style={{ paddingLeft: 8 + (level + 1) * 16 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWpId(wp.id);
                }}
              >
                <span className="w-4" />
                <span className="text-sm">
                  {wp.code} – {wp.name}
                </span>
                <span className="text-xs text-zinc-400 ml-1">(WP)</span>
              </div>
            ))}
          {isExp &&
            (item as any).children?.length > 0 &&
            renderWbsNode((item as any).children, level + 1)}
        </div>
      );
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] p-4 gap-4">
      <Tabs value={activeTab}>
        <TabsContent value="home" className="flex-1 mt-4 min-h-0 flex gap-4">
          <Card className="w-96 flex-shrink-0 flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">WBS & Work Packages</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-full px-2 pb-4">
                  {hierarchy.length === 0 ? (
                    <p className="text-sm text-zinc-500 p-4">
                      No WBS items. Import WBS or add from project.
                    </p>
                  ) : (
                    renderWbsNode(hierarchy, 0)
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="text-lg font-extrabold tracking-tight text-amber-800">
                {selectedWP
                  ? `${selectedWP.code} – ${selectedWP.name}`
                  : "Select a work package"}
              </CardTitle>
              {selectedWP && (
                <p className="text-sm text-zinc-600">
                  Materials, services and resources mapped to this work package
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {!selectedWpId ? (
                <div className="flex h-full items-center justify-center text-zinc-500 border-2 border-dashed rounded-lg p-8">
                  <p>Click a work package in the list to view its materials, services and resources.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Materials */}
                  <div className="group rounded-xl border border-zinc-200 bg-white/80 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 p-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-zinc-700">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Package className="h-4 w-4" />
                      </span>
                      <span className="tracking-wide uppercase text-xs font-semibold text-amber-700">
                        Materials
                      </span>
                    </h4>
                    {wpMaterials.length === 0 ? (
                      <p className="text-sm text-zinc-500">No materials assigned.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                              Code
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                              Description
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                              UOM
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase text-right">
                              Qty
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase text-right">
                              Est. Value
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {wpMaterials.map((r: any) => (
                            <TableRow key={r.id} className="hover:bg-amber-50/40">
                              <TableCell className="font-semibold text-zinc-800">
                                {r.materialCode}
                              </TableCell>
                              <TableCell className="text-zinc-700">
                                {r.materialDescription}
                              </TableCell>
                              <TableCell className="text-zinc-600">
                                {r.uom}
                              </TableCell>
                              <TableCell className="text-right font-mono text-zinc-800">
                                {r.quantity}
                              </TableCell>
                              <TableCell className="text-right font-mono text-emerald-700">
                                {formatCurrency(Number(r.estimatedValue || 0))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Services */}
                  <div className="group rounded-xl border border-zinc-200 bg-white/80 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 p-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-zinc-700">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                        <Wrench className="h-4 w-4" />
                      </span>
                      <span className="tracking-wide uppercase text-xs font-semibold text-sky-700">
                        Services
                      </span>
                    </h4>
                    {wpServices.length === 0 ? (
                      <p className="text-sm text-zinc-500">No services assigned.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                              Code
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                              Description
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                              UOM
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase text-right">
                              Qty
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase text-right">
                              Est. Value
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {wpServices.map((r: any) => (
                            <TableRow key={r.id} className="hover:bg-sky-50/40">
                              <TableCell className="font-semibold text-zinc-800">
                                {r.serviceCode}
                              </TableCell>
                              <TableCell className="text-zinc-700">
                                {r.serviceDescription}
                              </TableCell>
                              <TableCell className="text-zinc-600">
                                {r.uom}
                              </TableCell>
                              <TableCell className="text-right font-mono text-zinc-800">
                                {r.quantity}
                              </TableCell>
                              <TableCell className="text-right font-mono text-emerald-700">
                                {formatCurrency(Number(r.estimatedValue || 0))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Resources */}
                  <div className="group rounded-xl border border-zinc-200 bg-white/80 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 p-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-zinc-700">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Users className="h-4 w-4" />
                      </span>
                      <span className="tracking-wide uppercase text-xs font-semibold text-emerald-700">
                        Resources (Manpower &amp; Equipment)
                      </span>
                    </h4>
                    {wpResources.length === 0 ? (
                      <p className="text-sm text-zinc-500">No resources assigned.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                              Name
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                              Type
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                              UOM
                            </TableHead>
                            <TableHead className="text-xs font-semibold tracking-wide text-zinc-500 uppercase text-right">
                              Qty
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {wpResources.map((r: any) => (
                            <TableRow key={r.id} className="hover:bg-emerald-50/40">
                              <TableCell className="font-semibold text-zinc-800">
                                {r.name}
                              </TableCell>
                              <TableCell className="text-zinc-700">
                                {r.type}
                              </TableCell>
                              <TableCell className="text-zinc-600">
                                {r.unitOfMeasure}
                              </TableCell>
                              <TableCell className="text-right font-mono text-zinc-800">
                                {r.quantity}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activities per Work Package</CardTitle>
              <p className="text-sm text-zinc-500">
                Display activities for each WP and show progress. (To be developed.)
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-zinc-500 border-2 border-dashed rounded-lg">
                Coming soon: activities and progress by work package.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Performance</CardTitle>
              <p className="text-sm text-zinc-500">
                WP budget spent (%) vs activity completion (%) for each work package.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-zinc-500 border-2 border-dashed rounded-lg">
                Cost performance: % budget spent vs % activity completion — to be developed.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Performance</CardTitle>
              <p className="text-sm text-zinc-500">
                % planned to date vs % actually achieved.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-zinc-500 border-2 border-dashed rounded-lg">
                Schedule performance: planned % vs actual % — to be developed.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Progress</CardTitle>
              <p className="text-sm text-zinc-500">
                Progress to date for each activity under work packages.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-zinc-500 border-2 border-dashed rounded-lg">
                Activity progress to date — to be developed.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
