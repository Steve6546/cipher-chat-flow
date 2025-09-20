import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  Send, 
  Check, 
  X, 
  MessageCircle, 
  ArrowRight,
  Clock
} from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const FriendsPage = () => {
  const { 
    friends, 
    friendRequests, 
    sentRequests, 
    loading, 
    acceptFriendRequest, 
    rejectFriendRequest 
  } = useFriends();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await acceptFriendRequest(requestId);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await rejectFriendRequest(requestId);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
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

  const startChat = (friendUserId: string) => {
    navigate(`/chat/${friendUserId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جارٍ تحميل الأصدقاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">إدارة الأصدقاء</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate("/search")}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              البحث عن أصدقاء
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للدردشة
            </Button>
          </div>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="gap-2">
              <Users className="h-4 w-4" />
              الأصدقاء ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Send className="h-4 w-4" />
              الطلبات الواردة ({friendRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Clock className="h-4 w-4" />
              الطلبات المرسلة ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-6">
            {friends.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">لا توجد أصدقاء بعد</h3>
                  <p className="text-muted-foreground mb-6">
                    ابدأ بالبحث عن أصدقاء جدد لبدء المحادثات الآمنة
                  </p>
                  <Button onClick={() => navigate("/search")} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    البحث عن أصدقاء
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {friends.map((friend) => (
                  <Card key={friend.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={friend.friend_profile.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getUserInitials(friend.friend_profile.username, friend.friend_profile.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            {friend.friend_profile.is_online && (
                              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground">
                                {friend.friend_profile.display_name || friend.friend_profile.username}
                              </h3>
                              {friend.friend_profile.is_online ? (
                                <Badge variant="outline" className="text-green-600 border-green-200">
                                  متصل
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  {formatLastSeen(friend.friend_profile.last_seen)}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              @{friend.friend_profile.username}
                            </p>
                          </div>
                        </div>

                        <Button 
                          onClick={() => startChat(friend.friend_profile.user_id)}
                          className="gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          بدء محادثة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            {friendRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Send className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">لا توجد طلبات صداقة</h3>
                  <p className="text-muted-foreground">
                    لم تتلق أي طلبات صداقة جديدة حتى الآن
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.sender_profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getUserInitials(
                                request.sender_profile?.username || '', 
                                request.sender_profile?.display_name
                              )}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">
                              {request.sender_profile?.display_name || request.sender_profile?.username}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              @{request.sender_profile?.username}
                            </p>
                            {request.message && (
                              <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded">
                                "{request.message}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(request.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={processingRequests.has(request.id)}
                            size="sm"
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            قبول
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={processingRequests.has(request.id)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            رفض
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">لا توجد طلبات مرسلة</h3>
                  <p className="text-muted-foreground">
                    لم ترسل أي طلبات صداقة حتى الآن
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.receiver_profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getUserInitials(
                                request.receiver_profile?.username || '', 
                                request.receiver_profile?.display_name
                              )}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">
                              {request.receiver_profile?.display_name || request.receiver_profile?.username}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              @{request.receiver_profile?.username}
                            </p>
                            {request.message && (
                              <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded">
                                "{request.message}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              أُرسل في {new Date(request.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>

                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          في الانتظار
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FriendsPage;