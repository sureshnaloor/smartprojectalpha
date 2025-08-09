import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Eye,
  ChevronDown,
  ChevronRight,
  Target,
  TrendingUp,
  Minus
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

interface Task {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  startDate: string;
  endDate: string;
  progress: number;
  remarks: string;
}

interface Activity {
  id: string;
  name: string;
  category: 'backlog' | 'planned' | 'advanced';
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  progress: number;
  assignedTo: string;
  remarks: string;
  tasks: Task[];
  isExpanded?: boolean;
}

// Dummy data for the next 2 weeks
const dummyPlannedData: Activity[] = [
  {
    id: "act-1",
    name: "Foundation Excavation",
    category: "backlog",
    status: "not_started",
    priority: "high",
    startDate: "2024-01-10",
    endDate: "2024-01-15",
    progress: 0,
    assignedTo: "Civil Team",
    remarks: "Overdue by 5 days due to weather conditions",
    tasks: [
      {
        id: "task-1-1",
        name: "Site Survey and Marking",
        status: "not_started",
        priority: "high",
        assignedTo: "John Smith",
        startDate: "2024-01-10",
        endDate: "2024-01-11",
        progress: 0,
        remarks: "Pending site access approval"
      },
      {
        id: "task-1-2",
        name: "Excavation Work",
        status: "not_started",
        priority: "high",
        assignedTo: "Mike Wilson",
        startDate: "2024-01-12",
        endDate: "2024-01-15",
        progress: 0,
        remarks: "Requires heavy machinery"
      }
    ]
  },
  {
    id: "act-2",
    name: "Electrical Conduit Installation",
    category: "backlog",
    status: "in_progress",
    priority: "medium",
    startDate: "2024-01-08",
    endDate: "2024-01-14",
    progress: 30,
    assignedTo: "Electrical Team",
    remarks: "Started late due to material delays",
    tasks: [
      {
        id: "task-2-1",
        name: "Conduit Routing Design",
        status: "completed",
        priority: "medium",
        assignedTo: "Sarah Johnson",
        startDate: "2024-01-08",
        endDate: "2024-01-09",
        progress: 100,
        remarks: "Design approved by client"
      },
      {
        id: "task-2-2",
        name: "Conduit Installation",
        status: "in_progress",
        priority: "medium",
        assignedTo: "David Brown",
        startDate: "2024-01-10",
        endDate: "2024-01-14",
        progress: 40,
        remarks: "60% of conduits installed"
      }
    ]
  },
  {
    id: "act-3",
    name: "Mechanical Equipment Installation",
    category: "planned",
    status: "not_started",
    priority: "high",
    startDate: "2024-01-16",
    endDate: "2024-01-22",
    progress: 0,
    assignedTo: "Mechanical Team",
    remarks: "Scheduled as per original plan",
    tasks: [
      {
        id: "task-3-1",
        name: "Equipment Delivery",
        status: "not_started",
        priority: "high",
        assignedTo: "Lisa Chen",
        startDate: "2024-01-16",
        endDate: "2024-01-17",
        progress: 0,
        remarks: "Equipment arriving on 16th"
      },
      {
        id: "task-3-2",
        name: "Installation and Testing",
        status: "not_started",
        priority: "high",
        assignedTo: "Robert Davis",
        startDate: "2024-01-18",
        endDate: "2024-01-22",
        progress: 0,
        remarks: "Requires crane support"
      }
    ]
  },
  {
    id: "act-4",
    name: "HVAC Ductwork Installation",
    category: "planned",
    status: "not_started",
    priority: "medium",
    startDate: "2024-01-18",
    endDate: "2024-01-25",
    progress: 0,
    assignedTo: "HVAC Team",
    remarks: "Dependent on mechanical equipment installation",
    tasks: [
      {
        id: "task-4-1",
        name: "Ductwork Fabrication",
        status: "not_started",
        priority: "medium",
        assignedTo: "Tom Anderson",
        startDate: "2024-01-18",
        endDate: "2024-01-20",
        progress: 0,
        remarks: "Fabrication in progress off-site"
      },
      {
        id: "task-4-2",
        name: "Ductwork Installation",
        status: "not_started",
        priority: "medium",
        assignedTo: "Emma Wilson",
        startDate: "2024-01-21",
        endDate: "2024-01-25",
        progress: 0,
        remarks: "Will start after mechanical installation"
      }
    ]
  },
  {
    id: "act-5",
    name: "Instrumentation Calibration",
    category: "advanced",
    status: "not_started",
    priority: "low",
    startDate: "2024-01-20",
    endDate: "2024-01-26",
    progress: 0,
    assignedTo: "Instrumentation Team",
    remarks: "Advanced due to early completion of electrical work",
    tasks: [
      {
        id: "task-5-1",
        name: "Calibration Equipment Setup",
        status: "not_started",
        priority: "low",
        assignedTo: "Alex Turner",
        startDate: "2024-01-20",
        endDate: "2024-01-22",
        progress: 0,
        remarks: "Equipment available early"
      },
      {
        id: "task-5-2",
        name: "Instrument Calibration",
        status: "not_started",
        priority: "low",
        assignedTo: "Maria Garcia",
        startDate: "2024-01-23",
        endDate: "2024-01-26",
        progress: 0,
        remarks: "Can start early due to available resources"
      }
    ]
  },
  {
    id: "act-6",
    name: "Quality Control Testing",
    category: "advanced",
    status: "not_started",
    priority: "medium",
    startDate: "2024-01-22",
    endDate: "2024-01-28",
    progress: 0,
    assignedTo: "Quality Team",
    remarks: "Advanced due to early completion of mechanical work",
    tasks: [
      {
        id: "task-6-1",
        name: "Test Plan Preparation",
        status: "not_started",
        priority: "medium",
        assignedTo: "Quality Manager",
        startDate: "2024-01-22",
        endDate: "2024-01-23",
        progress: 0,
        remarks: "Test procedures ready"
      },
      {
        id: "task-6-2",
        name: "System Testing",
        status: "not_started",
        priority: "medium",
        assignedTo: "Test Engineers",
        startDate: "2024-01-24",
        endDate: "2024-01-28",
        progress: 0,
        remarks: "Will start after equipment installation"
      }
    ]
  }
];

export default function PlannedActivityTasks() {
  const params = useParams();
  const projectId = params.projectId;
  
  const [activities, setActivities] = useState<Activity[]>(dummyPlannedData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Filter activities based on search and filters
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || activity.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || activity.status === selectedStatus;
    const matchesPriority = selectedPriority === "all" || activity.priority === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  // Group activities by category
  const backlogActivities = filteredActivities.filter(a => a.category === 'backlog');
  const plannedActivities = filteredActivities.filter(a => a.category === 'planned');
  const advancedActivities = filteredActivities.filter(a => a.category === 'advanced');

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'backlog': return 'bg-red-100 text-red-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const toggleActivityExpansion = (activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, isExpanded: !activity.isExpanded }
        : activity
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'on_hold': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'backlog': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'planned': return <Target className="h-4 w-4 text-blue-600" />;
      case 'advanced': return <TrendingUp className="h-4 w-4 text-green-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planned Activity/Tasks</h1>
          <p className="text-gray-600">Next 2 weeks activity and task planning with backlog, planned, and advanced categories</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>
      </div>

      {/* Placeholder content */}
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Planned Activity/Tasks</h3>
          <p className="text-gray-600">This page will show activities planned for the next 2 weeks with three categories:</p>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>Backlog Activities (overdue)</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span>Planned Activities (on schedule)</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Advanced Activities (ahead of schedule)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search activities, tasks, or remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setSelectedPriority("all");
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
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Backlog Activities</p>
                <p className="text-2xl font-bold text-red-600">{backlogActivities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Planned Activities</p>
                <p className="text-2xl font-bold text-blue-600">{plannedActivities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Advanced Activities</p>
                <p className="text-2xl font-bold text-green-600">{advancedActivities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">
                  {filteredActivities.reduce((total, activity) => total + activity.tasks.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities by Category */}
      <div className="space-y-6">
        {/* Backlog Activities */}
        {backlogActivities.length > 0 && (
          <Card>
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Backlog Activities ({backlogActivities.length})
                <Badge variant="destructive" className="ml-2">Overdue</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-64">Activity</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-32">Priority</TableHead>
                    <TableHead className="w-32">Assigned To</TableHead>
                    <TableHead className="w-24">Start Date</TableHead>
                    <TableHead className="w-24">End Date</TableHead>
                    <TableHead className="w-24">Progress</TableHead>
                    <TableHead className="w-32">Tasks</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backlogActivities.map((activity) => (
                    <>
                      <TableRow key={activity.id} className="bg-red-50/30">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActivityExpansion(activity.id)}
                          >
                            {activity.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(activity.category)}
                            <span className="font-medium">{activity.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(activity.status)}>
                            {getStatusIcon(activity.status)}
                            <span className="ml-1">{activity.status.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(activity.priority)}>
                            {activity.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{activity.assignedTo}</TableCell>
                        <TableCell>{formatDate(activity.startDate)}</TableCell>
                        <TableCell>{formatDate(activity.endDate)}</TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{activity.progress}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{activity.tasks.length} tasks</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {activity.isExpanded && activity.tasks.map((task) => (
                        <TableRow key={task.id} className="bg-gray-50">
                          <TableCell></TableCell>
                          <TableCell className="pl-8">
                            <div className="flex items-center space-x-2">
                              <Minus className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{task.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusIcon(task.status)}
                              <span className="ml-1">{task.status.replace('_', ' ')}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{task.assignedTo}</TableCell>
                          <TableCell className="text-sm">{formatDate(task.startDate)}</TableCell>
                          <TableCell className="text-sm">{formatDate(task.endDate)}</TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{task.progress}%</span>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Planned Activities */}
        {plannedActivities.length > 0 && (
          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center text-blue-800">
                <Target className="h-5 w-5 mr-2" />
                Planned Activities ({plannedActivities.length})
                <Badge variant="secondary" className="ml-2">On Schedule</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-64">Activity</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-32">Priority</TableHead>
                    <TableHead className="w-32">Assigned To</TableHead>
                    <TableHead className="w-24">Start Date</TableHead>
                    <TableHead className="w-24">End Date</TableHead>
                    <TableHead className="w-24">Progress</TableHead>
                    <TableHead className="w-32">Tasks</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plannedActivities.map((activity) => (
                    <>
                      <TableRow key={activity.id} className="bg-blue-50/30">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActivityExpansion(activity.id)}
                          >
                            {activity.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(activity.category)}
                            <span className="font-medium">{activity.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(activity.status)}>
                            {getStatusIcon(activity.status)}
                            <span className="ml-1">{activity.status.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(activity.priority)}>
                            {activity.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{activity.assignedTo}</TableCell>
                        <TableCell>{formatDate(activity.startDate)}</TableCell>
                        <TableCell>{formatDate(activity.endDate)}</TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{activity.progress}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{activity.tasks.length} tasks</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {activity.isExpanded && activity.tasks.map((task) => (
                        <TableRow key={task.id} className="bg-gray-50">
                          <TableCell></TableCell>
                          <TableCell className="pl-8">
                            <div className="flex items-center space-x-2">
                              <Minus className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{task.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusIcon(task.status)}
                              <span className="ml-1">{task.status.replace('_', ' ')}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{task.assignedTo}</TableCell>
                          <TableCell className="text-sm">{formatDate(task.startDate)}</TableCell>
                          <TableCell className="text-sm">{formatDate(task.endDate)}</TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{task.progress}%</span>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Advanced Activities */}
        {advancedActivities.length > 0 && (
          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-green-800">
                <TrendingUp className="h-5 w-5 mr-2" />
                Advanced Activities ({advancedActivities.length})
                <Badge variant="secondary" className="ml-2">Ahead of Schedule</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-64">Activity</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-32">Priority</TableHead>
                    <TableHead className="w-32">Assigned To</TableHead>
                    <TableHead className="w-24">Start Date</TableHead>
                    <TableHead className="w-24">End Date</TableHead>
                    <TableHead className="w-24">Progress</TableHead>
                    <TableHead className="w-32">Tasks</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advancedActivities.map((activity) => (
                    <>
                      <TableRow key={activity.id} className="bg-green-50/30">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActivityExpansion(activity.id)}
                          >
                            {activity.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(activity.category)}
                            <span className="font-medium">{activity.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(activity.status)}>
                            {getStatusIcon(activity.status)}
                            <span className="ml-1">{activity.status.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(activity.priority)}>
                            {activity.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{activity.assignedTo}</TableCell>
                        <TableCell>{formatDate(activity.startDate)}</TableCell>
                        <TableCell>{formatDate(activity.endDate)}</TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${activity.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{activity.progress}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{activity.tasks.length} tasks</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {activity.isExpanded && activity.tasks.map((task) => (
                        <TableRow key={task.id} className="bg-gray-50">
                          <TableCell></TableCell>
                          <TableCell className="pl-8">
                            <div className="flex items-center space-x-2">
                              <Minus className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{task.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusIcon(task.status)}
                              <span className="ml-1">{task.status.replace('_', ' ')}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{task.assignedTo}</TableCell>
                          <TableCell className="text-sm">{formatDate(task.startDate)}</TableCell>
                          <TableCell className="text-sm">{formatDate(task.endDate)}</TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{task.progress}%</span>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 