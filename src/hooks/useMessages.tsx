import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import CryptoJS from 'crypto-js';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count_user1: number;
  unread_count_user2: number;
  created_at: string;
  updated_at: string;
  friend_profile: {
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string;
  };
}

const ENCRYPTION_KEY = 'SecureChat2025Key'; // In production, use environment variable

export const useMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchConversations();

    // Subscribe to real-time updates
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.conversation_id === currentConversationId) {
            fetchMessages(currentConversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, currentConversationId]);

  const encryptMessage = (message: string): string => {
    return CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();
  };

  const decryptMessage = (encryptedMessage: string): string => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || encryptedMessage; // Return original if decryption fails
    } catch {
      return encryptedMessage; // Return original if decryption fails
    }
  };

  const fetchConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        friend_profile:profiles!conversations_user1_id_fkey(*),
        friend_profile2:profiles!conversations_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    // Map the data to include the correct friend profile
    const mappedConversations = data?.map((conversation: any) => ({
      ...conversation,
      friend_profile: conversation.user1_id === user.id 
        ? conversation.friend_profile2 
        : conversation.friend_profile
    })) || [];

    setConversations(mappedConversations);
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey(username, display_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Decrypt messages
    const decryptedMessages = data?.map(message => ({
      ...message,
      content: decryptMessage(message.content)
    })) || [];

    setMessages(decryptedMessages);

    // Mark messages as read
    await markMessagesAsRead(conversationId);
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    // Reset unread count for current user
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      const isUser1 = conversation.user1_id === user.id;
      const updateField = isUser1 ? 'unread_count_user1' : 'unread_count_user2';
      
      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversationId);
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user || !content.trim()) return { error: 'Invalid message' };

    // Find or create conversation
    let conversationId = await findOrCreateConversation(receiverId);
    if (!conversationId) return { error: 'Failed to create conversation' };

    // Encrypt message
    const encryptedContent = encryptMessage(content.trim());

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: encryptedContent,
        is_read: false
      });

    if (error) {
      console.error('Error sending message:', error);
      return { error: error.message };
    }

    return { error: null };
  };

  const findOrCreateConversation = async (friendId: string): Promise<string | null> => {
    if (!user) return null;

    // Ensure user1_id < user2_id for consistency
    const user1_id = user.id < friendId ? user.id : friendId;
    const user2_id = user.id < friendId ? friendId : user.id;

    // Try to find existing conversation
    let { data: conversation, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_id', user1_id)
      .eq('user2_id', user2_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding conversation:', error);
      return null;
    }

    if (conversation) {
      return conversation.id;
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id,
        user2_id
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return null;
    }

    return newConversation.id;
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    fetchMessages(conversationId);
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!user) return 0;
    return conversation.user1_id === user.id 
      ? conversation.unread_count_user1 
      : conversation.unread_count_user2;
  };

  return {
    conversations,
    messages,
    currentConversationId,
    loading,
    sendMessage,
    selectConversation,
    getUnreadCount,
  };
};