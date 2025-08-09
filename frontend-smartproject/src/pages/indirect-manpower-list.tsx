import { useState, useEffect } from "react";
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
  FileText,
  Link,
  User,
  CalendarDays,
  AlertCircle,
  Lightbulb,
  Award,
  GripVertical,
  Settings,
  Save,
  RotateCcw,
  Percent
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface IndirectManpowerPosition {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

interface IndirectManpowerEntry {
  id: string;
  date: string;
  positions: { [positionId: string]: number }; // Percentage values (0-100)
  totalOverhead: number;
  remarks: string;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
}

// Available indirect positions
const availableIndirectPositions: IndirectManpowerPosition[] = [
  { id: "project_manager", name: "Project Manager", order: 1, isActive: true },
  { id: "project_engineer", name: "Project Engineer", order: 2, isActive: true },
  { id: "planner", name: "Planner", order: 3, isActive: true },
  { id: "admin_staff", name: "Admin Staff", order: 4, isActive: true },
  { id: "purchasing_engineer", name: "Purchasing Engineer", order: 5, isActive: true },
  { id: "supply_chain_staff", name: "Supply Chain Staff", order: 6, isActive: true },
  { id: "hr_staff", name: "HR Staff", order: 7, isActive: true },
  { id: "it_staff", name: "IT Staff", order: 8, isActive: true },
  { id: "portfolio_manager", name: "Portfolio Manager", order: 9, isActive: true },
  { id: "quality_manager", name: "Quality Manager", order: 10, isActive: true },
  { id: "safety_manager", name: "Safety Manager", order: 11, isActive: true },
  { id: "finance_staff", name: "Finance Staff", order: 12, isActive: true },
  { id: "legal_staff", name: "Legal Staff", order: 13, isActive: false },
  { id: "marketing_staff", name: "Marketing Staff", order: 14, isActive: false },
  { id: "business_analyst", name: "Business Analyst", order: 15, isActive: false },
  { id: "contract_manager", name: "Contract Manager", order: 16, isActive: false },
];

// Dummy data with percentage values
const dummyIndirectManpowerData: IndirectManpowerEntry[] = [
  {
    id: "1",
    date: "2024-01-15",
    positions: {
      "project_manager": 25,
      "project_engineer": 30,
      "planner": 20,
      "admin_staff": 15,
      "purchasing_engineer": 10,
      "supply_chain_staff": 8,
      "hr_staff": 5,
      "it_staff": 3,
      "portfolio_manager": 15,
      "quality_manager": 12,
      "safety_manager": 8,
      "finance_staff": 10
    },
    totalOverhead: 161,
    remarks: "Initial project setup phase, high overhead allocation for planning and management",
    createdBy: "John Smith",
    createdAt: "2024-01-14",
    lastUpdated: "2024-01-15"
  },
  {
    id: "2",
    date: "2024-01-16",
    positions: {
      "project_manager": 20,
      "project_engineer": 35,
      "planner": 25,
      "admin_staff": 12,
      "purchasing_engineer": 15,
      "supply_chain_staff": 12,
      "hr_staff": 4,
      "it_staff": 3,
      "portfolio_manager": 10,
      "quality_manager": 15,
      "safety_manager": 10,
      "finance_staff": 8
    },
    totalOverhead: 169,
    remarks: "Construction phase begins, increased engineering and planning overhead",
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-15",
    lastUpdated: "2024-01-16"
  },
  {
    id: "3",
    date: "2024-01-17",
    positions: {
      "project_manager": 18,
      "project_engineer": 40,
      "planner": 30,
      "admin_staff": 10,
      "purchasing_engineer": 18,
      "supply_chain_staff": 15,
      "hr_staff": 3,
      "it_staff": 2,
      "portfolio_manager": 8,
      "quality_manager": 18,
      "safety_manager": 12,
      "finance_staff": 6
    },
    totalOverhead: 180,
    remarks: "Peak construction activity, maximum overhead allocation",
    createdBy: "Mike Wilson",
    createdAt: "2024-01-16",
    lastUpdated: "2024-01-17"
  },
  {
    id: "4",
    date: "2024-01-18",
    positions: {
      "project_manager": 15,
      "project_engineer": 35,
      "planner": 25,
      "admin_staff": 8,
      "purchasing_engineer": 12,
      "supply_chain_staff": 10,
      "hr_staff": 3,
      "it_staff": 2,
      "portfolio_manager": 6,
      "quality_manager": 20,
      "safety_manager": 15,
      "finance_staff": 5
    },
    totalOverhead: 151,
    remarks: "Quality and safety focus, reduced management overhead",
    createdBy: "Lisa Chen",
    createdAt: "2024-01-17",
    lastUpdated: "2024-01-18"
  },
  {
    id: "5",
    date: "2024-01-19",
    positions: {
      "project_manager": 12,
      "project_engineer": 30,
      "planner": 20,
      "admin_staff": 6,
      "purchasing_engineer": 8,
      "supply_chain_staff": 6,
      "hr_staff": 2,
      "it_staff": 2,
      "portfolio_manager": 5,
      "quality_manager": 25,
      "safety_manager": 20,
      "finance_staff": 4
    },
    totalOverhead: 140,
    remarks: "Final phase, reduced overhead as project nears completion",
    createdBy: "David Brown",
    createdAt: "2024-01-18",
    lastUpdated: "2024-01-19"
  }
];

export default function IndirectManpowerList() {
  const params = useParams();
  const projectId = params.projectId;
  
  const [indirectManpowerEntries, setIndirectManpowerEntries] = useState<IndirectManpowerEntry[]>(dummyIndirectManpowerData);
  const [positions, setPositions] = useState<IndirectManpowerPosition[]>(availableIndirectPositions);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<IndirectManpowerEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Get active positions sorted by order
  const activePositions = positions.filter(p => p.isActive).sort((a, b) => a.order - b.order);

  // Filter entries based on search
  const filteredEntries = indirectManpowerEntries.filter(entry => {
    const matchesSearch = entry.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate totals for each position
  const getPositionTotal = (positionId: string) => {
    return indirectManpowerEntries.reduce((total, entry) => total + (entry.positions[positionId] || 0), 0);
  };

  // Calculate overall total
  const getOverallTotal = () => {
    return indirectManpowerEntries.reduce((total, entry) => total + entry.totalOverhead, 0);
  };

  // Handle column drag and drop
  const handleColumnDragStart = (e: React.DragEvent, positionId: string) => {
    setDraggedColumn(positionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', positionId);
  };

  const handleColumnDragOver = (e: React.DragEvent, positionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(positionId);
  };

  const handleColumnDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleColumnDrop = (e: React.DragEvent, targetPositionId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetPositionId) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const draggedPos = positions.find(p => p.id === draggedColumn);
    const targetPos = positions.find(p => p.id === targetPositionId);
    
    if (draggedPos && targetPos) {
      // Create new positions array with updated order
      const newPositions = positions.map(p => {
        if (p.id === draggedColumn) {
          return { ...p, order: targetPos.order };
        } else if (p.id === targetPositionId) {
          return { ...p, order: draggedPos.order };
        }
        return p;
      });
      
      // Reorder all positions to ensure sequential ordering
      const reorderedPositions = newPositions
        .sort((a, b) => a.order - b.order)
        .map((p, index) => ({
          ...p,
          order: index + 1
        }));
      
      setPositions(reorderedPositions);
    }
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const togglePositionVisibility = (positionId: string) => {
    setPositions(prev => prev.map(p => 
      p.id === positionId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Indirect Manpower List</h1>
          <p className="text-gray-600">Manage daily overhead allocation by position (percentage-based)</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsColumnSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Column Settings
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Overhead Entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search remarks or created by..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
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
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="text-2xl font-bold">{indirectManpowerEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Percent className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Overhead</p>
                <p className="text-2xl font-bold">{getOverallTotal()}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Positions</p>
                <p className="text-2xl font-bold">{activePositions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Daily</p>
                <p className="text-2xl font-bold">
                  {indirectManpowerEntries.length > 0 ? Math.round(getOverallTotal() / indirectManpowerEntries.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indirect Manpower Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Overhead Allocation</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto" style={{ maxWidth: 'calc(100vw - 300px)' }}>
            <div className="min-w-max" style={{ minWidth: `${(activePositions.length + 5) * 112 + 96}px` }}>
              <div className="overflow-hidden border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 sticky left-0 bg-white z-10 border-r">
                        <div className="text-xs font-medium">Date</div>
                      </TableHead>
                      {activePositions.map((position) => (
                        <TableHead 
                          key={position.id}
                          className={`w-28 cursor-move border-r ${
                            draggedColumn === position.id ? 'bg-blue-100' : ''
                          } ${
                            dragOverColumn === position.id ? 'bg-green-100' : ''
                          }`}
                          draggable
                          onDragStart={(e) => handleColumnDragStart(e, position.id)}
                          onDragOver={(e) => handleColumnDragOver(e, position.id)}
                          onDragLeave={handleColumnDragLeave}
                          onDrop={(e) => handleColumnDrop(e, position.id)}
                        >
                          <div className="flex items-center justify-between p-1">
                            <span className="text-xs font-medium leading-tight break-words min-w-0 flex-1">
                              {position.name}
                            </span>
                            <GripVertical className="h-3 w-3 text-gray-400 flex-shrink-0 ml-1" />
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-28 border-r">
                        <div className="text-xs font-medium">Total</div>
                      </TableHead>
                      <TableHead className="w-32 border-r">
                        <div className="text-xs font-medium">Remarks</div>
                      </TableHead>
                      <TableHead className="w-28 border-r">
                        <div className="text-xs font-medium">Created By</div>
                      </TableHead>
                      <TableHead className="w-20">
                        <div className="text-xs font-medium">Actions</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="sticky left-0 bg-white z-10 border-r">
                          <div className="text-xs font-medium">
                            {formatDate(entry.date)}
                          </div>
                        </TableCell>
                        {activePositions.map((position) => (
                          <TableCell key={position.id} className="text-center border-r w-28">
                            <div className="text-xs font-medium">
                              {formatPercentage(entry.positions[position.id] || 0)}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="text-center border-r w-28">
                          <div className="text-xs font-bold text-blue-600">
                            {formatPercentage(entry.totalOverhead)}
                          </div>
                        </TableCell>
                        <TableCell className="border-r w-32">
                          <div className="max-w-32">
                            <p className="text-xs text-gray-600 truncate">
                              {entry.remarks}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs border-r w-28">
                          {entry.createdBy}
                        </TableCell>
                        <TableCell className="w-20">
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
                    {/* Totals Row */}
                    <TableRow className="bg-gray-50">
                      <TableCell className="sticky left-0 bg-gray-50 z-10 border-r">
                        <div className="text-xs font-bold">TOTAL</div>
                      </TableCell>
                      {activePositions.map((position) => (
                        <TableCell key={position.id} className="text-center border-r w-28">
                          <div className="text-xs font-bold text-green-600">
                            {formatPercentage(getPositionTotal(position.id))}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-center border-r w-28">
                        <div className="text-xs font-bold text-blue-600">
                          {formatPercentage(getOverallTotal())}
                        </div>
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Overhead Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Add New Overhead Entry</DialogTitle>
            <DialogDescription>
              Add daily overhead allocation for all positions (percentage-based).
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <Label htmlFor="createdBy">Created By</Label>
              <Input
                id="createdBy"
                placeholder="Enter your name"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Enter any remarks or notes..."
                rows={2}
              />
            </div>

            {/* Position inputs */}
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Overhead Allocation (%)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {activePositions.map((position) => (
                  <div key={position.id}>
                    <Label htmlFor={position.id} className="text-xs">
                      {position.name}
                    </Label>
                    <Input
                      id={position.id}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)}>
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Overhead Entry Details</DialogTitle>
            <DialogDescription>
              View detailed information about this overhead entry.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date</Label>
                  <p className="text-sm font-medium">{formatDate(selectedEntry.date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created By</Label>
                  <p className="text-sm">{selectedEntry.createdBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total Overhead</Label>
                  <p className="text-sm font-bold text-blue-600">{formatPercentage(selectedEntry.totalOverhead)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">{formatDate(selectedEntry.lastUpdated)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Overhead Allocation</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {activePositions.map((position) => (
                    <div key={position.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{position.name}</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatPercentage(selectedEntry.positions[position.id] || 0)}
                      </span>
                    </div>
                  ))}
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

      {/* Column Settings Dialog */}
      <Dialog open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Column Settings</DialogTitle>
            <DialogDescription>
              Manage which position columns are visible and their order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {positions.map((position) => (
                <div key={position.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={position.isActive}
                      onChange={() => togglePositionVisibility(position.id)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{position.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      Order: {position.order}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsColumnSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsColumnSettingsOpen(false)}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 