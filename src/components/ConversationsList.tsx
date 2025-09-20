import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { MessageCircle, Clock } from "lucide-react";

interface ConversationsListProps {
  onSelectConversation: (conversationId: string, friendUserId: string) => void;
  selectedConversationId: string | null;
}

const ConversationsList = ({ onSelectConversation, selectedConversationId }: ConversationsListProps) => {
  const { conversations, getUnreadCount } = useMessages();

  const getUserInitials = (username: string, displayName?: string | null) => {
    const name = displayName || username;
    return name.slice(0, 2).toUpperCase();
  };

  const formatLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "الآن";
    if (diffInMinutes < 60) return `${diffInMinutes}د`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}س`;
    return `${Math.floor(diffInMinutes / 1440)}ي`;
  };

  const truncateMessage = (message: string | null, maxLength: number = 40) => {
    if (!message) return "لا توجد رسائل";
    return message.length > maxLength ? message.substring(0, maxLength) + "..." : message;
  };

  if (conversations.length === 0) {
    return (
      <Card className="m-4">
        <CardContent className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">لا توجد محادثات</h3>
          <p className="text-muted-foreground text-sm">
            ابدأ محادثة جديدة مع أصدقائك
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        المحادثات
      </h2>
      
      {conversations.map((conversation) => {
        const unreadCount = getUnreadCount(conversation);
        const isSelected = selectedConversationId === conversation.id;
        
        return (
          <Card
            key={conversation.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              isSelected && "ring-2 ring-primary border-primary"
            )}
            onClick={() => onSelectConversation(conversation.id, conversation.friend_profile.user_id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.friend_profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getUserInitials(
                        conversation.friend_profile.username, 
                        conversation.friend_profile.display_name
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.friend_profile.is_online && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm truncate">
                      {conversation.friend_profile.display_name || conversation.friend_profile.username}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastMessageTime(conversation.last_message_at)}
                        </span>
                      )}
                      {unreadCount > 0 && (
                        <Badge className="h-5 w-5 p-0 text-xs flex items-center justify-center bg-primary">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-xs truncate",
                      unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {truncateMessage(conversation.last_message)}
                    </p>
                    {conversation.friend_profile.is_online && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200 flex-shrink-0 mr-2">
                        متصل
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ConversationsList;