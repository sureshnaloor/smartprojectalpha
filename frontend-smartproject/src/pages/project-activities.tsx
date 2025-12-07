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
import { Plus, Trash2, GripVertical, Pencil, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
    id: number;
    name: string;
    description: string | null;
    unitOfMeasure: string;
    unitRate: string;
    remarks: string | null;
}

interface ProjectActivity {
    id: number;
    projectId: number;
    globalActivityId: number | null;
    name: string;
    description: string | null;
    unitOfMeasure: string;
    unitRate: string;
    quantity: string;
    remarks: string | null;
}

export default function ProjectActivities() {
    const { projectId } = useParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ProjectActivity | null>(null);

    // Fetch global activities
    const { data: globalActivities = [] } = useQuery<Activity[]>({
        queryKey: ["activities"],
        queryFn: () => get("/activities"),
    });

    // Fetch project activities
    const { data: projectActivities = [], isLoading } = useQuery<ProjectActivity[]>({
        queryKey: ["project-activities", projectId],
        queryFn: () => get(`/projects/${projectId}/activities`),
        enabled: !!projectId,
    });

    // Create project activity mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<ProjectActivity>) =>
            post(`/projects/${projectId}/activities`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-activities", projectId] });
            toast({ title: "Success", description: "Activity added to project" });
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Update project activity mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<ProjectActivity> }) =>
            put(`/projects/${projectId}/activities/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-activities", projectId] });
            toast({ title: "Success", description: "Activity updated" });
            setEditingActivity(null);
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Delete project activity mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => del(`/projects/${projectId}/activities/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-activities", projectId] });
            toast({ title: "Success", description: "Activity removed from project" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleDragStart = (e: React.DragEvent, activity: Activity) => {
        e.dataTransfer.setData("activity", JSON.stringify(activity));
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const activityData = e.dataTransfer.getData("activity");
        if (activityData) {
            const activity: Activity = JSON.parse(activityData);

            // Check if already exists
            const exists = projectActivities.some(pa => pa.globalActivityId === activity.id);
            if (exists) {
                toast({ title: "Warning", description: "Activity already exists in project", variant: "destructive" });
                return;
            }

            createMutation.mutate({
                globalActivityId: activity.id,
                name: activity.name,
                description: activity.description,
                unitOfMeasure: activity.unitOfMeasure,
                unitRate: activity.unitRate,
                quantity: "1", // Default quantity
                remarks: activity.remarks,
            });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const filteredGlobalActivities = globalActivities.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            unitOfMeasure: formData.get("unitOfMeasure") as string,
            unitRate: formData.get("unitRate") as string,
            quantity: formData.get("quantity") as string,
            remarks: formData.get("remarks") as string,
        };

        if (editingActivity) {
            updateMutation.mutate({ id: editingActivity.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
            {/* Sidebar - Global Activities */}
            <Card className="w-80 flex flex-col">
                <CardHeader>
                    <CardTitle>Global Activities</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search activities..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full px-4 pb-4">
                        <div className="space-y-2">
                            {filteredGlobalActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, activity)}
                                    className="flex items-center gap-2 rounded-lg border p-3 cursor-move hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium truncate">{activity.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {activity.unitRate} / {activity.unitOfMeasure}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Main Content - Project Activities */}
            <Card className="flex-1 flex flex-col" onDrop={handleDrop} onDragOver={handleDragOver}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Project Activities</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingActivity(null)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Custom Activity
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingActivity ? "Edit Activity" : "Add New Activity"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={editingActivity?.name}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        defaultValue={editingActivity?.description || ""}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="unitOfMeasure">Unit</Label>
                                        <Input
                                            id="unitOfMeasure"
                                            name="unitOfMeasure"
                                            defaultValue={editingActivity?.unitOfMeasure}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="unitRate">Rate</Label>
                                        <Input
                                            id="unitRate"
                                            name="unitRate"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingActivity?.unitRate}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        name="quantity"
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingActivity?.quantity}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        name="remarks"
                                        defaultValue={editingActivity?.remarks || ""}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingActivity ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    {projectActivities.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-4">
                            <div className="text-center">
                                <p>No activities added yet.</p>
                                <p className="text-sm">Drag activities from the sidebar or click "Add Custom Activity"</p>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Remarks</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projectActivities.map((activity) => (
                                    <TableRow key={activity.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                {activity.name}
                                                {activity.description && (
                                                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{activity.unitOfMeasure}</TableCell>
                                        <TableCell className="text-right">{activity.unitRate}</TableCell>
                                        <TableCell className="text-right">{activity.quantity}</TableCell>
                                        <TableCell className="text-right">
                                            {(parseFloat(activity.unitRate) * parseFloat(activity.quantity)).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={activity.remarks || ""}>
                                            {activity.remarks}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingActivity(activity);
                                                        setIsDialogOpen(true);
                                                    }}
                                                >
                                                    <Search className="h-4 w-4" /> {/* Using Search icon as Edit icon placeholder if Edit not imported */}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        if (confirm("Are you sure you want to delete this activity?")) {
                                                            deleteMutation.mutate(activity.id);
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
