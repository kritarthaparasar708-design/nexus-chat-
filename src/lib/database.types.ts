export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          username: string;
          bio: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          username: string;
          bio?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          username?: string;
          bio?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          is_group: boolean;
          created_at: string;
          direct_user_low: string | null;
          direct_user_high: string | null;
          last_message: string | null;
          last_message_at: string | null;
          last_sender_id: string | null;
        };
        Insert: {
          id?: string;
          is_group?: boolean;
          created_at?: string;
          direct_user_low?: string | null;
          direct_user_high?: string | null;
          last_message?: string | null;
          last_message_at?: string | null;
          last_sender_id?: string | null;
        };
        Update: {
          last_message?: string | null;
          last_message_at?: string | null;
          last_sender_id?: string | null;
        };
        Relationships: [];
      };
      conversation_members: {
        Row: { conversation_id: string; user_id: string; created_at: string };
        Insert: { conversation_id: string; user_id: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: { body?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_direct_conversation: {
        Args: { target_user_id: string };
        Returns: string;
      };
      is_conversation_member: {
        Args: { target_conversation_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type ConversationMember = Database["public"]["Tables"]["conversation_members"]["Row"];
