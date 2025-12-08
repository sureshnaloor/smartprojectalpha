import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link as LinkIcon, ExternalLink, Trash2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

interface CorrespondenceItem {
    fileId: string;
    fileName: string;
    uploadTimestamp: number;
    fileInfo: {
        correspondenceName?: string;
        description?: string;
        linkUrl?: string;
        uploadedBy?: string;
    };
}

export default function ProjectSupplierCorrespondence() {
    const { projectId } = useParams();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [description, setDescription] = useState("");

    const { data: project } = useQuery({
        queryKey: [`/api/projects/${projectId}`],
    });

    const { data: items, isLoading } = useQuery<CorrespondenceItem[]>({
        queryKey: [`/api/projects/${projectId}/supplier-correspondence`],
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", `/api/projects/${projectId}/supplier-correspondence/create`, {
                name,
                link,
                description,
                uploadedBy: "Current User" // Replace with actual user
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to create correspondence link");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/supplier-correspondence`] });
            toast({
                title: "Success",
                description: "Supplier correspondence link added successfully",
            });
            setSubmitting(false);
            setName("");
            setLink("");
            setDescription("");
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
            setSubmitting(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ fileId, fileName }: { fileId: string; fileName: string }) => {
            const encodedFileName = encodeURIComponent(fileName);
            const res = await apiRequest("DELETE", `/api/projects/${projectId}/supplier-correspondence?fileId=${fileId}&fileName=${encodedFileName}`);
            if (!res.ok) {
                throw new Error("Delete failed");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/supplier-correspondence`] });
            toast({
                title: "Success",
                description: "Correspondence link deleted successfully",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: "Failed to delete correspondence link",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = () => {
        if (!name || !link) {
            toast({
                title: "Validation Error",
                description: "Name and Link are required",
                variant: "destructive",
            });
            return;
        }
        setSubmitting(true);
        createMutation.mutate();
    };

    const handleDelete = (fileId: string, fileName: string) => {
        if (confirm("Are you sure you want to delete this correspondence link?")) {
            deleteMutation.mutate({ fileId, fileName });
        }
    };

    const handleOpenLink = (url?: string) => {
        if (url) {
            window.open(url, "_blank");
        }
    };

    return (
        <div className="space-y-8 p-6 bg-background min-h-screen">
            {/* Header Section */}
            <div className="relative flex items-center justify-center mb-8 p-6 rounded-xl bg-card border shadow-[0_10px_20px_rgba(0,0,0,0.1),0_6px_6px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_14px_28px_rgba(0,0,0,0.15),0_10px_10px_rgba(0,0,0,0.12)]">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Supplier Correspondence
                    </h1>
                    <p className="text-muted-foreground mt-2">Track Important Supplier Emails and Links</p>
                </div>

                {project && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block">
                        <div className="text-right">
                            <span className="block text-xs text-muted-foreground uppercase tracking-wider">Project</span>
                            <span className="text-xl font-serif font-bold text-primary">{project.name}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Section */}
            <Card className="border-2 border-dashed shadow-sm hover:border-primary/50 transition-colors">
                <CardHeader>
                    <CardTitle className="text-lg">Add New Supplier Link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            placeholder="Subject / Title"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            placeholder="Outlook Link / URL"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                        <Input
                            placeholder="Description (Optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={submitting} className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                            {submitting ? "Adding..." : "Add Link"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* List Grid */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items?.map((item: any) => (
                        <Card key={item.fileId} className="group overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-muted/30">
                                <div className="space-y-1 overflow-hidden">
                                    <CardTitle className="text-base font-semibold truncate" title={item.fileInfo?.correspondenceName}>
                                        {item.fileInfo?.correspondenceName || "Untitled"}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground truncate" title={item.fileInfo?.linkUrl}>
                                        {item.fileInfo?.linkUrl}
                                    </p>
                                </div>
                                <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                                    <Truck className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                {item.fileInfo?.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                        {item.fileInfo.description}
                                    </p>
                                )}

                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground py-2 border-t border-b">
                                    <div>
                                        <span className="font-medium">Date:</span> {new Date(item.uploadTimestamp).toLocaleDateString()}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-medium">Added By:</span> {item.fileInfo?.uploadedBy || "Unknown"}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button variant="default" size="sm" className="flex-1" onClick={() => handleOpenLink(item.fileInfo?.linkUrl)}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Open Link
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item.fileId, item.fileName)}>
                                        <span className="sr-only">Delete</span>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {items?.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                            <Truck className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No supplier correspondence links added yet</p>
                            <p className="text-sm">Add a link to an Outlook email or external document</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
