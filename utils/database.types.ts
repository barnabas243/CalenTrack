export type Json = string | number | boolean | null | {[key: string]: Json | undefined} | Json[];

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_date: string | null;
          action_type: Database['public']['Enums']['action_type'];
          after_data: Json | null;
          before_data: Json | null;
          entity_type: Database['public']['Enums']['entity_type'];
          id: string;
          section_id: string | null;
          todo_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action_date?: string | null;
          action_type: Database['public']['Enums']['action_type'];
          after_data?: Json | null;
          before_data?: Json | null;
          entity_type?: Database['public']['Enums']['entity_type'];
          id?: string;
          section_id?: string | null;
          todo_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action_date?: string | null;
          action_type?: Database['public']['Enums']['action_type'];
          after_data?: Json | null;
          before_data?: Json | null;
          entity_type?: Database['public']['Enums']['entity_type'];
          id?: string;
          section_id?: string | null;
          todo_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_logs_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'sections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activity_logs_todo_id_fkey';
            columns: ['todo_id'];
            isOneToOne: false;
            referencedRelation: 'todos';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          data: Json | null;
          id: string;
          sound: boolean | null;
          status: Database['public']['Enums']['notification_status'] | null;
          title: string | null;
          todo_id: string | null;
          trigger_time: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          data?: Json | null;
          id: string;
          sound?: boolean | null;
          status?: Database['public']['Enums']['notification_status'] | null;
          title?: string | null;
          todo_id?: string | null;
          trigger_time?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          data?: Json | null;
          id?: string;
          sound?: boolean | null;
          status?: Database['public']['Enums']['notification_status'] | null;
          title?: string | null;
          todo_id?: string | null;
          trigger_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_todo_id_fkey';
            columns: ['todo_id'];
            isOneToOne: false;
            referencedRelation: 'todos';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          expoPushToken: string | null;
          full_name: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          expoPushToken?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          expoPushToken?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      sections: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sections_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      todos: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          due_date: string | null;
          id: string;
          notification_id: string | null;
          parent_id: string | null;
          priority: Database['public']['Enums']['priority_enum'];
          recurrence: string | null;
          reminder_option: Database['public']['Enums']['reminder_option'] | null;
          section_id: string;
          start_date: string | null;
          summary: string;
          title: string;
          type: string | null;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          due_date?: string | null;
          id?: string;
          notification_id?: string | null;
          parent_id?: string | null;
          priority?: Database['public']['Enums']['priority_enum'];
          recurrence?: string | null;
          reminder_option?: Database['public']['Enums']['reminder_option'] | null;
          section_id?: string;
          start_date?: string | null;
          summary: string;
          title: string;
          type?: string | null;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          due_date?: string | null;
          id?: string;
          notification_id?: string | null;
          parent_id?: string | null;
          priority?: Database['public']['Enums']['priority_enum'];
          recurrence?: string | null;
          reminder_option?: Database['public']['Enums']['reminder_option'] | null;
          section_id?: string;
          start_date?: string | null;
          summary?: string;
          title?: string;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'todos_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'todos_notification_id_fkey';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'notifications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'todos_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'sections';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      confirm_current_user_password: {
        Args: {
          current_plain_password: string;
        };
        Returns: Json;
      };
      gen_random_uuid_rpc: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      action_type: 'CREATED' | 'UPDATED' | 'DELETED';
      entity_type: 'todo';
      notification_status: 'scheduled' | 'sent' | 'cancelled';
      priority_enum: '1' | '2' | '3' | '4';
      reminder_option: 'At Time of Event' | '10 Minutes Before' | '1 Hour Before' | '1 Day Before';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | {schema: keyof Database},
  TableName extends PublicTableNameOrOptions extends {schema: keyof Database}
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends {schema: keyof Database}
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | {schema: keyof Database},
  TableName extends PublicTableNameOrOptions extends {schema: keyof Database}
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends {schema: keyof Database}
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | {schema: keyof Database},
  TableName extends PublicTableNameOrOptions extends {schema: keyof Database}
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends {schema: keyof Database}
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | {schema: keyof Database},
  EnumName extends PublicEnumNameOrOptions extends {schema: keyof Database}
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends {schema: keyof Database}
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;
