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
  RotateCcw
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

interface ManpowerPosition {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

interface ManpowerEntry {
  id: string;
  date: string;
  positions: { [positionId: string]: number };
  totalManpower: number;
  remarks: string;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
}

// Available positions from resource master
const availablePositions: ManpowerPosition[] = [
  { id: "mason", name: "Mason", order: 1, isActive: true },
  { id: "carpenter", name: "Carpenter", order: 2, isActive: true },
  { id: "helper", name: "Helper", order: 3, isActive: true },
  { id: "electrical_technician", name: "Electrical Technician", order: 4, isActive: true },
  { id: "instrument_technician", name: "Instrument Technician", order: 5, isActive: true },
  { id: "hvac_technician", name: "HVAC Technician", order: 6, isActive: true },
  { id: "plumber", name: "Plumber", order: 7, isActive: true },
  { id: "welder", name: "Welder", order: 8, isActive: true },
  { id: "painter", name: "Painter", order: 9, isActive: true },
  { id: "operator", name: "Equipment Operator", order: 10, isActive: true },
  { id: "supervisor", name: "Supervisor", order: 11, isActive: true },
  { id: "foreman", name: "Foreman", order: 12, isActive: true },
  { id: "engineer", name: "Engineer", order: 13, isActive: false },
  { id: "architect", name: "Architect", order: 14, isActive: false },
  { id: "surveyor", name: "Surveyor", order: 15, isActive: false },
  { id: "safety_officer", name: "Safety Officer", order: 16, isActive: false },
  { id: "quality_controller", name: "Quality Controller", order: 17, isActive: false },
];

// Dummy data
const dummyManpowerData: ManpowerEntry[] = [
  {
    id: "1",
    date: "2024-01-15",
    positions: {
      "mason": 5,
      "carpenter": 3,
      "helper": 20,
      "electrical_technician": 2,
      "instrument_technician": 3,
      "hvac_technician": 1,
      "plumber": 2,
      "welder": 4,
      "painter": 3,
      "operator": 2,
      "supervisor": 1,
      "foreman": 2
    },
    totalManpower: 48,
    remarks: "Foundation work in progress, additional helpers required for material handling",
    createdBy: "John Smith",
    createdAt: "2024-01-14",
    lastUpdated: "2024-01-15"
  },
  {
    id: "2",
    date: "2024-01-16",
    positions: {
      "mason": 6,
      "carpenter": 4,
      "helper": 25,
      "electrical_technician": 3,
      "instrument_technician": 4,
      "hvac_technician": 2,
      "plumber": 3,
      "welder": 5,
      "painter": 4,
      "operator": 3,
      "supervisor": 2,
      "foreman": 3
    },
    totalManpower: 61,
    remarks: "Increased manpower for structural work and electrical installations",
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-15",
    lastUpdated: "2024-01-16"
  },
  {
    id: "3",
    date: "2024-01-17",
    positions: {
      "mason": 4,
      "carpenter": 5,
      "helper": 18,
      "electrical_technician": 4,
      "instrument_technician": 5,
      "hvac_technician": 3,
      "plumber": 4,
      "welder": 3,
      "painter": 5,
      "operator": 2,
      "supervisor": 1,
      "foreman": 2
    },
    totalManpower: 60,
    remarks: "Focus on finishing work and installations",
    createdBy: "Mike Wilson",
    createdAt: "2024-01-16",
    lastUpdated: "2024-01-17"
  },
  {
    id: "4",
    date: "2024-01-18",
    positions: {
      "mason": 3,
      "carpenter": 3,
      "helper": 15,
      "electrical_technician": 5,
      "instrument_technician": 6,
      "hvac_technician": 4,
      "plumber": 5,
      "welder": 2,
      "painter": 6,
      "operator": 1,
      "supervisor": 1,
      "foreman": 1
    },
    totalManpower: 51,
    remarks: "Electrical and instrumentation work priority",
    createdBy: "Lisa Chen",
    createdAt: "2024-01-17",
    lastUpdated: "2024-01-18"
  },
  {
    id: "5",
    date: "2024-01-19",
    positions: {
      "mason": 2,
      "carpenter": 2,
      "helper": 12,
      "electrical_technician": 6,
      "instrument_technician": 7,
      "hvac_technician": 5,
      "plumber": 6,
      "welder": 1,
      "painter": 7,
      "operator": 1,
      "supervisor": 1,
      "foreman": 1
    },
    totalManpower: 49,
    remarks: "Final installation and commissioning phase",
    createdBy: "David Brown",
    createdAt: "2024-01-18",
    lastUpdated: "2024-01-19"
  }
];

export default function DirectManpowerList() {
  const params = useParams();
  const projectId = params.projectId;
  
  const [manpowerEntries, setManpowerEntries] = useState<ManpowerEntry[]>(dummyManpowerData);
  const [positions, setPositions] = useState<ManpowerPosition[]>(availablePositions);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ManpowerEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Get active positions sorted by order
  const activePositions = positions.filter(p => p.isActive).sort((a, b) => a.order - b.order);

  // Filter entries based on search
  const filteredEntries = manpowerEntries.filter(entry => {
    const matchesSearch = entry.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate totals for each position
  const getPositionTotal = (positionId: string) => {
    return manpowerEntries.reduce((total, entry) => total + (entry.positions[positionId] || 0), 0);
  };

  // Calculate overall total
  const getOverallTotal = () => {
    return manpowerEntries.reduce((total, entry) => total + entry.totalManpower, 0);
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

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Direct Manpower List</h1>
          <p className="text-gray-600">Manage daily manpower allocation by position</p>
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
            Add Manpower Entry
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
                <p className="text-2xl font-bold">{manpowerEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Manpower</p>
                <p className="text-2xl font-bold">{getOverallTotal()}</p>
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
                  {manpowerEntries.length > 0 ? Math.round(getOverallTotal() / manpowerEntries.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manpower Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Manpower Allocation</CardTitle>
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
                              {entry.positions[position.id] || 0}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="text-center border-r w-28">
                          <div className="text-xs font-bold text-blue-600">
                            {entry.totalManpower}
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
                            {getPositionTotal(position.id)}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-center border-r w-28">
                        <div className="text-xs font-bold text-blue-600">
                          {getOverallTotal()}
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

      {/* Add Manpower Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Add New Manpower Entry</DialogTitle>
            <DialogDescription>
              Add daily manpower allocation for all positions.
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
              <Label className="text-sm font-medium">Manpower Allocation</Label>
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
            <DialogTitle>Manpower Entry Details</DialogTitle>
            <DialogDescription>
              View detailed information about this manpower entry.
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
                  <Label className="text-sm font-medium text-gray-500">Total Manpower</Label>
                  <p className="text-sm font-bold text-blue-600">{selectedEntry.totalManpower}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">{formatDate(selectedEntry.lastUpdated)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Manpower Allocation</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {activePositions.map((position) => (
                    <div key={position.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{position.name}</span>
                      <span className="text-sm font-bold text-blue-600">
                        {selectedEntry.positions[position.id] || 0}
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