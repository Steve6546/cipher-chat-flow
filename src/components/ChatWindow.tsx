import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Shield, Clock } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ChatWindowProps {
  conversationId: string;
  friendUserId: string;
  friendProfile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string;
  };
}

const ChatWindow = ({ conversationId, friendUserId, friendProfile }: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage } = useMessages();
  const { user } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    
    try {
      const result = await sendMessage(friendUserId, newMessage);
      
      if (result.error) {
        toast({
          title: "فشل إرسال الرسالة",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setNewMessage("");
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "اليوم";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "أمس";
    } else {
      return date.toLocaleDateString('ar-SA');
    }
  };

  const getUserInitials = (username: string, displayName?: string | null) => {
    const name = displayName || username;
    return name.slice(0, 2).toUpperCase();
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "متصل الآن";
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <CardHeader className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={friendProfile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getUserInitials(friendProfile.username, friendProfile.display_name)}
                </AvatarFallback>
              </Avatar>
              {friendProfile.is_online && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-sm">
                {friendProfile.display_name || friendProfile.username}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {friendProfile.is_online ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    متصل الآن
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    {formatLastSeen(friendProfile.last_seen)}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <Shield className="h-3 w-3" />
              مشفر
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">بداية محادثة جديدة</h3>
            <p className="text-muted-foreground text-sm">
              ابدأ محادثة آمنة ومشفرة مع {friendProfile.display_name || friendProfile.username}
            </p>
            <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
              <Shield className="h-3 w-3 inline mr-1" />
              جميع الرسائل مشفرة وتُحذف تلقائياً بعد يومين
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {date}
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {dateMessages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={friendProfile.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getUserInitials(friendProfile.username, friendProfile.display_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <div className={cn(
                            "text-xs mt-1 flex items-center gap-1",
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            <Clock className="h-3 w-3" />
                            {formatMessageTime(message.created_at)}
                            {isOwn && (
                              <div className="flex items-center gap-1">
                                <div className={cn(
                                  "h-2 w-2 rounded-full",
                                  message.is_read ? "bg-green-400" : "bg-muted-foreground/50"
                                )}></div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isOwn && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {user?.email?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <CardContent className="border-t bg-card/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`اكتب رسالة إلى ${friendProfile.display_name || friendProfile.username}...`}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-10 w-10"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          <Shield className="h-3 w-3 inline mr-1" />
          الرسائل محمية بتشفير AES وتُحذف تلقائياً بعد يومين
        </p>
      </CardContent>
    </div>
  );
};

export default ChatWindow;