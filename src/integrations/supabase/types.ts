export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string;
          created_at: string;
          details: Json | null;
          document_id: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          details?: Json | null;
          document_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: Json | null;
          document_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_logs_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_insights: {
        Row: {
          confidence_score: number | null;
          created_at: string;
          data: Json | null;
          document_id: string | null;
          id: string;
          insight_type: string;
        };
        Insert: {
          confidence_score?: number | null;
          created_at?: string;
          data?: Json | null;
          document_id?: string | null;
          id?: string;
          insight_type: string;
        };
        Update: {
          confidence_score?: number | null;
          created_at?: string;
          data?: Json | null;
          document_id?: string | null;
          id?: string;
          insight_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_insights_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string;
          deadline: string | null;
          deleted_at: string | null;
          document_type: string | null;
          file_path: string | null;
          file_size: number | null;
          id: string;
          metadata: Json | null;
          mime_type: string | null;
          priority: string | null;
          status: string | null;
          title: string;
          updated_at: string;
          user_id: string | null;
          vector_embedding: string | null;
          client_id: string | null;
          content: string | null;
          morphik_id: string | null;
          morphik_sync_status: string | null;
          morphik_sync_error: string | null;
          morphik_synced_at: string | null;
        };
        Insert: {
          created_at?: string;
          deadline?: string | null;
          deleted_at?: string | null;
          document_type?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          id?: string;
          metadata?: Json | null;
          mime_type?: string | null;
          priority?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string;
          user_id?: string | null;
          vector_embedding?: string | null;
          client_id?: string | null;
          content?: string | null;
          morphik_id?: string | null;
          morphik_sync_status?: string | null;
          morphik_sync_error?: string | null;
          morphik_synced_at?: string | null;
        };
        Update: {
          created_at?: string;
          deadline?: string | null;
          deleted_at?: string | null;
          document_type?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          id?: string;
          metadata?: Json | null;
          mime_type?: string | null;
          priority?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
          vector_embedding?: string | null;
          client_id?: string | null;
          content?: string | null;
          morphik_id?: string | null;
          morphik_sync_status?: string | null;
          morphik_sync_error?: string | null;
          morphik_synced_at?: string | null;
        };
        Relationships: [];
      };
      notification_rules: {
        Row: {
          channels: string[] | null;
          conditions: Json | null;
          created_at: string;
          id: string;
          is_active: boolean | null;
          template: string | null;
          timing: string | null;
          trigger_type: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          channels?: string[] | null;
          conditions?: Json | null;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          template?: string | null;
          timing?: string | null;
          trigger_type: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          channels?: string[] | null;
          conditions?: Json | null;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          template?: string | null;
          timing?: string | null;
          trigger_type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          channels: string[] | null;
          created_at: string;
          id: string;
          message: string;
          scheduled_at: string | null;
          sent_at: string | null;
          title: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          channels?: string[] | null;
          created_at?: string;
          id?: string;
          message: string;
          scheduled_at?: string | null;
          sent_at?: string | null;
          title: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          channels?: string[] | null;
          created_at?: string;
          id?: string;
          message?: string;
          scheduled_at?: string | null;
          sent_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      search_queries: {
        Row: {
          created_at: string;
          id: string;
          processing_time: number | null;
          query: string;
          query_type: string | null;
          results_count: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          processing_time?: number | null;
          query: string;
          query_type?: string | null;
          results_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          processing_time?: number | null;
          query?: string;
          query_type?: string | null;
          results_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      binary_quantize: {
        Args: { '': string } | { '': unknown };
        Returns: unknown;
      };
      halfvec_avg: {
        Args: { '': number[] };
        Returns: unknown;
      };
      halfvec_out: {
        Args: { '': unknown };
        Returns: unknown;
      };
      halfvec_send: {
        Args: { '': unknown };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: { '': unknown[] };
        Returns: number;
      };
      hnsw_bit_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      hnswhandler: {
        Args: { '': unknown };
        Returns: unknown;
      };
      ivfflat_bit_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: { '': unknown };
        Returns: unknown;
      };
      l2_norm: {
        Args: { '': unknown } | { '': unknown };
        Returns: number;
      };
      l2_normalize: {
        Args: { '': string } | { '': unknown } | { '': unknown };
        Returns: unknown;
      };
      sparsevec_out: {
        Args: { '': unknown };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: { '': unknown };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: { '': unknown[] };
        Returns: number;
      };
      vector_avg: {
        Args: { '': number[] };
        Returns: string;
      };
      vector_dims: {
        Args: { '': string } | { '': unknown };
        Returns: number;
      };
      vector_norm: {
        Args: { '': string };
        Returns: number;
      };
      vector_out: {
        Args: { '': string };
        Returns: unknown;
      };
      vector_send: {
        Args: { '': string };
        Returns: string;
      };
      vector_typmod_in: {
        Args: { '': unknown[] };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
