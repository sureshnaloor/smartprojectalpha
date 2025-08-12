import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Send, 
  AlertTriangle, 
  Info, 
  Megaphone, 
  Award,
  Clock,
  User,
  MessageSquare,
  Lock
} from "lucide-react";
import { Thread, Message, ThreadType } from "@/types";
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
  }
];

const mockMessages: Message[] = [
  {
    id: "1",
    threadId: "1",
    content: "We've identified a critical safety issue on the north side of the construction site. There's a structural concern with the scaffolding that needs immediate attention. All work in that area should be halted until further notice.",
    author: "John Smith",
    authorId: "js1",
    createdAt: "2024-01-15T10:30:00Z",
    isThreadCreator: true
  },
  {
    id: "2",
    threadId: "1",
    content: "I can see the issue from my position. The scaffolding appears to be leaning slightly. I've already evacuated the area and notified the safety team.",
    author: "Sarah Johnson",
    authorId: "sj1",
    createdAt: "2024-01-15T10:35:00Z",
    isThreadCreator: false
  },
  {
    id: "3",
    threadId: "1",
    content: "Safety team is on the way. We should have an assessment within 30 minutes. Please keep everyone clear of the area.",
    author: "Mike Wilson",
    authorId: "mw1",
    createdAt: "2024-01-15T10:40:00Z",
    isThreadCreator: false
  },
  {
    id: "4",
    threadId: "1",
    content: "I've contacted the scaffolding contractor. They'll be here within the hour to assess and fix the issue.",
    author: "John Smith",
    authorId: "js1",
    createdAt: "2024-01-15T10:45:00Z",
    isThreadCreator: true
  },
  {
    id: "5",
    threadId: "1",
    content: "Good response time. I've also notified the project manager about this situation.",
    author: "David Lee",
    authorId: "dl1",
    createdAt: "2024-01-15T10:50:00Z",
    isThreadCreator: false
  },
  {
    id: "6",
    threadId: "1",
    content: "Safety assessment complete. The scaffolding is indeed compromised. We need to dismantle and rebuild that section. Work will be delayed by approximately 4 hours.",
    author: "Mike Wilson",
    authorId: "mw1",
    createdAt: "2024-01-15T11:15:00Z",
    isThreadCreator: false
  },
  {
    id: "7",
    threadId: "1",
    content: "Understood. I'll update the project schedule accordingly. Thanks for the quick response everyone.",
    author: "John Smith",
    authorId: "js1",
    createdAt: "2024-01-15T11:20:00Z",
    isThreadCreator: true
  },
  {
    id: "8",
    threadId: "1",
    content: "Scaffolding has been safely dismantled. New scaffolding will be erected tomorrow morning. All safety protocols followed.",
    author: "Sarah Johnson",
    authorId: "sj1",
    createdAt: "2024-01-15T16:45:00Z",
    isThreadCreator: false
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

export default function ThreadDetailPage() {
  const [, params] = useRoute<{ projectId: string; threadId: string }>("/projects/:projectId/collab/thread/:threadId");
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const projectId = params?.projectId;
  const threadId = params?.threadId;
  const thread = mockThreads.find(t => t.id === threadId);
  const messages = mockMessages.filter(m => m.threadId === threadId);

  // Mock current user (in real app, this would come from auth context)
  const currentUser = {
    id: "js1",
    name: "John Smith"
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!thread) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Thread not found</h3>
          <p className="text-gray-600 mb-4">The thread you're looking for doesn't exist.</p>
          <Link href={`/projects/${projectId}/collab`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Collaboration Hub
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const config = threadTypeConfig[thread.type];
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || thread.isClosed) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, you would send this to the backend
    console.log('Sending message:', newMessage);
    
    setNewMessage('');
    setIsSubmitting(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/projects/${projectId}/collab`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collaboration Hub
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900 flex-1 mr-3">{thread.title}</h1>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge className={cn("border", config.color)}>
                  <Icon className={cn("w-3 h-3 mr-1", config.iconColor)} />
                  {config.label}
                </Badge>
                {thread.isClosed && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Closed
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>Started by {thread.createdBy}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs text-gray-400 italic">{formatDate(thread.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>{messages.length} messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.authorId === currentUser.id;
              const isThreadCreator = message.isThreadCreator;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isCurrentUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex max-w-xs lg:max-w-md",
                      isCurrentUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className={cn("w-8 h-8", isCurrentUser ? "ml-2" : "mr-2")}>
                      <AvatarFallback className="text-xs">
                        {getInitials(message.author)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={cn(
                      "flex flex-col",
                      isCurrentUser ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "rounded-lg px-3 py-2",
                        isCurrentUser 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-100 text-gray-900"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      <div className={cn(
                        "flex items-center space-x-2 mt-1 text-xs text-gray-500",
                        isCurrentUser ? "flex-row-reverse" : "flex-row"
                      )}>
                        <span className="font-medium">{message.author}</span>
                        {isThreadCreator && (
                          <Badge variant="outline" className="text-xs">Creator</Badge>
                        )}
                        <span className="text-xs text-gray-400 italic">{formatTime(message.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Message Input */}
      {!thread.isClosed ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 min-h-[80px] resize-none"
                disabled={isSubmitting}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSubmitting}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-center">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">This thread is closed. No new messages can be added.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 