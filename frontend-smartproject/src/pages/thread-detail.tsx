import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertTriangle,
  Info,
  Megaphone,
  Award,
  User,
  Clock,
  MessageSquare,
  Lock
} from "lucide-react";
import { Thread, Message } from "@/types";
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

export default function ThreadDetail() {
  const [, projectParams] = useRoute<{ projectId: string; threadId: string }>("/projects/:projectId/collab/thread/:threadId");
  const [, globalParams] = useRoute<{ threadId: string }>("/collab/thread/:threadId");

  const projectId = projectParams?.projectId;
  const threadId = projectParams?.threadId || globalParams?.threadId;

  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const backUrl = projectId ? `/projects/${projectId}/collab` : '/collab';

  // Fetch thread and messages
  useEffect(() => {
    if (!threadId) return;
    fetchThreadData();
  }, [threadId, projectId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchThreadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching thread data for threadId:', threadId, 'projectId:', projectId);

      // Fetch messages
      const messagesEndpoint = projectId
        ? `/api/projects/${projectId}/collaboration/threads/${threadId}/messages`
        : `/api/collaboration/threads/${threadId}/messages`;

      console.log('Messages endpoint:', messagesEndpoint);

      const messagesResponse = await fetch(messagesEndpoint);
      if (!messagesResponse.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messagesData = await messagesResponse.json();
      console.log('Messages data:', messagesData);
      setMessages(messagesData);

      // Fetch thread details from the list
      const threadsEndpoint = projectId
        ? `/api/projects/${projectId}/collaboration/threads`
        : '/api/collaboration/threads';

      console.log('Threads endpoint:', threadsEndpoint);

      const threadsResponse = await fetch(threadsEndpoint);
      if (threadsResponse.ok) {
        const threadsData = await threadsResponse.json();
        console.log('Threads data:', threadsData);
        const currentThread = threadsData.find((t: Thread) => t.id === parseInt(threadId!));
        console.log('Current thread:', currentThread);
        if (currentThread) {
          setThread(currentThread);
        }
      }
    } catch (err) {
      console.error('Error fetching thread data:', err);
      setError('Failed to load thread. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load thread data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    if (thread?.isClosed) {
      toast({
        title: "Thread Closed",
        description: "Cannot add messages to a closed thread.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const messageEndpoint = projectId
        ? `/api/projects/${projectId}/collaboration/threads/${threadId}/messages`
        : `/api/collaboration/threads/${threadId}/messages`;

      console.log('Posting message to:', messageEndpoint);

      const response = await fetch(messageEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          authorId: `user_${Date.now()}`,
          authorName: 'Anonymous User',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post message');
      }

      const newMsg = await response.json();
      console.log('New message posted:', newMsg);
      setMessages([...messages, newMsg]);
      setNewMessage("");

      toast({
        title: "Success",
        description: "Message posted successfully!",
      });
    } catch (err) {
      console.error('Error posting message:', err);
      toast({
        title: "Error",
        description: "Failed to post message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Thread Not Found</h2>
              <p className="text-gray-600 mb-4">{error || "The thread you're looking for doesn't exist."}</p>
              <Link href={backUrl}>
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Threads
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TypeIcon = threadTypeConfig[thread.type].icon;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={backUrl}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Threads
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <TypeIcon className={cn("h-6 w-6", threadTypeConfig[thread.type].iconColor)} />
                  <CardTitle className="text-2xl">{thread.title}</CardTitle>
                  {thread.isClosed && (
                    <Badge variant="secondary" className="bg-gray-200">
                      <Lock className="h-3 w-3 mr-1" />
                      Closed
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <Badge className={cn("border", threadTypeConfig[thread.type].color)}>
                    {threadTypeConfig[thread.type].label}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{thread.createdByName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimestamp(thread.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Messages */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet. Be the first to comment!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{message.authorName}</span>
                      <span className="text-xs text-gray-500">{formatTimestamp(message.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmitMessage} className="space-y-4">
            <div>
              <Textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={thread.isClosed ? "This thread is closed" : "Type your message..."}
                rows={4}
                disabled={thread.isClosed || isSubmitting}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={thread.isClosed || isSubmitting || !newMessage.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}