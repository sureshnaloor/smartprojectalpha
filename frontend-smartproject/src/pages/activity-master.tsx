import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Add wavy pattern CSS
const wavedPatternStyle = `
  @keyframes wave {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(10px); }
  }
  
  .wavy-pattern {
    background-image: 
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'%3E%3Cstop offset='0%' style='stop-color:rgba(3,102,214,0.08);stop-opacity:1' /%3E%3Cstop offset='100%' style='stop-color:rgba(3,102,214,0.03);stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0,20 Q15,10 30,20 T60,20' stroke='url(%23grad)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M0,35 Q15,25 30,35 T60,35' stroke='url(%23grad)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M0,50 Q15,40 30,50 T60,50' stroke='url(%23grad)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat: repeat;
  }
`;
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MasterLayout from "@/layouts/master-layout";

interface Activity {
  id: number;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  unitRate: number;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  currency: "USD" | "EUR" | "GBP" | "SAR";
}

interface ActivityFormData {
  name: string;
  description: string;
  unitOfMeasure: string;
  unitRate: number;
  currency: "USD" | "EUR" | "GBP" | "SAR";
  remarks: string;
}

async function bulkUploadActivities(csvData: any[]): Promise<Activity[]> {
  const response = await fetch("/api/activities/bulk-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csvData }),
  });
  if (!response.ok) throw new Error("Failed to upload activities");
  return response.json();
}

export default function ActivityMaster() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // Fetch activities
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Create activity mutation
  const createMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsDialogOpen(false);
      toast.success("Activity created successfully");
      setLocation("/activity-master");
    },
    onError: () => {
      toast.error("Failed to create activity");
    },
  });

  // Update activity mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ActivityFormData }) => {
      const response = await fetch(`/api/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsDialogOpen(false);
      setEditingActivity(null);
      toast.success("Activity updated successfully");
      setLocation("/activity-master");
    },
    onError: () => {
      toast.error("Failed to update activity");
    },
  });

  // Delete activity mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast.success("Activity deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete activity");
    },
  });

  // Bulk upload for activities
  const bulkUploadMutation = useMutation({
    mutationFn: bulkUploadActivities,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast.success(`${data.length} activities uploaded successfully`);
      setLocation('/activity-master');
    },
    onError: () => {
      toast.error("Failed to upload activities");
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        const csvData = lines.slice(1).map((line) => {
          const values = line.split(',').map(v => v.trim());
          return {
            name: values[headers.indexOf('name')],
            description: values[headers.indexOf('description')] || null,
            unitOfMeasure: values[headers.indexOf('unitOfMeasure')],
            unitRate: parseFloat(values[headers.indexOf('unitRate')] || '0'),
            currency: values[headers.indexOf('currency')] || 'USD',
            remarks: values[headers.indexOf('remarks')] || null,
          };
        });

        bulkUploadMutation.mutate(csvData);
      } catch (err) {
        toast.error('Failed to parse CSV');
      }
    };
    reader.readAsText(file);
  };

  // Filter activities based on search query
  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.unitOfMeasure.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: ActivityFormData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      unitOfMeasure: formData.get("unitOfMeasure") as string,
      unitRate: parseFloat(formData.get("unitRate") as string),
      currency: formData.get("currency") as "USD" | "EUR" | "GBP" | "SAR",
      remarks: formData.get("remarks") as string,
    };

    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit click
  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setIsDialogOpen(true);
  };

  // Handle delete click
  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <MasterLayout>
      <style>{wavedPatternStyle}</style>
      <div className="flex-1 space-y-4 p-8 pt-6 wavy-pattern" style={{
        backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 25%, #f0f9ff 50%, #e0e7ff 75%, #f3f4f6 100%), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3ClinearGradient id=\'grad\' x1=\'0%\' y1=\'0%\' x2=\'100%\' y2=\'100%\'%3E%3Cstop offset=\'0%\' style=\'stop-color:rgba(107,114,128,0.08);stop-opacity:1\' /%3E%3Cstop offset=\'100%\' style=\'stop-color:rgba(107,114,128,0.03);stop-opacity:1\' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d=\'M0,20 Q15,10 30,20 T60,20\' stroke=\'url(%23grad)\' stroke-width=\'1.5\' fill=\'none\'/%3E%3Cpath d=\'M0,35 Q15,25 30,35 T60,35\' stroke=\'url(%23grad)\' stroke-width=\'1.5\' fill=\'none\'/%3E%3Cpath d=\'M0,50 Q15,40 30,50 T60,50\' stroke=\'url(%23grad)\' stroke-width=\'1.5\' fill=\'none\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat'
      }}>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Activity Master</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingActivity(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Activity
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
                    {editingActivity ? "Edit Activity" : "New Activity"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-semibold text-gray-700">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingActivity?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-semibold text-gray-700">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingActivity?.description || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                    <Input
                      id="unitOfMeasure"
                      name="unitOfMeasure"
                      defaultValue={editingActivity?.unitOfMeasure}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitRate">Unit Rate</Label>
                    <Input
                      id="unitRate"
                      name="unitRate"
                      type="number"
                      step="0.01"
                      defaultValue={editingActivity?.unitRate}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" defaultValue={editingActivity?.currency || "USD"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      defaultValue={editingActivity?.remarks || ""}
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
                      {editingActivity ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "/templates/activity-master-template.csv";
                link.download = "activity-master-template.csv";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="gap-2"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>

            <label>
              <Button variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={bulkUploadMutation.isPending}
              />
            </label>
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
                <TableHead className="font-bold text-gray-900">Name</TableHead>
                <TableHead className="font-bold text-gray-900">Description</TableHead>
                <TableHead className="font-bold text-gray-900">Unit of Measure</TableHead>
                <TableHead className="font-bold text-gray-900">Unit Rate</TableHead>
                <TableHead className="font-bold text-gray-900">Currency</TableHead>
                <TableHead className="font-bold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity, index) => (
                <TableRow key={activity.id} className={index % 2 === 0 ? "bg-gradient-to-r from-gray-50 to-slate-50" : "bg-gradient-to-r from-slate-50 to-sky-50"} style={{
                  borderColor: 'rgba(107, 114, 128, 0.2)',
                  transition: 'background-color 0.2s ease'
                }}>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>{activity.description}</TableCell>
                  <TableCell>{activity.unitOfMeasure}</TableCell>
                  <TableCell>{activity.unitRate}</TableCell>
                  <TableCell>{activity.currency}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(activity)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(activity.id)}
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