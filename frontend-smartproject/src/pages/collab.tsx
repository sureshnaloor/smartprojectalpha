import { useState } from "react";
import { Link, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Grid3X3, 
  List, 
  Search, 
  MessageSquare, 
  AlertTriangle, 
  Info, 
  Megaphone, 
  Award,
  Clock,
  User
} from "lucide-react";
import { Thread, ThreadType } from "@/types";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockThreads: Thread[] = [
  {
    id: "1",
    title: "Critical safety issue on site - immediate attention required",
    type: "issue",
    createdBy: "John Smith",
    createdAt: "2024-01-15T10:30:00Z",
    lastMessageAt: "2024-01-15T16:45:00Z",
    messageCount: 8,
    isClosed: false,
    projectId: 1
  },
  {
    id: "2",
    title: "New equipment delivery schedule update",
    type: "info",
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-14T14:20:00Z",
    lastMessageAt: "2024-01-15T09:15:00Z",
    messageCount: 3,
    isClosed: false,
    projectId: 1
  },
  {
    id: "3",
    title: "Team meeting rescheduled for tomorrow",
    type: "announcement",
    createdBy: "Mike Wilson",
    createdAt: "2024-01-15T08:00:00Z",
    lastMessageAt: "2024-01-15T08:00:00Z",
    messageCount: 1,
    isClosed: false,
    projectId: 1
  },
  {
    id: "4",
    title: "Congratulations to the safety team for 100 days without incidents",
    type: "awards",
    createdBy: "Lisa Brown",
    createdAt: "2024-01-13T16:00:00Z",
    lastMessageAt: "2024-01-15T11:30:00Z",
    messageCount: 12,
    isClosed: false,
    projectId: 1
  },
  {
    id: "5",
    title: "Material shortage affecting timeline",
    type: "issue",
    createdBy: "David Lee",
    createdAt: "2024-01-12T11:45:00Z",
    lastMessageAt: "2024-01-14T17:20:00Z",
    messageCount: 6,
    isClosed: true,
    projectId: 1
  },
  {
    id: "6",
    title: "Updated project timeline and milestones",
    type: "info",
    createdBy: "Emma Davis",
    createdAt: "2024-01-11T13:30:00Z",
    lastMessageAt: "2024-01-13T10:15:00Z",
    messageCount: 4,
    isClosed: false,
    projectId: 1
  },
  {
    id: "7",
    title: "Holiday schedule for the construction team",
    type: "announcement",
    createdBy: "Robert Chen",
    createdAt: "2024-01-10T09:00:00Z",
    lastMessageAt: "2024-01-12T14:30:00Z",
    messageCount: 7,
    isClosed: false,
    projectId: 1
  },
  {
    id: "8",
    title: "Excellence award for quality control team",
    type: "awards",
    createdBy: "Jennifer White",
    createdAt: "2024-01-09T15:20:00Z",
    lastMessageAt: "2024-01-11T16:45:00Z",
    messageCount: 9,
    isClosed: false,
    projectId: 1
  }
];

const threadTypeConfig = {
  issue: {
    label: "Issue",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800 border-red-200",
    iconColor: "text-red-600"
  },
  info: {
    label: "Info",
    icon: Info,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    iconColor: "text-blue-600"
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    iconColor: "text-gray-600"
  },
  awards: {
    label: "Awards & Recognition",
    icon: Award,
    color: "bg-green-100 text-green-800 border-green-200",
    iconColor: "text-green-600"
  }
};

export default function CollabPage() {
  const [, projectParams] = useRoute<{ projectId: string }>("/projects/:projectId/collab");
  const [, generalParams] = useRoute("/collab");
  const projectId = projectParams?.projectId;
  
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ThreadType | 'all'>('all');

  const filteredThreads = mockThreads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thread.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || thread.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const ThreadCard = ({ thread }: { thread: Thread }) => {
    const config = threadTypeConfig[thread.type];
    const Icon = config.icon;

    const threadUrl = projectId 
      ? `/projects/${projectId}/collab/thread/${thread.id}`
      : `/collab/thread/${thread.id}`;

    return (
      <Link href={threadUrl}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-gray-400 italic">{formatDate(thread.lastMessageAt)}</span>
            </div>
            <div className="flex items-start justify-between">
              <CardTitle className="text-base font-medium line-clamp-2 flex-1 mr-3">{thread.title}</CardTitle>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge className={cn("border", config.color)}>
                  <Icon className={cn("w-3 h-3 mr-1", config.iconColor)} />
                  {config.label}
                </Badge>
                {thread.isClosed && (
                  <Badge variant="secondary" className="text-xs">Closed</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{thread.createdBy}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{thread.messageCount}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs text-gray-400 italic">{formatDate(thread.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const ThreadListItem = ({ thread }: { thread: Thread }) => {
    const config = threadTypeConfig[thread.type];
    const Icon = config.icon;

    const threadUrl = projectId 
      ? `/projects/${projectId}/collab/thread/${thread.id}`
      : `/collab/thread/${thread.id}`;

    return (
      <Link href={threadUrl}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-gray-900 truncate flex-1 mr-3">{thread.title}</h3>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Badge className={cn("border", config.color)}>
                    <Icon className={cn("w-3 h-3 mr-1", config.iconColor)} />
                    {config.label}
                  </Badge>
                  {thread.isClosed && (
                    <Badge variant="secondary" className="text-xs">Closed</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>By {thread.createdBy}</span>
                <span>•</span>
                <span>{thread.messageCount} messages</span>
                <span>•</span>
                <span className="text-xs text-gray-400 italic">{formatDate(thread.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 italic ml-4">
            {formatDate(thread.lastMessageAt)}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Collaboration Hub</h1>
        <p className="text-gray-600">Stay connected with your team through discussions, announcements, and updates.</p>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search threads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={filterType} onValueChange={(value) => setFilterType(value as ThreadType | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="announcement">Announcements</SelectItem>
              <SelectItem value="awards">Awards</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={layout === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayout('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={layout === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayout('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Threads Display */}
      {filteredThreads.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No threads found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredThreads.map((thread) => (
            <ThreadListItem key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
} 