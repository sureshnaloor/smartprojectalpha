import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Add wavy pattern CSS
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
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:rgba(107,114,128,0.08);stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:rgba(107,114,128,0.03);stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0,20 Q15,10 30,20 T60,20' stroke='url(%23grad)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M0,35 Q15,25 30,35 T60,35' stroke='url(%23grad)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M0,50 Q15,40 30,50 T60,50' stroke='url(%23grad)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat: repeat;
    pointer-events: none;
    z-index: 0;
  }
  .wavy-pattern > * {
    position: relative;
    z-index: 1;
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
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import MasterLayout from "@/layouts/master-layout";

interface Employee {
  id: number;
  employeeNumber: string;
  empFirstName: string;
  empMiddleName?: string;
  empLastName: string;
  empNationalId: string;
  empNationality: string;
  empDob: string;
  empPosition: string;
  empTitle: string;
  empTrade: string;
  empGrade: string;
  empCostPerHour: string;
  createdAt: string;
  updatedAt: string;
}

// API functions
async function getEmployees(): Promise<Employee[]> {
  const response = await fetch("/api/employee-masters");
  if (!response.ok) throw new Error("Failed to fetch employees");
  return response.json();
}

async function createEmployee(data: Omit<Employee, "id" | "createdAt" | "updatedAt">): Promise<Employee> {
  const response = await fetch("/api/employee-masters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create employee");
  return response.json();
}

async function updateEmployee(
  id: number,
  data: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">>
): Promise<Employee> {
  const response = await fetch(`/api/employee-masters/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update employee");
  return response.json();
}

async function deleteEmployee(id: number): Promise<void> {
  const response = await fetch(`/api/employee-masters/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete employee");
}

async function bulkUploadEmployees(csvData: any[]): Promise<Employee[]> {
  const response = await fetch("/api/employee-masters/bulk-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csvData }),
  });
  if (!response.ok) throw new Error("Failed to upload employees");
  return response.json();
}

export default function EmployeeMaster() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    employeeNumber: "",
    empFirstName: "",
    empMiddleName: "",
    empLastName: "",
    empNationalId: "",
    empNationality: "",
    empDob: "",
    empPosition: "",
    empTitle: "",
    empTrade: "",
    empGrade: "",
    empCostPerHour: "",
  });

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employee-masters"],
    queryFn: getEmployees,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-masters"] });
      toast({ title: "Employee created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error creating employee", variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">> }) =>
      updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-masters"] });
      toast({ title: "Employee updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error updating employee", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-masters"] });
      toast({ title: "Employee deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error deleting employee", variant: "destructive" });
    },
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: bulkUploadEmployees,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-masters"] });
      toast({ title: `${data.length} employees uploaded successfully` });
    },
    onError: () => {
      toast({ title: "Error uploading employees", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      employeeNumber: "",
      empFirstName: "",
      empMiddleName: "",
      empLastName: "",
      empNationalId: "",
      empNationality: "",
      empDob: "",
      empPosition: "",
      empTitle: "",
      empTrade: "",
      empGrade: "",
      empCostPerHour: "",
    });
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      empMiddleName: formData.empMiddleName || undefined,
    };
    
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employeeNumber: employee.employeeNumber,
      empFirstName: employee.empFirstName,
      empMiddleName: employee.empMiddleName || "",
      empLastName: employee.empLastName,
      empNationalId: employee.empNationalId,
      empNationality: employee.empNationality,
      empDob: employee.empDob,
      empPosition: employee.empPosition,
      empTitle: employee.empTitle,
      empTrade: employee.empTrade,
      empGrade: employee.empGrade,
      empCostPerHour: employee.empCostPerHour,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n").filter((line) => line.trim());
        const headers = lines[0].split(",").map((h) => h.trim());

        const csvData = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          return {
            employeeNumber: values[headers.indexOf("employeeNumber")],
            empFirstName: values[headers.indexOf("empFirstName")],
            empMiddleName: values[headers.indexOf("empMiddleName")] || "",
            empLastName: values[headers.indexOf("empLastName")],
            empNationalId: values[headers.indexOf("empNationalId")],
            empNationality: values[headers.indexOf("empNationality")],
            empDob: values[headers.indexOf("empDob")],
            empPosition: values[headers.indexOf("empPosition")],
            empTitle: values[headers.indexOf("empTitle")],
            empTrade: values[headers.indexOf("empTrade")],
            empGrade: values[headers.indexOf("empGrade")],
            empCostPerHour: values[headers.indexOf("empCostPerHour")],
          };
        });

        bulkUploadMutation.mutate(csvData);
      } catch (error) {
        toast({ title: "Error parsing CSV file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.empFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.empLastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MasterLayout>
      <style>{wavedPatternStyle}</style>
      <div className="p-8 min-h-screen wavy-pattern" style={{
        backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 25%, #f0f9ff 50%, #e0e7ff 75%, #f3f4f6 100%), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3ClinearGradient id=\'grad\' x1=\'0%\' y1=\'0%\' x2=\'100%\' y2=\'100%\'%3E%3Cstop offset=\'0%\' style=\'stop-color:rgba(107,114,128,0.08);stop-opacity:1\' /%3E%3Cstop offset=\'100%\' style=\'stop-color:rgba(107,114,128,0.03);stop-opacity:1\' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d=\'M0,20 Q15,10 30,20 T60,20\' stroke=\'url(%23grad)\' stroke-width=\'1.5\' fill=\'none\'/%3E%3Cpath d=\'M0,35 Q15,25 30,35 T60,35\' stroke=\'url(%23grad)\' stroke-width=\'1.5\' fill=\'none\'/%3E%3Cpath d=\'M0,50 Q15,40 30,50 T60,50\' stroke=\'url(%23grad)\' stroke-width=\'1.5\' fill=\'none\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat'
      }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Employee Master</h1>
            <p className="text-gray-600">Manage employee information and details</p>
          </div>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search by number, first name or last name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="max-w-2xl"
                  style={{
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
                    background: 'linear-gradient(135deg, #f5f5f4 0%, #f0f9ff 100%)',
                    border: '1px solid rgba(120, 113, 108, 0.3)'
                  }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-stone-700 to-sky-600 bg-clip-text text-transparent">
                      {editingEmployee ? "Edit Employee" : "Add New Employee"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <Label htmlFor="employeeNumber" className="font-semibold text-stone-700">Employee Number *</Label>
                      <Input
                        id="employeeNumber"
                        required
                        value={formData.employeeNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, employeeNumber: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="empFirstName" className="font-semibold text-stone-700">First Name *</Label>
                        <Input
                          id="empFirstName"
                          required
                          value={formData.empFirstName}
                          onChange={(e) =>
                            setFormData({ ...formData, empFirstName: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="empMiddleName" className="font-semibold text-stone-700">Middle Name</Label>
                        <Input
                          id="empMiddleName"
                          value={formData.empMiddleName}
                          onChange={(e) =>
                            setFormData({ ...formData, empMiddleName: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="empLastName" className="font-semibold text-stone-700">Last Name *</Label>
                        <Input
                          id="empLastName"
                          required
                          value={formData.empLastName}
                          onChange={(e) =>
                            setFormData({ ...formData, empLastName: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="empNationalId" className="font-semibold text-stone-700">National ID *</Label>
                        <Input
                          id="empNationalId"
                          required
                          value={formData.empNationalId}
                          onChange={(e) =>
                            setFormData({ ...formData, empNationalId: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="empNationality" className="font-semibold text-stone-700">Nationality *</Label>
                        <Input
                          id="empNationality"
                          required
                          value={formData.empNationality}
                          onChange={(e) =>
                            setFormData({ ...formData, empNationality: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="empDob" className="font-semibold text-stone-700">Date of Birth *</Label>
                      <Input
                        id="empDob"
                        required
                        type="date"
                        value={formData.empDob}
                        onChange={(e) =>
                          setFormData({ ...formData, empDob: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="empPosition" className="font-semibold text-stone-700">Position *</Label>
                        <Input
                          id="empPosition"
                          required
                          value={formData.empPosition}
                          onChange={(e) =>
                            setFormData({ ...formData, empPosition: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="empTitle" className="font-semibold text-stone-700">Title *</Label>
                        <Input
                          id="empTitle"
                          required
                          value={formData.empTitle}
                          onChange={(e) =>
                            setFormData({ ...formData, empTitle: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="empTrade" className="font-semibold text-stone-700">Trade *</Label>
                        <Input
                          id="empTrade"
                          required
                          value={formData.empTrade}
                          onChange={(e) =>
                            setFormData({ ...formData, empTrade: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="empGrade" className="font-semibold text-stone-700">Grade *</Label>
                        <Input
                          id="empGrade"
                          required
                          value={formData.empGrade}
                          onChange={(e) =>
                            setFormData({ ...formData, empGrade: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="empCostPerHour" className="font-semibold text-stone-700">Cost Per Hour *</Label>
                      <Input
                        id="empCostPerHour"
                        required
                        type="number"
                        step="0.01"
                        value={formData.empCostPerHour}
                        onChange={(e) =>
                          setFormData({ ...formData, empCostPerHour: e.target.value })
                        }
                      />
                    </div>

                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingEmployee ? "Update" : "Create"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

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

          {/* Table */}
          <div className="rounded-lg overflow-hidden" style={{
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
            background: '#ffffff',
            border: '1px solid rgba(120, 113, 108, 0.3)'
          }}>
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No employees found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-100 to-slate-100 border-b-2 border-gray-200">
                      <TableHead className="text-gray-900 font-bold">Employee #</TableHead>
                      <TableHead className="text-gray-900 font-bold">Name</TableHead>
                      <TableHead className="text-gray-900 font-bold">Position</TableHead>
                      <TableHead className="text-gray-900 font-bold">Title</TableHead>
                      <TableHead className="text-gray-900 font-bold">Grade</TableHead>
                      <TableHead className="text-gray-900 font-bold">Cost/Hour</TableHead>
                      <TableHead className="text-gray-900 font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee, index) => (
                      <TableRow 
                        key={employee.id}
                        className={`transition-colors duration-200 border-b border-gray-200 hover:shadow-sm ${
                          index % 2 === 0 
                            ? "bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100" 
                            : "bg-gradient-to-r from-slate-50 to-sky-50 hover:from-slate-100 hover:to-sky-100"
                        }`}
                      >
                        <TableCell className="font-medium">{employee.employeeNumber}</TableCell>
                        <TableCell>
                          {employee.empFirstName} {employee.empMiddleName} {employee.empLastName}
                        </TableCell>
                        <TableCell>{employee.empPosition}</TableCell>
                        <TableCell>{employee.empTitle}</TableCell>
                        <TableCell>{employee.empGrade}</TableCell>
                        <TableCell>{parseFloat(employee.empCostPerHour).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(employee)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(employee.id)}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
