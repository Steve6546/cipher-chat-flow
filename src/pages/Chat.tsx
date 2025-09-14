import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Lock, Users, Hash, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  encrypted?: boolean;
}

interface ChatProps {
  user: { username: string };
}

export default function Chat({ user }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'أهلاً وسهلاً! مرحباً بك في SecureChat 2025',
      sender: 'النظام',
      timestamp: new Date(Date.now() - 60000),
      encrypted: true,
    },
    {
      id: '2', 
      text: 'جميع الرسائل مشفرة بتشفير من طرف إلى طرف',
      sender: 'النظام',
      timestamp: new Date(Date.now() - 30000),
      encrypted: true,
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers] = useState(['أحمد', 'سارة', 'محمد', 'فاطمة']);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: user.username,
      timestamp: new Date(),
      encrypted: true,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate receiving a reply
    setTimeout(() => {
      const replies = [
        'رسالة رائعة!',
        'شكراً لك على المشاركة',
        'أتفق معك تماماً',
        'نقطة مثيرة للاهتمام',
        'هل يمكنك توضيح أكثر؟'
      ];
      
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: onlineUsers[Math.floor(Math.random() * onlineUsers.length)],
        timestamp: new Date(),
        encrypted: true,
      };

      setMessages(prev => [...prev, reply]);
      
      toast({
        title: "رسالة جديدة",
        description: `رسالة من ${reply.sender}`,
      });
    }, 1000 + Math.random() * 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-gradient-card border-r border-border shadow-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-2 mb-4">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">القناة العامة</h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>مشفر من طرف إلى طرف</span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">متصل الآن ({onlineUsers.length + 1})</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-primary/10 rounded-lg">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-online border-2 border-background rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.username} (أنت)</p>
                <p className="text-xs text-muted-foreground">متصل</p>
              </div>
            </div>

            {onlineUsers.map((username, index) => (
              <div key={username} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-online border-2 border-background rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{username}</p>
                  <p className="text-xs text-muted-foreground">متصل</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">القناة العامة</h1>
              </div>
              <div className="flex items-center space-x-1 text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
                <Lock className="h-3 w-3" />
                <span>مشفر</span>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender === user.username;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-xs ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                        {message.sender.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`group relative ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-2 rounded-2xl shadow-message ${
                        isOwnMessage 
                          ? 'bg-chat-bubble-sent text-primary-foreground rounded-br-md' 
                          : 'bg-chat-bubble-received text-foreground rounded-bl-md'
                      } hover:shadow-lg transition-shadow`}>
                        <p className="text-sm">{message.text}</p>
                        {message.encrypted && (
                          <div className="flex items-center space-x-1 mt-1 opacity-60">
                            <Lock className="h-3 w-3" />
                            <span className="text-xs">مشفر</span>
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex items-center space-x-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <span className="text-xs text-muted-foreground">
                          {message.sender}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="pr-12 bg-input/50 backdrop-blur-sm"
                dir="rtl"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button 
              type="submit" 
              variant="gradient"
              className="hover:scale-105 transition-transform"
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}