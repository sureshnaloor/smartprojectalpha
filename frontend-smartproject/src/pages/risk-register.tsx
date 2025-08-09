import { useState } from "react";
import { useParams } from "wouter";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  Eye
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RiskEntry {
  id: string;
  dateLogged: string;
  risk: string;
  riskType: 'Risk' | 'Opportunity';
  probability: 'High' | 'Moderate' | 'Low';
  impact: 'High' | 'Moderate' | 'Low';
  userLogged: string;
  actionTaken: string;
  remarks: string;
  status: 'Open' | 'In Progress' | 'Closed';
  lastUpdated: string;
}

// Dummy data
const dummyRiskData: RiskEntry[] = [
  {
    id: "1",
    dateLogged: "2024-01-15",
    risk: "Delay in material delivery due to supplier issues",
    riskType: "Risk",
    probability: "High",
    impact: "High",
    userLogged: "John Smith",
    actionTaken: "Contacted alternative suppliers and expedited shipping",
    remarks: "Critical path activity affected. Monitoring daily progress.",
    status: "In Progress",
    lastUpdated: "2024-01-20"
  },
  {
    id: "2",
    dateLogged: "2024-01-10",
    risk: "Opportunity to use new construction technology",
    riskType: "Opportunity",
    probability: "Moderate",
    impact: "High",
    userLogged: "Sarah Johnson",
    actionTaken: "Researching technology feasibility and cost-benefit analysis",
    remarks: "Could reduce construction time by 15% if implemented.",
    status: "Open",
    lastUpdated: "2024-01-18"
  },
  {
    id: "3",
    dateLogged: "2024-01-08",
    risk: "Weather conditions affecting outdoor work",
    riskType: "Risk",
    probability: "Low",
    impact: "Moderate",
    userLogged: "Mike Wilson",
    actionTaken: "Rescheduled outdoor activities and added weather monitoring",
    remarks: "Contingency plan in place for rain delays.",
    status: "Closed",
    lastUpdated: "2024-01-12"
  },
  {
    id: "4",
    dateLogged: "2024-01-05",
    risk: "Skilled labor shortage in the region",
    riskType: "Risk",
    probability: "High",
    impact: "High",
    userLogged: "Lisa Chen",
    actionTaken: "Started recruitment process and training programs",
    remarks: "Working with local training institutes to develop skilled workforce.",
    status: "In Progress",
    lastUpdated: "2024-01-19"
  },
  {
    id: "5",
    dateLogged: "2024-01-03",
    risk: "Opportunity for bulk material purchase discount",
    riskType: "Opportunity",
    probability: "Moderate",
    impact: "Moderate",
    userLogged: "David Brown",
    actionTaken: "Negotiating with suppliers for volume discounts",
    remarks: "Potential 10% cost savings on major materials.",
    status: "Open",
    lastUpdated: "2024-01-16"
  }
];

export default function RiskRegister() {
  const params = useParams();
  const projectId = params.projectId;
  
  const [risks, setRisks] = useState<RiskEntry[]>(dummyRiskData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProbability, setFilterProbability] = useState<string>("all");
  const [filterImpact, setFilterImpact] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Filter risks based on search and filters
  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.risk.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.userLogged.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || risk.riskType === filterType;
    const matchesProbability = filterProbability === "all" || risk.probability === filterProbability;
    const matchesImpact = filterImpact === "all" || risk.impact === filterImpact;
    const matchesStatus = filterStatus === "all" || risk.status === filterStatus;
    
    return matchesSearch && matchesType && matchesProbability && matchesImpact && matchesStatus;
  });

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskTypeColor = (type: string) => {
    return type === 'Risk' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Register</h1>
          <p className="text-gray-600">Manage project risks and opportunities</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Risk/Opportunity
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
                  placeholder="Search risks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
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
              <Label htmlFor="probability">Probability</Label>
              <Select value={filterProbability} onValueChange={setFilterProbability}>
                <SelectTrigger>
                  <SelectValue placeholder="All Probabilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Probabilities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="impact">Impact</Label>
              <Select value={filterImpact} onValueChange={setFilterImpact}>
                <SelectTrigger>
                  <SelectValue placeholder="All Impacts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impacts</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
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
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterProbability("all");
                  setFilterImpact("all");
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
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Risks</p>
                <p className="text-2xl font-bold">{risks.filter(r => r.riskType === 'Risk').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold">{risks.filter(r => r.riskType === 'Opportunity').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Open Items</p>
                <p className="text-2xl font-bold">{risks.filter(r => r.status === 'Open').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Closed Items</p>
                <p className="text-2xl font-bold">{risks.filter(r => r.status === 'Closed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Table */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Register Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Logged</TableHead>
                  <TableHead>Risk/Opportunity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRisks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">
                      {new Date(risk.dateLogged).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{risk.risk}</p>
                        <p className="text-sm text-gray-500 truncate">{risk.actionTaken}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskTypeColor(risk.riskType)}>
                        {risk.riskType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getProbabilityColor(risk.probability)}>
                        {risk.probability}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getImpactColor(risk.impact)}>
                        {risk.impact}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {risk.userLogged}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(risk.status)}>
                        {risk.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRisk(risk);
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Risk Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Risk/Opportunity</DialogTitle>
            <DialogDescription>
              Log a new risk or opportunity for the project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateLogged">Date Logged</Label>
              <Input
                id="dateLogged"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <Label htmlFor="riskType">Type</Label>
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

            <div className="md:col-span-2">
              <Label htmlFor="risk">Risk/Opportunity Description</Label>
              <Textarea
                id="risk"
                placeholder="Describe the risk or opportunity..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="probability">Probability</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select probability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="impact">Impact</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userLogged">User Logged</Label>
              <Input
                id="userLogged"
                placeholder="Enter user name"
              />
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
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="actionTaken">Action Taken</Label>
              <Textarea
                id="actionTaken"
                placeholder="Describe actions taken or planned..."
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Additional remarks or notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)}>
              Add Risk/Opportunity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Risk Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Risk/Opportunity Details</DialogTitle>
            <DialogDescription>
              View detailed information about this risk or opportunity.
            </DialogDescription>
          </DialogHeader>
          {selectedRisk && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date Logged</Label>
                  <p className="text-sm">{new Date(selectedRisk.dateLogged).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Type</Label>
                  <Badge className={getRiskTypeColor(selectedRisk.riskType)}>
                    {selectedRisk.riskType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Probability</Label>
                  <Badge className={getProbabilityColor(selectedRisk.probability)}>
                    {selectedRisk.probability}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Impact</Label>
                  <Badge className={getImpactColor(selectedRisk.impact)}>
                    {selectedRisk.impact}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">User Logged</Label>
                  <p className="text-sm">{selectedRisk.userLogged}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedRisk.status)}>
                    {selectedRisk.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedRisk.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Risk/Opportunity</Label>
                <p className="text-sm mt-1">{selectedRisk.risk}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Action Taken</Label>
                <p className="text-sm mt-1">{selectedRisk.actionTaken}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Remarks</Label>
                <p className="text-sm mt-1">{selectedRisk.remarks}</p>
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