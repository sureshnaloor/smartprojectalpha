import { useState } from "react";
import { useParams } from "wouter";
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Calendar,
  BookOpen,
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
  Award
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

interface LessonLearntEntry {
  id: string;
  category: 'Design' | 'Engineering' | 'Construction' | 'Installation' | 'Testing' | 'Pre-commissioning' | 'Commissioning' | 'Procurement' | 'Subcontracts' | 'Quality' | 'Safety' | 'Others';
  lesson: string;
  type: 'Risk' | 'Opportunity';
  dateLogged: string;
  loggedBy: string;
  documents: string[];
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  description: string;
  recommendations: string;
  actionsTaken: string;
  lastUpdated: string;
}

// Dummy data
const dummyLessonLearntData: LessonLearntEntry[] = [
  {
    id: "1",
    category: "Construction",
    lesson: "Foundation depth requirements were underestimated in initial design",
    type: "Risk",
    dateLogged: "2024-01-15",
    loggedBy: "John Smith",
    documents: ["Foundation_Design_Review.pdf", "Soil_Test_Report.pdf"],
    status: "Resolved",
    impact: "High",
    priority: "High",
    description: "During foundation excavation, it was discovered that the soil conditions required deeper foundations than initially designed. This caused a 2-week delay and additional costs.",
    recommendations: "Conduct comprehensive soil testing before design finalization. Include contingency in project timeline for foundation variations.",
    actionsTaken: "Revised foundation design, updated project schedule, allocated additional budget for foundation work.",
    lastUpdated: "2024-01-20"
  },
  {
    id: "2",
    category: "Engineering",
    lesson: "Modular construction approach reduced installation time by 40%",
    type: "Opportunity",
    dateLogged: "2024-02-01",
    loggedBy: "Sarah Johnson",
    documents: ["Modular_Construction_Report.pdf", "Installation_Time_Comparison.xlsx"],
    status: "Closed",
    impact: "High",
    priority: "Medium",
    description: "Implementing modular construction for electrical panels significantly reduced on-site installation time and improved quality control.",
    recommendations: "Consider modular construction approach for future projects. Standardize modular components across projects.",
    actionsTaken: "Documented modular construction process, created standard specifications for future projects.",
    lastUpdated: "2024-02-10"
  },
  {
    id: "3",
    category: "Procurement",
    lesson: "Early supplier engagement prevented material shortages",
    type: "Opportunity",
    dateLogged: "2024-01-20",
    loggedBy: "Mike Wilson",
    documents: ["Supplier_Engagement_Plan.pdf", "Material_Delivery_Schedule.pdf"],
    status: "Closed",
    impact: "Medium",
    priority: "Medium",
    description: "Early engagement with key suppliers helped secure critical materials and prevented potential delays.",
    recommendations: "Establish early supplier relationships in future projects. Maintain regular communication with suppliers.",
    actionsTaken: "Created supplier engagement checklist, updated procurement procedures.",
    lastUpdated: "2024-01-25"
  },
  {
    id: "4",
    category: "Safety",
    lesson: "New safety protocol prevented potential accident during crane operations",
    type: "Risk",
    dateLogged: "2024-02-15",
    loggedBy: "Lisa Chen",
    documents: ["Safety_Protocol_Update.pdf", "Crane_Operation_Guidelines.pdf"],
    status: "In Progress",
    impact: "Critical",
    priority: "Urgent",
    description: "A near-miss incident during crane operations led to the development of enhanced safety protocols.",
    recommendations: "Implement enhanced safety protocols across all crane operations. Conduct regular safety training.",
    actionsTaken: "Updated crane operation procedures, scheduled safety training sessions.",
    lastUpdated: "2024-02-18"
  },
  {
    id: "5",
    category: "Quality",
    lesson: "Quality control checkpoints improved final product reliability",
    type: "Opportunity",
    dateLogged: "2024-01-30",
    loggedBy: "David Brown",
    documents: ["Quality_Control_Procedures.pdf", "Inspection_Checklist.pdf"],
    status: "Closed",
    impact: "High",
    priority: "High",
    description: "Implementing additional quality control checkpoints resulted in improved product reliability and reduced rework.",
    recommendations: "Standardize quality control procedures across all project phases. Include quality checkpoints in project planning.",
    actionsTaken: "Documented quality control procedures, created standardized inspection checklists.",
    lastUpdated: "2024-02-05"
  }
];

export default function LessonLearntRegister() {
  const params = useParams();
  const projectId = params.projectId;
  
  const [lessonLearntEntries, setLessonLearntEntries] = useState<LessonLearntEntry[]>(dummyLessonLearntData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterImpact, setFilterImpact] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LessonLearntEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Filter entries based on search and filters
  const filteredEntries = lessonLearntEntries.filter(entry => {
    const matchesSearch = entry.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.loggedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || entry.category === filterCategory;
    const matchesType = filterType === "all" || entry.type === filterType;
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
    const matchesImpact = filterImpact === "all" || entry.impact === filterImpact;
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesImpact;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Closed': return 'bg-green-100 text-green-800';
      case 'Resolved': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Open': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Risk': return 'bg-red-100 text-red-800';
      case 'Opportunity': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lesson Learnt Register</h1>
          <p className="text-gray-600">Capture and manage lessons learnt from project experiences</p>
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
            Add Lesson Learnt
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search lessons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Installation">Installation</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Pre-commissioning">Pre-commissioning</SelectItem>
                  <SelectItem value="Commissioning">Commissioning</SelectItem>
                  <SelectItem value="Procurement">Procurement</SelectItem>
                  <SelectItem value="Subcontracts">Subcontracts</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Risk">Risk</SelectItem>
                  <SelectItem value="Opportunity">Opportunity</SelectItem>
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
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="impact">Impact</Label>
              <Select value={filterImpact} onValueChange={setFilterImpact}>
                <SelectTrigger>
                  <SelectValue placeholder="All Impact Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impact Levels</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("all");
                  setFilterType("all");
                  setFilterStatus("all");
                  setFilterImpact("all");
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
              <BookOpen className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Lessons</p>
                <p className="text-2xl font-bold">{lessonLearntEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Risks</p>
                <p className="text-2xl font-bold">{lessonLearntEntries.filter(l => l.type === 'Risk').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold">{lessonLearntEntries.filter(l => l.type === 'Opportunity').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold">{lessonLearntEntries.filter(l => l.status === 'Resolved' || l.status === 'Closed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lesson Learnt Entries */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>Lesson Learnt Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Category</TableHead>
                    <TableHead className="w-32">Lesson</TableHead>
                    <TableHead className="w-20">Type</TableHead>
                    <TableHead className="w-20">Date</TableHead>
                    <TableHead className="w-20">Logged By</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-16">Impact</TableHead>
                    <TableHead className="w-20">Documents</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge className="text-xs">
                          {entry.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32">
                          <p className="font-medium truncate text-xs">{entry.lesson}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTypeColor(entry.type)} text-xs`}>
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(entry.dateLogged)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.loggedBy}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(entry.status)} text-xs`}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getImpactColor(entry.impact)} text-xs`}>
                          {entry.impact}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {entry.documents.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title={`${entry.documents.length} document(s)`}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
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
                    <CardTitle className="text-lg">{entry.lesson}</CardTitle>
                    <p className="text-sm text-gray-600">{entry.category}</p>
                  </div>
                  <Badge className={getTypeColor(entry.type)}>
                    {entry.type}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(entry.dateLogged)} • {entry.loggedBy}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Status</Label>
                    <Badge className={`${getStatusColor(entry.status)} text-xs`}>
                      {entry.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Impact</Label>
                    <Badge className={`${getImpactColor(entry.impact)} text-xs`}>
                      {entry.impact}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-sm text-gray-600 truncate">{entry.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {entry.documents.length > 0 ? (
                      <span className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {entry.documents.length} doc(s)
                      </span>
                    ) : (
                      <span>No documents</span>
                    )}
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

      {/* Add Lesson Learnt Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Lesson Learnt</DialogTitle>
            <DialogDescription>
              Capture a lesson learnt from project experience.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Installation">Installation</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Pre-commissioning">Pre-commissioning</SelectItem>
                  <SelectItem value="Commissioning">Commissioning</SelectItem>
                  <SelectItem value="Procurement">Procurement</SelectItem>
                  <SelectItem value="Subcontracts">Subcontracts</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type">Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Risk">Risk</SelectItem>
                  <SelectItem value="Opportunity">Opportunity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateLogged">Date Logged</Label>
              <Input
                id="dateLogged"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="loggedBy">Logged By</Label>
              <Input
                id="loggedBy"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <Label htmlFor="impact">Impact</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select impact level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="lesson">Lesson Learnt</Label>
              <Input
                id="lesson"
                placeholder="Brief description of the lesson learnt"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed description of the lesson learnt..."
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                placeholder="What should be done differently in the future?"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="actionsTaken">Actions Taken</Label>
              <Textarea
                id="actionsTaken"
                placeholder="What actions were taken to address this lesson?"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="documents">Related Documents</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="documents"
                  placeholder="Document name or link"
                />
                <Button variant="outline" size="sm">
                  <Link className="h-4 w-4 mr-2" />
                  Link Document
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Link to documents in Project Documents section
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)}>
              Add Lesson Learnt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Lesson Learnt Details</DialogTitle>
            <DialogDescription>
              View detailed information about this lesson learnt.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <Badge className="mt-1">{selectedEntry.category}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Type</Label>
                  <Badge className={`${getTypeColor(selectedEntry.type)} mt-1`}>
                    {selectedEntry.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date Logged</Label>
                  <p className="text-sm mt-1">{formatDate(selectedEntry.dateLogged)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Logged By</Label>
                  <p className="text-sm mt-1">{selectedEntry.loggedBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={`${getStatusColor(selectedEntry.status)} mt-1`}>
                    {selectedEntry.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Impact</Label>
                  <Badge className={`${getImpactColor(selectedEntry.impact)} mt-1`}>
                    {selectedEntry.impact}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Priority</Label>
                  <Badge className={`${getPriorityColor(selectedEntry.priority)} mt-1`}>
                    {selectedEntry.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm mt-1">{formatDate(selectedEntry.lastUpdated)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Lesson Learnt</Label>
                <p className="text-sm font-medium mt-1">{selectedEntry.lesson}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="text-sm mt-1">{selectedEntry.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Recommendations</Label>
                <p className="text-sm mt-1">{selectedEntry.recommendations}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Actions Taken</Label>
                <p className="text-sm mt-1">{selectedEntry.actionsTaken}</p>
              </div>

              {selectedEntry.documents.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Related Documents</Label>
                  <div className="mt-2 space-y-2">
                    {selectedEntry.documents.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{doc}</span>
                        <Button variant="ghost" size="sm">
                          <Link className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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