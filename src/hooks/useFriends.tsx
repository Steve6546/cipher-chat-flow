import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
  };
  receiver_profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
  };
}

interface Friend {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_profile: {
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string;
  };
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchFriends();
    fetchFriendRequests();
    fetchSentRequests();

    // Subscribe to real-time updates
    const friendsChannel = supabase
      .channel('friends-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
        },
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    const requestsChannel = supabase
      .channel('friend-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
        },
        () => {
          fetchFriendRequests();
          fetchSentRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendsChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend_profile:profiles!friends_user1_id_fkey(*),
        friend_profile2:profiles!friends_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friends:', error);
      return;
    }

    // Map the data to include the correct friend profile
    const mappedFriends = data?.map((friendship: any) => ({
      ...friendship,
      friend_profile: friendship.user1_id === user.id 
        ? friendship.friend_profile2 
        : friendship.friend_profile
    })) || [];

    setFriends(mappedFriends);
  };

  const fetchFriendRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender_profile:profiles!friend_requests_sender_id_fkey(*)
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching friend requests:', error);
      return;
    }

    setFriendRequests((data || []) as FriendRequest[]);
  };

  const fetchSentRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        receiver_profile:profiles!friend_requests_receiver_id_fkey(*)
      `)
      .eq('sender_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching sent requests:', error);
      return;
    }

    setSentRequests((data || []) as FriendRequest[]);
    setLoading(false);
  };

  const sendFriendRequest = async (receiverId: string, message?: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Check if friendship or request already exists
    const { data: existingFriendship } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${user.id})`);

    if (existingFriendship && existingFriendship.length > 0) {
      return { error: 'Already friends with this user' };
    }

    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      .eq('status', 'pending');

    if (existingRequest && existingRequest.length > 0) {
      return { error: 'Friend request already exists' };
    }

    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message: message || null,
        status: 'pending'
      });

    if (error) {
      return { error: error.message };
    }

    toast({
      title: "طلب الصداقة تم إرساله",
      description: "تم إرسال طلب الصداقة بنجاح",
    });

    fetchSentRequests();
    return { error: null };
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return;

    // Get the request details
    const { data: request } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) return;

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return;
    }

    // Create friendship (ensure user1_id < user2_id)
    const user1_id = request.sender_id < request.receiver_id ? request.sender_id : request.receiver_id;
    const user2_id = request.sender_id < request.receiver_id ? request.receiver_id : request.sender_id;

    const { error: friendshipError } = await supabase
      .from('friends')
      .insert({
        user1_id,
        user2_id
      });

    if (friendshipError) {
      console.error('Error creating friendship:', friendshipError);
      return;
    }

    toast({
      title: "تم قبول طلب الصداقة",
      description: "أصبحتما أصدقاء الآن!",
    });

    fetchFriends();
    fetchFriendRequests();
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting request:', error);
      return;
    }

    toast({
      title: "تم رفض طلب الصداقة",
      description: "تم رفض طلب الصداقة",
    });

    fetchFriendRequests();
  };

  const searchUsers = async (query: string) => {
    if (!user || !query.trim()) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('user_id', user.id)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  };

  return {
    friends,
    friendRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
  };
};