import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Send, ArrowRight } from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

  const { searchUsers, sendFriendRequest, friends, sentRequests } = useFriends();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const searchDebounced = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setLoading(true);
        try {
          const results = await searchUsers(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          toast({
            title: "خطأ في البحث",
            description: "حدث خطأ أثناء البحث عن المستخدمين",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(searchDebounced);
  }, [searchQuery, searchUsers]);

  const handleSendFriendRequest = async (userId: string) => {
    setSendingRequests(prev => new Set(prev).add(userId));
    
    try {
      const result = await sendFriendRequest(userId, "مرحباً! أود إضافتك كصديق في SecureChat");
      
      if (result.error) {
        toast({
          title: "فشل إرسال الطلب",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getUserInitials = (username: string, displayName?: string | null) => {
    const name = displayName || username;
    return name.slice(0, 2).toUpperCase();
  };

  const isAlreadyFriend = (userId: string) => {
    return friends.some(friend => friend.friend_profile.user_id === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests.some(request => request.receiver_id === userId);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">البحث عن المستخدمين</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للدردشة
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              البحث عن أصدقاء جدد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث باسم المستخدم أو الاسم المعروض..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
              <p className="text-sm text-muted-foreground mt-2">
                يرجى إدخال حرفين على الأقل للبحث
              </p>
            )}
          </CardContent>
        </Card>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">جارٍ البحث...</p>
          </div>
        )}

        {!loading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground">
                لم يتم العثور على مستخدمين يطابقون بحثك
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {searchResults.map((userProfile) => (
            <Card key={userProfile.user_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userProfile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getUserInitials(userProfile.username, userProfile.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      {userProfile.is_online && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">
                          {userProfile.display_name || userProfile.username}
                        </h3>
                        {userProfile.is_online ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            متصل
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {formatLastSeen(userProfile.last_seen)}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        @{userProfile.username}
                      </p>
                      
                      {userProfile.bio && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {userProfile.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAlreadyFriend(userProfile.user_id) ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        صديق
                      </Badge>
                    ) : hasPendingRequest(userProfile.user_id) ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        تم الإرسال
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleSendFriendRequest(userProfile.user_id)}
                        disabled={sendingRequests.has(userProfile.user_id)}
                        size="sm"
                        className="gap-2"
                      >
                        {sendingRequests.has(userProfile.user_id) ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            جارٍ الإرسال...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            إضافة صديق
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {searchResults.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              تم العثور على {searchResults.length} مستخدم
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;