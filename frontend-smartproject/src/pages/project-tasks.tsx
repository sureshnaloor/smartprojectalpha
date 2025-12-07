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
import { Plus, Trash2, GripVertical, Pencil, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
    id: number;
    name: string;
    description: string | null;
    duration: number;
    status: string;
}

interface ProjectTask {
    id: number;
    projectId: number;
    globalTaskId: number | null;
    name: string;
    description: string | null;
    duration: number | null;
    status: string;
    remarks: string | null;
}

export default function ProjectTasks() {
    const { projectId } = useParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

    // Fetch global tasks
    const { data: globalTasks = [] } = useQuery<Task[]>({
        queryKey: ["tasks"],
        queryFn: () => get("/tasks"),
    });

    // Fetch project tasks
    const { data: projectTasks = [], isLoading } = useQuery<ProjectTask[]>({
        queryKey: ["project-tasks", projectId],
        queryFn: () => get(`/projects/${projectId}/tasks`),
        enabled: !!projectId,
    });

    // Create project task mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<ProjectTask>) =>
            post(`/projects/${projectId}/tasks`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
            toast({ title: "Success", description: "Task added to project" });
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Update project task mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<ProjectTask> }) =>
            put(`/projects/${projectId}/tasks/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
            toast({ title: "Success", description: "Task updated" });
            setEditingTask(null);
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Delete project task mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => del(`/projects/${projectId}/tasks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
            toast({ title: "Success", description: "Task removed from project" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        e.dataTransfer.setData("task", JSON.stringify(task));
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const taskData = e.dataTransfer.getData("task");
        if (taskData) {
            const task: Task = JSON.parse(taskData);

            // Check if already exists
            const exists = projectTasks.some(pt => pt.globalTaskId === task.id);
            if (exists) {
                toast({ title: "Warning", description: "Task already exists in project", variant: "destructive" });
                return;
            }

            createMutation.mutate({
                globalTaskId: task.id,
                name: task.name,
                description: task.description,
                duration: task.duration,
                status: "pending",
                remarks: "",
            });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const filteredGlobalTasks = globalTasks.filter(task =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            duration: parseInt(formData.get("duration") as string) || 0,
            status: formData.get("status") as string,
            remarks: formData.get("remarks") as string,
        };

        if (editingTask) {
            updateMutation.mutate({ id: editingTask.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
            {/* Sidebar - Global Tasks */}
            <Card className="w-80 flex flex-col">
                <CardHeader>
                    <CardTitle>Global Tasks</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full px-4 pb-4">
                        <div className="space-y-2">
                            {filteredGlobalTasks.map((task) => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task)}
                                    className="flex items-center gap-2 rounded-lg border p-3 cursor-move hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium truncate">{task.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {task.duration} mins
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Main Content - Project Tasks */}
            <Card className="flex-1 flex flex-col" onDrop={handleDrop} onDragOver={handleDragOver}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Project Tasks</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingTask(null)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Custom Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={editingTask?.name}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        defaultValue={editingTask?.description || ""}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duration (mins)</Label>
                                        <Input
                                            id="duration"
                                            name="duration"
                                            type="number"
                                            defaultValue={editingTask?.duration || 0}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" defaultValue={editingTask?.status || "pending"}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        name="remarks"
                                        defaultValue={editingTask?.remarks || ""}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingTask ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    {projectTasks.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-4">
                            <div className="text-center">
                                <p>No tasks added yet.</p>
                                <p className="text-sm">Drag tasks from the sidebar or click "Add Custom Task"</p>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Duration (mins)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Remarks</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projectTasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                {task.name}
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground">{task.description}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{task.duration}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${task.status === "completed" ? "bg-green-100 text-green-800" :
                                                    task.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                                        "bg-gray-100 text-gray-800"
                                                }`}>
                                                {task.status.replace("_", " ")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={task.remarks || ""}>
                                            {task.remarks}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingTask(task);
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
                                                        if (confirm("Are you sure you want to delete this task?")) {
                                                            deleteMutation.mutate(task.id);
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
