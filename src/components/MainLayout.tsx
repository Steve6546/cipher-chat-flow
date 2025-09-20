import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useFriends } from "@/hooks/useFriends";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ConversationsList from "./ConversationsList";
import ChatWindow from "./ChatWindow";
import { 
  MessageCircle, 
  Users, 
  Search, 
  Settings, 
  LogOut, 
  Shield, 
  Bell 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const MainLayout = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedFriendUserId, setSelectedFriendUserId] = useState<string | null>(null);

  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { conversations } = useMessages();
  const { friends, friendRequests } = useFriends();
  const navigate = useNavigate();

  const handleSelectConversation = (conversationId: string, friendUserId: string) => {
    setSelectedConversationId(conversationId);
    setSelectedFriendUserId(friendUserId);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const friendProfile = selectedConversation?.friend_profile;

  const getUserInitials = (username: string, displayName?: string | null) => {
    const name = displayName || username;
    return name.slice(0, 2).toUpperCase();
  };

  // Calculate total unread messages
  const totalUnreadMessages = conversations.reduce((total, conv) => {
    if (!user) return total;
    return total + (conv.user1_id === user.id ? conv.unread_count_user1 : conv.unread_count_user2);
  }, 0);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card/50 backdrop-blur-sm flex flex-col">
        {/* User Profile Section */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile ? getUserInitials(profile.username, profile.display_name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-sm">
                {profile?.display_name || profile?.username || "مستخدم"}
              </h2>
              <p className="text-xs text-muted-foreground">
                @{profile?.username || "username"}
              </p>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Shield className="h-3 w-3" />
              آمن
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-background rounded-lg p-2">
              <div className="text-lg font-bold text-primary">{friends.length}</div>
              <div className="text-xs text-muted-foreground">أصدقاء</div>
            </div>
            <div className="bg-background rounded-lg p-2">
              <div className="text-lg font-bold text-orange-600">{friendRequests.length}</div>
              <div className="text-xs text-muted-foreground">طلبات</div>
            </div>
            <div className="bg-background rounded-lg p-2">
              <div className="text-lg font-bold text-green-600">{totalUnreadMessages}</div>
              <div className="text-xs text-muted-foreground">غير مقروءة</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          <Button
            variant="default"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/")}
          >
            <MessageCircle className="h-4 w-4" />
            المحادثات
            {totalUnreadMessages > 0 && (
              <Badge className="ml-auto h-5 w-5 p-0 text-xs">
                {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/friends")}
          >
            <Users className="h-4 w-4" />
            الأصدقاء
            {friendRequests.length > 0 && (
              <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 text-xs">
                {friendRequests.length}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/search")}
          >
            <Search className="h-4 w-4" />
            البحث عن أصدقاء
          </Button>
        </div>

        <Separator />

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ConversationsList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversationId}
          />
        </div>

        <Separator />

        {/* Bottom Actions */}
        <div className="p-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => toast({
              title: "قريباً",
              description: "ستتوفر هذه الميزة قريباً",
            })}
          >
            <Settings className="h-4 w-4" />
            الإعدادات
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId && friendProfile ? (
          <ChatWindow
            conversationId={selectedConversationId}
            friendUserId={selectedFriendUserId!}
            friendProfile={friendProfile}
          />
        ) : (
          <Card className="flex-1 m-4 flex items-center justify-center">
            <CardContent className="text-center py-12">
              <MessageCircle className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">SecureChat 2025</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                مرحباً بك في SecureChat! اختر محادثة من القائمة الجانبية أو ابحث عن أصدقاء جدد للبدء في المراسلة الآمنة.
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-600" />
                  تشفير AES
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  Real-time
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bell className="h-4 w-4 text-orange-600" />
                  حذف تلقائي
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate("/search")} className="gap-2">
                  <Search className="h-4 w-4" />
                  البحث عن أصدقاء
                </Button>
                <Button variant="outline" onClick={() => navigate("/friends")} className="gap-2">
                  <Users className="h-4 w-4" />
                  إدارة الأصدقاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MainLayout;