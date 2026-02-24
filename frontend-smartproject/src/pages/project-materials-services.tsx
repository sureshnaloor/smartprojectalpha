import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, GripVertical, Search, X, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";

interface WorkPackage {
  id: number;
  wbsItemId: number;
  projectId: number;
  name: string;
  code: string;
  description: string | null;
  budgetedCost: string;
}

interface Material {
  id: number;
  materialCode: string;
  materialDescription: string;
  uom: string;
  baseRate: string | number;
}

interface Service {
  id: number;
  serviceCode: string;
  serviceDescription: string;
  uom: string;
  baseRate: string | number;
}

type TabKey = "materials" | "services";

export default function ProjectMaterialsServices() {
  const { projectId } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("materials");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWpId, setSelectedWpId] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<Material | Service | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);

  // Sync tab from URL (Materials & Services only; Manpower & Equipment is in header and goes to /resources)
  useEffect(() => {
    const match = location.match(/\/projects\/\d+\/materials-services(?:\/(materials|services))?/);
    const tab = (match && match[1]) as TabKey | undefined;
    if (tab === "materials" || tab === "services") {
      setActiveTab(tab);
    } else if (match && projectId) {
      setLocation(`/projects/${projectId}/materials-services/materials`);
    }
  }, [location, projectId, setLocation]);

  // Work packages – single project-level API (avoids N+1 requests and 429/400)
  const {
    data: workPackages = [],
    isLoading: workPackagesLoading,
    isError: workPackagesError,
    refetch: refetchWorkPackages,
    isFetching: workPackagesFetching,
  } = useQuery<WorkPackage[]>({
    queryKey: ["work-packages", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(`/api/projects/${projectId}/work-packages`);
      if (!res.ok) throw new Error("Failed to load work packages");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!projectId,
    retry: 2,
  });

  // Materials master
  const { data: materialsList = [] } = useQuery<Material[]>({
    queryKey: ["/api/material-masters"],
    queryFn: async () => {
      const res = await fetch("/api/material-masters");
      if (!res.ok) throw new Error("Failed to fetch materials");
      return res.json();
    },
    enabled: !!projectId && activeTab === "materials",
  });

  // Services master
  const { data: servicesList = [] } = useQuery<Service[]>({
    queryKey: ["/api/service-masters"],
    queryFn: async () => {
      const res = await fetch("/api/service-masters");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    enabled: !!projectId && activeTab === "services",
  });

  // WP materials (for selected WP or all)
  const { data: wpMaterials = [] } = useQuery<any[]>({
    queryKey: selectedWpId
      ? ["wp-materials", selectedWpId]
      : ["project-wp-materials", projectId],
    queryFn: async () => {
      if (selectedWpId) {
        const res = await fetch(`/api/work-packages/${selectedWpId}/materials`);
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      }
      const res = await fetch(`/api/projects/${projectId}/work-package-materials`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!projectId && activeTab === "materials",
  });

  // WP services
  const { data: wpServices = [] } = useQuery<any[]>({
    queryKey: selectedWpId
      ? ["wp-services", selectedWpId]
      : ["project-wp-services", projectId],
    queryFn: async () => {
      if (selectedWpId) {
        const res = await fetch(`/api/work-packages/${selectedWpId}/services`);
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      }
      const res = await fetch(`/api/projects/${projectId}/work-package-services`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!projectId && activeTab === "services",
  });

  const selectedWP = workPackages.find((wp) => wp.id === selectedWpId);
  const displayedMaterials = activeTab === "materials"
    ? wpMaterials.filter((r) => !selectedWpId || r.wpId === selectedWpId)
    : [];
  const displayedServices = activeTab === "services"
    ? wpServices.filter((r) => !selectedWpId || r.wpId === selectedWpId)
    : [];

  const addMaterialMutation = useMutation({
    mutationFn: async (data: { wpId: number; materialId: number; quantity: string; estimatedValue: string }) => {
      return apiRequest("POST", `/api/projects/${projectId}/work-package-materials`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wp-materials", selectedWpId] });
      queryClient.invalidateQueries({ queryKey: ["project-wp-materials", projectId] });
      toast({ title: "Material added", description: "Estimated value consumes from work package budget." });
      setIsQuantityDialogOpen(false);
      setDraggedItem(null);
      setQuantity("1");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addServiceMutation = useMutation({
    mutationFn: async (data: { wpId: number; serviceId: number; quantity: string; estimatedValue: string }) => {
      return apiRequest("POST", `/api/projects/${projectId}/work-package-services`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wp-services", selectedWpId] });
      queryClient.invalidateQueries({ queryKey: ["project-wp-services", projectId] });
      toast({ title: "Service added", description: "Estimated value consumes from work package budget." });
      setIsQuantityDialogOpen(false);
      setDraggedItem(null);
      setQuantity("1");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/work-package-materials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wp-materials", selectedWpId] });
      queryClient.invalidateQueries({ queryKey: ["project-wp-materials", projectId] });
      toast({ title: "Material removed" });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/work-package-services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wp-services", selectedWpId] });
      queryClient.invalidateQueries({ queryKey: ["project-wp-services", projectId] });
      toast({ title: "Service removed" });
    },
  });

  const handleDragStart = (e: React.DragEvent, item: Material | Service, tab: "materials" | "services") => {
    e.dataTransfer.setData("application/json", JSON.stringify({ item, tab }));
    setDraggedItem(item);
  };

  const handleDrop = (e: React.DragEvent, wpId: number) => {
    e.preventDefault();
    setSelectedWpId(wpId);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      const { item, tab } = JSON.parse(raw);
      if (tab === "materials") {
        const baseRate = Number((item as Material).baseRate ?? 0);
        setDraggedItem(item as Material);
        setQuantity("1");
        setIsQuantityDialogOpen(true);
        (window as any).__pendingMaterialDrop = { item: item as Material, wpId, baseRate };
      } else if (tab === "services") {
        const baseRate = Number((item as Service).baseRate ?? 0);
        setDraggedItem(item as Service);
        setQuantity("1");
        setIsQuantityDialogOpen(true);
        (window as any).__pendingServiceDrop = { item: item as Service, wpId, baseRate };
      }
    } catch (_) {}
    setDraggedItem(null);
  };

  const handleQuantityConfirm = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid quantity", variant: "destructive" });
      return;
    }
    const pendingM = (window as any).__pendingMaterialDrop;
    const pendingS = (window as any).__pendingServiceDrop;
    if (pendingM) {
      const est = qty * pendingM.baseRate;
      addMaterialMutation.mutate({
        wpId: pendingM.wpId,
        materialId: pendingM.item.id,
        quantity: String(qty),
        estimatedValue: est.toFixed(2),
      });
      (window as any).__pendingMaterialDrop = null;
    } else if (pendingS) {
      const est = qty * pendingS.baseRate;
      addServiceMutation.mutate({
        wpId: pendingS.wpId,
        serviceId: pendingS.item.id,
        quantity: String(qty),
        estimatedValue: est.toFixed(2),
      });
      (window as any).__pendingServiceDrop = null;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const filteredMaterials = materialsList.filter(
    (m) =>
      m.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.materialDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredServices = servicesList.filter(
    (s) =>
      s.serviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.serviceDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
      <div className="flex flex-1 gap-4 min-h-0">
            {/* Left: Materials or Services list */}
            <Card className="w-80 flex flex-col">
              <CardHeader>
                <CardTitle>{activeTab === "materials" ? "Materials" : "Services"}</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    {activeTab === "materials" &&
                      filteredMaterials.map((m) => (
                        <div
                          key={m.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, m, "materials")}
                          className="flex items-center gap-2 rounded-lg border p-3 cursor-move hover:bg-accent"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{m.materialCode}</p>
                            <p className="text-xs text-muted-foreground truncate">{m.materialDescription}</p>
                            <p className="text-xs text-muted-foreground">{m.uom} • Base: {formatCurrency(Number(m.baseRate || 0))}</p>
                          </div>
                        </div>
                      ))}
                    {activeTab === "services" &&
                      filteredServices.map((s) => (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, s, "services")}
                          className="flex items-center gap-2 rounded-lg border p-3 cursor-move hover:bg-accent"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{s.serviceCode}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.serviceDescription}</p>
                            <p className="text-xs text-muted-foreground">{s.uom} • Base: {formatCurrency(Number(s.baseRate || 0))}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right: Work packages + drop zone + table */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <Card className="flex-shrink-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Work Packages</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchWorkPackages()}
                    disabled={workPackagesFetching}
                    className="shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${workPackagesFetching ? "animate-spin" : ""}`} />
                    {workPackagesLoading || workPackagesFetching ? "Loading…" : "Show work packages"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {workPackagesLoading && !workPackagesFetching ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                      Loading work packages…
                    </div>
                  ) : workPackagesError ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Could not load work packages
                      </p>
                      <Button variant="outline" size="sm" onClick={() => refetchWorkPackages()} disabled={workPackagesFetching}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    </div>
                  ) : workPackages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <p className="text-sm text-muted-foreground">
                        No work packages found. Import WBS or add work packages to the project.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => refetchWorkPackages()} disabled={workPackagesFetching}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${workPackagesFetching ? "animate-spin" : ""}`} />
                        Show work packages
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-28">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={selectedWpId === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedWpId(null)}
                        >
                          All
                        </Button>
                        {workPackages.map((wp) => (
                          <Button
                            key={wp.id}
                            variant={selectedWpId === wp.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedWpId(wp.id)}
                            onDrop={(e) => handleDrop(e, wp.id)}
                            onDragOver={handleDragOver}
                            className="cursor-pointer"
                          >
                            {wp.code} – {wp.name}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card
                className="flex-1 flex flex-col min-h-0"
                onDrop={(e) => {
                  e.preventDefault();
                  if (selectedWpId) handleDrop(e, selectedWpId);
                  else toast({ title: "Select a work package first", variant: "destructive" });
                }}
                onDragOver={handleDragOver}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {selectedWpId == null
                      ? "Select a work package"
                      : selectedWP
                        ? `${selectedWP.code} – ${selectedWP.name}`
                        : "Work package"}
                  </CardTitle>
                  {selectedWpId !== null && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedWpId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {selectedWpId == null ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
                      <p>Select a work package above, then drag {activeTab} here. Quantity and estimated value (qty × base rate) will consume the WP budget.</p>
                    </div>
                  ) : (
                    <>
                      {activeTab === "materials" && (
                        <>
                          {displayedMaterials.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                              Drop materials here. Enter quantity on drop; estimated value = quantity × base rate.
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>UOM</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Est. Value</TableHead>
                                  <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {displayedMaterials.map((r) => (
                                  <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.materialCode}</TableCell>
                                    <TableCell>{r.materialDescription}</TableCell>
                                    <TableCell>{r.uom}</TableCell>
                                    <TableCell className="text-right">{r.quantity}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(Number(r.estimatedValue))}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500"
                                        onClick={() => deleteMaterialMutation.mutate(r.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </>
                      )}
                      {activeTab === "services" && (
                        <>
                          {displayedServices.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                              Drop services here. Enter quantity on drop; estimated value = quantity × base rate.
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>UOM</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Est. Value</TableHead>
                                  <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {displayedServices.map((r) => (
                                  <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.serviceCode}</TableCell>
                                    <TableCell>{r.serviceDescription}</TableCell>
                                    <TableCell>{r.uom}</TableCell>
                                    <TableCell className="text-right">{r.quantity}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(Number(r.estimatedValue))}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500"
                                        onClick={() => deleteServiceMutation.mutate(r.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

      {/* Quantity dialog */}
      <Dialog open={isQuantityDialogOpen} onOpenChange={setIsQuantityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter quantity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Estimated value = quantity × base rate (consumes from work package budget).
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleQuantityConfirm}
                disabled={!quantity || parseFloat(quantity) <= 0 || addMaterialMutation.isPending || addServiceMutation.isPending}
              >
                Add
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsQuantityDialogOpen(false);
                  setDraggedItem(null);
                  (window as any).__pendingMaterialDrop = null;
                  (window as any).__pendingServiceDrop = null;
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
