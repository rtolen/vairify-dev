import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/feed/BottomNavigation";

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  lastMessage?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      subscribeToMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
      return;
    }

    // Fetch other user details for each conversation
    const conversationsWithUsers = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.participant_1_id === user.id 
          ? conv.participant_2_id 
          : conv.participant_1_id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", otherUserId)
          .single();

        return {
          ...conv,
          otherUser: profile || { id: otherUserId, full_name: "Unknown User", avatar_url: null },
        };
      })
    );

    setConversations(conversationsWithUsers);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      return;
    }

    setMessages(data || []);

    // Mark messages as read
    const unreadMessages = (data || []).filter(
      (msg) => msg.recipient_id === currentUserId && !msg.read_at
    );

    if (unreadMessages.length > 0) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadMessages.map((m) => m.id));
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const conversation = conversations.find((c) => c.id === selectedConversation);
    if (!conversation) return;

    const recipientId = conversation.participant_1_id === currentUserId
      ? conversation.participant_2_id
      : conversation.participant_1_id;

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConversation,
      sender_id: currentUserId,
      recipient_id: recipientId,
      content: newMessage,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return;
    }

    // Update conversation's last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", selectedConversation);

    setNewMessage("");
    fetchConversations();
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/feed")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-xl font-semibold text-foreground">Messages</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <Card className="col-span-1 p-4 flex flex-col">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                      selectedConversation === conv.id
                        ? "bg-primary/10"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <Avatar>
                      <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                      <AvatarFallback>
                        {conv.otherUser.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.otherUser.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Messages Area */}
          <Card className="col-span-1 md:col-span-2 p-4 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
                  <Avatar>
                    <AvatarImage src={selectedConv?.otherUser.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedConv?.otherUser.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConv?.otherUser.full_name}</p>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 pr-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex mb-4 ${
                        msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.sender_id === currentUserId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            )}
          </Card>
        </div>
      </div>
      <BottomNavigation activeTab="chat" />
    </div>
  );
}
