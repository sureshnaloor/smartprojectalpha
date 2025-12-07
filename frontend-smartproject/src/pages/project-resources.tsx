import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { get, post, put, del } from "@/lib/api-client";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Resource {
    id: number;
    name: string;
    description: string | null;
    type: "manpower" | "equipment" | "material";
    unitOfMeasure: string;
    unitRate: string;
    remarks: string | null;
}

interface ProjectResource {
    id: number;
    projectId: number;
    globalResourceId: number | null;
    name: string;
    description: string | null;
    type: "manpower" | "equipment" | "material";
    unitOfMeasure: string;
    unitRate: string;
    quantity: string;
    remarks: string | null;
}

export default function ProjectResources() {
    const { projectId } = useParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<ProjectResource | null>(null);

    // Fetch global resources
    const { data: globalResources = [] } = useQuery<Resource[]>({
        queryKey: ["resources"],
        queryFn: () => get("/resources"),
    });

    // Fetch project resources
    const { data: projectResources = [], isLoading } = useQuery<ProjectResource[]>({
        queryKey: ["project-resources", projectId],
        queryFn: () => get(`/projects/${projectId}/resources`),
        enabled: !!projectId,
    });

    // Create project resource mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<ProjectResource>) =>
            post(`/projects/${projectId}/resources`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-resources", projectId] });
            toast({ title: "Success", description: "Resource added to project" });
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Update project resource mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<ProjectResource> }) =>
            put(`/projects/${projectId}/resources/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-resources", projectId] });
            toast({ title: "Success", description: "Resource updated" });
            setEditingResource(null);
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Delete project resource mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => del(`/projects/${projectId}/resources/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-resources", projectId] });
            toast({ title: "Success", description: "Resource removed from project" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleDragStart = (e: React.DragEvent, resource: Resource) => {
        e.dataTransfer.setData("resource", JSON.stringify(resource));
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const resourceData = e.dataTransfer.getData("resource");
        if (resourceData) {
            const resource: Resource = JSON.parse(resourceData);

            // Check if already exists
            const exists = projectResources.some(pr => pr.globalResourceId === resource.id);
            if (exists) {
                toast({ title: "Warning", description: "Resource already exists in project", variant: "destructive" });
                return;
            }

            createMutation.mutate({
                globalResourceId: resource.id,
                name: resource.name,
                description: resource.description,
                type: resource.type,
                unitOfMeasure: resource.unitOfMeasure,
                unitRate: resource.unitRate,
                quantity: "1", // Default quantity
                remarks: resource.remarks,
            });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const filteredGlobalResources = globalResources.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            type: formData.get("type") as "manpower" | "equipment" | "material",
            unitOfMeasure: formData.get("unitOfMeasure") as string,
            unitRate: formData.get("unitRate") as string,
            quantity: formData.get("quantity") as string,
            remarks: formData.get("remarks") as string,
        };

        if (editingResource) {
            updateMutation.mutate({ id: editingResource.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
            {/* Sidebar - Global Resources */}
            <Card className="w-80 flex flex-col">
                <CardHeader>
                    <CardTitle>Global Resources</CardTitle>
                    <div className="relative">
                        <Input
                            placeholder="Search resources..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full px-4 pb-4">
                        <div className="space-y-2">
                            {filteredGlobalResources.map((resource) => (
                                <div
                                    key={resource.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, resource)}
                                    className="flex items-center gap-2 rounded-lg border p-3 cursor-move hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium truncate">{resource.name}</p>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                {resource.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {resource.unitRate} / {resource.unitOfMeasure}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Main Content - Project Resources */}
            <Card className="flex-1 flex flex-col" onDrop={handleDrop} onDragOver={handleDragOver}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Project Resources</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingResource(null)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Custom Resource
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={editingResource?.name}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        defaultValue={editingResource?.description || ""}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select name="type" defaultValue={editingResource?.type || "manpower"}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manpower">Manpower</SelectItem>
                                                <SelectItem value="equipment">Equipment</SelectItem>
                                                <SelectItem value="material">Material</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="unitOfMeasure">Unit</Label>
                                        <Input
                                            id="unitOfMeasure"
                                            name="unitOfMeasure"
                                            defaultValue={editingResource?.unitOfMeasure}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="unitRate">Rate</Label>
                                        <Input
                                            id="unitRate"
                                            name="unitRate"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingResource?.unitRate}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <Input
                                            id="quantity"
                                            name="quantity"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingResource?.quantity}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        name="remarks"
                                        defaultValue={editingResource?.remarks || ""}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingResource ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    {projectResources.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-4">
                            <div className="text-center">
                                <p>No resources added yet.</p>
                                <p className="text-sm">Drag resources from the sidebar or click "Add Custom Resource"</p>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Remarks</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projectResources.map((resource) => (
                                    <TableRow key={resource.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                {resource.name}
                                                {resource.description && (
                                                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{resource.type}</TableCell>
                                        <TableCell>{resource.unitOfMeasure}</TableCell>
                                        <TableCell className="text-right">{resource.unitRate}</TableCell>
                                        <TableCell className="text-right">{resource.quantity}</TableCell>
                                        <TableCell className="text-right">
                                            {(parseFloat(resource.unitRate) * parseFloat(resource.quantity)).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={resource.remarks || ""}>
                                            {resource.remarks}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingResource(resource);
                                                        setIsDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        if (confirm("Are you sure you want to delete this resource?")) {
                                                            deleteMutation.mutate(resource.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
