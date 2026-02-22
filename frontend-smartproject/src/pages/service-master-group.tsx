import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface ServiceGroup {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

async function getGroups(): Promise<ServiceGroup[]> {
  const res = await fetch("/api/service-groups");
  if (!res.ok) throw new Error("Failed to fetch service groups");
  return res.json();
}

async function createGroup(data: { name: string; description?: string }): Promise<ServiceGroup> {
  const res = await fetch("/api/service-groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create service group");
  return res.json();
}

async function updateGroup(id: number, data: Partial<{ name: string; description: string }>): Promise<ServiceGroup> {
  const res = await fetch(`/api/service-groups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update service group");
  return res.json();
}

async function deleteGroup(id: number): Promise<void> {
  const res = await fetch(`/api/service-groups/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete service group");
}

export default function ServiceMasterGroup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { data: groups = [], isLoading } = useQuery({ queryKey: ["/api/service-groups"], queryFn: getGroups });

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-groups"] });
      toast({ title: "Service Group created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "Error creating Service Group", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; description: string }> }) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-groups"] });
      toast({ title: "Service Group updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "Error updating Service Group", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-groups"] });
      toast({ title: "Service Group deleted successfully" });
    },
    onError: () => toast({ title: "Error deleting Service Group", variant: "destructive" }),
  });

  const resetForm = () => { setFormData({ name: "", description: "" }); setEditingItem(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) updateMutation.mutate({ id: editingItem.id, data: formData });
    else createMutation.mutate(formData);
  };

  const handleEdit = (item: ServiceGroup) => {
    setEditingItem(item);
    setFormData({ name: item.name, description: item.description || "" });
    setIsDialogOpen(true);
  };

  const filteredItems = groups.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Service Group</h1>
          <p className="text-muted-foreground mt-1">Manage Service Groups used in Service Master.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1" />
            <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Add Service Group</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editingItem ? "Edit Service Group" : "Add Service Group"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label>Name *</Label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingItem ? "Update" : "Create"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? <div className="p-8 text-center">Loading...</div> : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No service groups found.</div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.description || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => confirm("Delete?") && deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
