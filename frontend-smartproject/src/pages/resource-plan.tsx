import { useState } from "react";
import { useParams } from "wouter";
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Grid3X3,
  List,
  UserCheck,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResourcePlanEntry {
  id: string;
  resourceName: string;
  resourceType: 'Manpower' | 'Equipment' | 'Material';
  startDate: string;
  endDate: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  status: 'Planned' | 'Allocated' | 'In Use' | 'Completed';
  remarks: string;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
}

// Dummy data
const dummyResourcePlanData: ResourcePlanEntry[] = [
  {
    id: "1",
    resourceName: "Civil Engineer",
    resourceType: "Manpower",
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    quantity: 2,
    unit: "Persons",
    costPerUnit: 5000,
    totalCost: 10000,
    status: "Allocated",
    remarks: "Senior civil engineers for foundation and structural work",
    createdBy: "John Smith",
    createdAt: "2024-01-10",
    lastUpdated: "2024-01-12"
  },
  {
    id: "2",
    resourceName: "Excavator",
    resourceType: "Equipment",
    startDate: "2024-01-20",
    endDate: "2024-01-25",
    quantity: 1,
    unit: "Units",
    costPerUnit: 8000,
    totalCost: 8000,
    status: "In Use",
    remarks: "For foundation excavation work",
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-15",
    lastUpdated: "2024-01-18"
  },
  {
    id: "3",
    resourceName: "Steel Reinforcement",
    resourceType: "Material",
    startDate: "2024-02-01",
    endDate: "2024-02-01",
    quantity: 50,
    unit: "Tons",
    costPerUnit: 1200,
    totalCost: 60000,
    status: "Planned",
    remarks: "For structural reinforcement",
    createdBy: "Mike Wilson",
    createdAt: "2024-01-20",
    lastUpdated: "2024-01-20"
  },
  {
    id: "4",
    resourceName: "Electrician",
    resourceType: "Manpower",
    startDate: "2024-02-15",
    endDate: "2024-04-15",
    quantity: 3,
    unit: "Persons",
    costPerUnit: 4500,
    totalCost: 13500,
    status: "Planned",
    remarks: "For electrical installation work",
    createdBy: "Lisa Chen",
    createdAt: "2024-01-25",
    lastUpdated: "2024-01-25"
  },
  {
    id: "5",
    resourceName: "Crane",
    resourceType: "Equipment",
    startDate: "2024-03-01",
    endDate: "2024-03-10",
    quantity: 1,
    unit: "Units",
    costPerUnit: 15000,
    totalCost: 15000,
    status: "Planned",
    remarks: "For heavy lifting during construction",
    createdBy: "David Brown",
    createdAt: "2024-01-30",
    lastUpdated: "2024-01-30"
  }
];

export default function ResourcePlan() {
  const params = useParams();
  const projectId = params.projectId;
  
  const [resourcePlans, setResourcePlans] = useState<ResourcePlanEntry[]>(dummyResourcePlanData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ResourcePlanEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Filter entries based on search and filters
  const filteredEntries = resourcePlans.filter(entry => {
    const matchesSearch = entry.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || entry.resourceType === filterType;
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Use': return 'bg-blue-100 text-blue-800';
      case 'Allocated': return 'bg-orange-100 text-orange-800';
      case 'Planned': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Manpower': return 'bg-blue-100 text-blue-800';
      case 'Equipment': return 'bg-purple-100 text-purple-800';
      case 'Material': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Plan</h1>
          <p className="text-gray-600">Plan and manage project resources with timelines</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
          >
            {viewMode === 'cards' ? <List className="h-4 w-4 mr-2" /> : <Grid3X3 className="h-4 w-4 mr-2" />}
            {viewMode === 'cards' ? 'List View' : 'Card View'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource Plan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type">Resource Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Manpower">Manpower</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Material">Material</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="Allocated">Allocated</SelectItem>
                  <SelectItem value="In Use">In Use</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterStatus("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold">{resourcePlans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(resourcePlans.reduce((sum, r) => sum + r.totalCost, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Resources</p>
                <p className="text-2xl font-bold">{resourcePlans.filter(r => r.status === 'In Use' || r.status === 'Allocated').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Planned Resources</p>
                <p className="text-2xl font-bold">{resourcePlans.filter(r => r.status === 'Planned').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Plans */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>Resource Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Resource</TableHead>
                    <TableHead className="w-20">Type</TableHead>
                    <TableHead className="w-20">Start Date</TableHead>
                    <TableHead className="w-20">End Date</TableHead>
                    <TableHead className="w-16">Duration</TableHead>
                    <TableHead className="w-16">Quantity</TableHead>
                    <TableHead className="w-20">Total Cost</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="max-w-24">
                          <p className="font-medium truncate text-xs">{entry.resourceName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTypeColor(entry.resourceType)} text-xs`}>
                          {entry.resourceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(entry.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(entry.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {calculateDuration(entry.startDate, entry.endDate)} days
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.quantity} {entry.unit}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {formatCurrency(entry.totalCost)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(entry.status)} text-xs`}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{entry.resourceName}</CardTitle>
                    <p className="text-sm text-gray-600">{entry.quantity} {entry.unit}</p>
                  </div>
                  <Badge className={getStatusColor(entry.status)}>
                    {entry.status}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(entry.startDate).toLocaleDateString()} - {new Date(entry.endDate).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Type</Label>
                    <Badge className={`${getTypeColor(entry.resourceType)} text-xs`}>
                      {entry.resourceType}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Duration</Label>
                    <p className="text-sm font-medium">{calculateDuration(entry.startDate, entry.endDate)} days</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Total Cost</Label>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(entry.totalCost)}</p>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Remarks</Label>
                  <p className="text-sm text-gray-600 truncate">{entry.remarks}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    By: {entry.createdBy}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Resource Plan Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Resource Plan</DialogTitle>
            <DialogDescription>
              Plan resources with start and end dates for the project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resourceName">Resource Name</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Civil Engineer">Civil Engineer</SelectItem>
                  <SelectItem value="Electrician">Electrician</SelectItem>
                  <SelectItem value="Mechanical Engineer">Mechanical Engineer</SelectItem>
                  <SelectItem value="Excavator">Excavator</SelectItem>
                  <SelectItem value="Crane">Crane</SelectItem>
                  <SelectItem value="Steel Reinforcement">Steel Reinforcement</SelectItem>
                  <SelectItem value="Cement">Cement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manpower">Manpower</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Material">Material</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Persons">Persons</SelectItem>
                  <SelectItem value="Units">Units</SelectItem>
                  <SelectItem value="Tons">Tons</SelectItem>
                  <SelectItem value="Cubic Meters">Cubic Meters</SelectItem>
                  <SelectItem value="Square Meters">Square Meters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="costPerUnit">Cost Per Unit</Label>
              <Input
                id="costPerUnit"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="Allocated">Allocated</SelectItem>
                  <SelectItem value="In Use">In Use</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Enter any remarks or notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)}>
              Add Resource Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resource Plan Details</DialogTitle>
            <DialogDescription>
              View detailed information about this resource plan.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Resource Name</Label>
                  <p className="text-sm font-medium">{selectedEntry.resourceName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Resource Type</Label>
                  <Badge className={getTypeColor(selectedEntry.resourceType)}>
                    {selectedEntry.resourceType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                  <p className="text-sm">{new Date(selectedEntry.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">End Date</Label>
                  <p className="text-sm">{new Date(selectedEntry.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Duration</Label>
                  <p className="text-sm">{calculateDuration(selectedEntry.startDate, selectedEntry.endDate)} days</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                  <p className="text-sm">{selectedEntry.quantity} {selectedEntry.unit}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cost Per Unit</Label>
                  <p className="text-sm">{formatCurrency(selectedEntry.costPerUnit)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total Cost</Label>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(selectedEntry.totalCost)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedEntry.status)}>
                    {selectedEntry.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created By</Label>
                  <p className="text-sm">{selectedEntry.createdBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedEntry.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Remarks</Label>
                <p className="text-sm mt-1">{selectedEntry.remarks}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 