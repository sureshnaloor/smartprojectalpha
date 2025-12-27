import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import MasterLayout from "@/layouts/master-layout";

const wavedPatternStyle = `
  @keyframes wave {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-2px); }
  }
  .wavy-pattern {
    position: relative;
  }
  .wavy-pattern::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:rgba(20,184,166,0.08);stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:rgba(20,184,166,0.03);stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0,20 Q15,10 30,20 T60,20' stroke='url(%23grad)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M0,35 Q15,25 30,35 T60,35' stroke='url(%23grad)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M0,50 Q15,40 30,50 T60,50' stroke='url(%23grad)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat: repeat;
    pointer-events: none;
    z-index: 0;
  }
  .wavy-pattern > * {
    position: relative;
    z-index: 1;
  }
`;

// Resource type definitions
type ResourceType = "manpower" | "equipment" | "rental_manpower" | "rental_equipment" | "tools";

interface Resource {
  id: number;
  type: ResourceType;
  name: string;
  description?: string;
  unitOfMeasure: string;
  unitRate: number;
  currency: string;
  availability: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// API functions
async function getResources(): Promise<Resource[]> {
  const response = await fetch("/api/resources");
  if (!response.ok) throw new Error("Failed to fetch resources");
  return response.json();
}

async function createResource(data: Omit<Resource, "id" | "createdAt" | "updatedAt">): Promise<Resource> {
  const response = await fetch("/api/resources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create resource");
  return response.json();
}

async function updateResource(id: number, data: Partial<Omit<Resource, "id" | "createdAt" | "updatedAt">>): Promise<Resource> {
  const response = await fetch(`/api/resources/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update resource");
  return response.json();
}

async function deleteResource(id: number): Promise<void> {
  const response = await fetch(`/api/resources/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete resource");
}

export default function ResourceMaster() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: "",
    name: "",
    description: "",
    unitOfMeasure: "",
    unitRate: "",
    currency: "USD",
    availability: "100",
    remarks: "",
  });

  // Queries and mutations
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: getResources,
  });

  const createMutation = useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({
        title: "Success",
        description: "Resource created successfully",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create resource",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Resource, "id" | "createdAt" | "updatedAt">> }) => updateResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type: formData.type as ResourceType,
      name: formData.name,
      description: formData.description || undefined,
      unitOfMeasure: formData.unitOfMeasure,
      unitRate: parseFloat(formData.unitRate),
      currency: formData.currency as "USD" | "EUR" | "SAR",
      availability: parseFloat(formData.availability),
      remarks: formData.remarks || undefined,
    };

    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      type: resource.type,
      name: resource.name,
      description: resource.description || "",
      unitOfMeasure: resource.unitOfMeasure,
      unitRate: resource.unitRate.toString(),
      currency: resource.currency,
      availability: resource.availability.toString(),
      remarks: resource.remarks || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "",
      name: "",
      description: "",
      unitOfMeasure: "",
      unitRate: "",
      currency: "USD",
      availability: "100",
      remarks: "",
    });
    setEditingResource(null);
  };

  return (
    <MasterLayout>
      <style>{wavedPatternStyle}</style>
      <div className="flex-1 space-y-4 p-8 pt-6 wavy-pattern" style={{
        backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 25%, #f0f9ff 50%, #e0e7ff 75%, #f3f4f6 100%), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3ClinearGradient id=\'grad\' x1=\'0%\' y1=\'0%\' x2=\'100%\' y2=\'100%\'%3E%3Cstop offset=\'0%\' style=\'stop-color:rgba(107,114,128,0.08);stop-opacity:1\' /%3E%3Cstop offset=\'100%\' style=\'stop-color:rgba(107,114,128,0.03);stop-opacity:1\' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d=\'M0,20 Q15,10 30,20 T60,20\' stroke=\'url(%23grad)\' stroke-width=\'1.5\' fill=\'none\'/%3E%3Cpath d=\'M0,35 Q15,25 30,35 T60,35\' stroke=\'url(%23grad)\' stroke-width=\'1.5\' fill=\'none\'/%3E%3Cpath d=\'M0,50 Q15,40 30,50 T60,50\' stroke=\'url(%23grad)\' stroke-width=\'1.5\' fill=\'none\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat'
      }}>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Resource Master</h2>
          <div className="flex items-center space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent style={{
                backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(107, 114, 128, 0.3)'
              }}>
                <DialogHeader>
                  <DialogTitle style={{
                    backgroundImage: 'linear-gradient(to right, rgb(107, 114, 128), rgb(148, 163, 184))',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                  }}>
                    {editingResource ? "Edit Resource" : "Create New Resource"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="font-semibold text-gray-700">Resource Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manpower">Manpower</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="rental_manpower">Rental Manpower</SelectItem>
                        <SelectItem value="rental_equipment">Rental Equipment</SelectItem>
                        <SelectItem value="tools">Tools</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-semibold text-gray-700">Resource Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-semibold text-gray-700">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitOfMeasure" className="font-semibold text-gray-700">Unit of Measure</Label>
                    <Input
                      id="unitOfMeasure"
                      value={formData.unitOfMeasure}
                      onChange={(e) =>
                        setFormData({ ...formData, unitOfMeasure: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitRate" className="font-semibold text-teal-700">Unit Rate</Label>
                    <Input
                      id="unitRate"
                      type="number"
                      step="0.01"
                      value={formData.unitRate}
                      onChange={(e) =>
                        setFormData({ ...formData, unitRate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="font-semibold text-teal-700">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability" className="font-semibold text-teal-700">Availability (%)</Label>
                    <Input
                      id="availability"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.availability}
                      onChange={(e) =>
                        setFormData({ ...formData, availability: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks" className="font-semibold text-teal-700">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({ ...formData, remarks: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingResource ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-md border border-gray-200" style={{
          boxShadow: '0 4px 6px -1px rgba(107, 114, 128, 0.1), 0 2px 4px -1px rgba(107, 114, 128, 0.06)'
        }}>
          <Table>
            <TableHeader style={{
              backgroundImage: 'linear-gradient(to right, rgb(243, 244, 246), rgb(229, 231, 235))',
            }}>
              <TableRow>
                <TableHead className="font-bold text-gray-900">Type</TableHead>
                <TableHead className="font-bold text-gray-900">Name</TableHead>
                <TableHead className="font-bold text-gray-900">Description</TableHead>
                <TableHead className="font-bold text-gray-900">Unit of Measure</TableHead>
                <TableHead className="font-bold text-gray-900">Unit Rate</TableHead>
                <TableHead className="font-bold text-gray-900">Currency</TableHead>
                <TableHead className="font-bold text-gray-900">Availability</TableHead>
                <TableHead className="font-bold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource, index) => (
                <TableRow key={resource.id} className={index % 2 === 0 ? "bg-gradient-to-r from-gray-50 to-slate-50" : "bg-gradient-to-r from-slate-50 to-sky-50"} style={{
                  borderColor: 'rgba(107, 114, 128, 0.2)',
                  transition: 'background-color 0.2s ease'
                }}>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      resource.type === "manpower" ? "bg-blue-100 text-blue-800" :
                      resource.type === "equipment" ? "bg-green-100 text-green-800" :
                      "bg-orange-100 text-orange-800"
                    }`}>
                      {resource.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{resource.name}</TableCell>
                  <TableCell>{resource.description}</TableCell>
                  <TableCell>{resource.unitOfMeasure}</TableCell>
                  <TableCell>{resource.unitRate}</TableCell>
                  <TableCell>{resource.currency}</TableCell>
                  <TableCell>{resource.availability}%</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(resource)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(resource.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MasterLayout>
  );
} 