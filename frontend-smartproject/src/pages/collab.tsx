import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  User,
  Plus,
  Loader2
} from "lucide-react";
import { Thread, ThreadType } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'info' as ThreadType,
    yourName: '',
    initialMessage: ''
  });

  // Fetch threads on mount
  useEffect(() => {
    fetchThreads();
  }, [projectId]);

  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const endpoint = projectId
        ? `/api/projects/${projectId}/collaboration/threads`
        : '/api/collaboration/threads';

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }

      const data = await response.json();
      setThreads(data);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to load threads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.yourName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Create thread
      const threadEndpoint = projectId
        ? `/api/projects/${projectId}/collaboration/threads`
        : '/api/collaboration/threads';

      const threadResponse = await fetch(threadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          createdById: `user_${Date.now()}`, // Simple ID generation
          createdByName: formData.yourName,
          ...(projectId ? {} : { projectId: null }), // Only include projectId for global threads
        }),
      });

      if (!threadResponse.ok) {
        throw new Error('Failed to create thread');
      }

      const newThread = await threadResponse.json();

      // If there's an initial message, create it
      if (formData.initialMessage.trim()) {
        const messageEndpoint = projectId
          ? `/api/projects/${projectId}/collaboration/threads/${newThread.id}/messages`
          : `/api/collaboration/threads/${newThread.id}/messages`;

        await fetch(messageEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: formData.initialMessage,
            authorId: `user_${Date.now()}`,
            authorName: formData.yourName,
          }),
        });
      }

      toast({
        title: "Success",
        description: "Thread created successfully!",
      });

      // Reset form and close modal
      setFormData({
        title: '',
        type: 'info',
        yourName: '',
        initialMessage: ''
      });
      setIsModalOpen(false);

      // Refresh threads
      fetchThreads();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.createdByName.toLowerCase().includes(searchTerm.toLowerCase());
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
                  <span>{thread.createdByName}</span>
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
                <span>By {thread.createdByName}</span>
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

          {/* New Thread Button */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                New Thread
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleCreateThread}>
                <DialogHeader>
                  <DialogTitle>Create New Thread</DialogTitle>
                  <DialogDescription>
                    Start a new discussion, share information, or make an announcement.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter thread title..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as ThreadType })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="issue">Issue</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="awards">Awards & Recognition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="yourName">
                      Your Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="yourName"
                      placeholder="Enter your name..."
                      value={formData.yourName}
                      onChange={(e) => setFormData({ ...formData, yourName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="initialMessage">Initial Message (Optional)</Label>
                    <Textarea
                      id="initialMessage"
                      placeholder="Add an initial message to start the discussion..."
                      value={formData.initialMessage}
                      onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Thread'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Threads</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchThreads} variant="outline">
            Try Again
          </Button>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No threads found</h3>
          <p className="text-gray-600">
            {threads.length === 0
              ? "Be the first to start a discussion!"
              : "Try adjusting your search or filter criteria."}
          </p>
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