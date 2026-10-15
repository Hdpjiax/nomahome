export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string;
          created_at: string;
          id: string;
          is_default: boolean;
          line1: string;
          line2: string | null;
          phone: string;
          postal_code: string;
          recipient: string;
          state: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          city: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          line1: string;
          line2?: string | null;
          phone: string;
          postal_code: string;
          recipient: string;
          state: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          city?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          line1?: string;
          line2?: string | null;
          phone?: string;
          postal_code?: string;
          recipient?: string;
          state?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          cart_id: string;
          created_at: string;
          id: string;
          qty: number;
          variant_id: string;
        };
        ComputedFields: never;
        Insert: {
          cart_id: string;
          created_at?: string;
          id?: string;
          qty: number;
          variant_id: string;
        };
        Update: {
          cart_id?: string;
          created_at?: string;
          id?: string;
          qty?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey';
            columns: ['cart_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      carts: {
        Row: {
          created_at: string;
          id: string;
          session_id: string;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          session_id: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          session_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      colors: {
        Row: {
          created_at: string;
          hex: string;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          hex: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          hex?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          product_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorites_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      homepage_blocks: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          kind: string;
          product_id: string | null;
          published: boolean;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          product_id?: string | null;
          published?: boolean;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          product_id?: string | null;
          published?: boolean;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'homepage_blocks_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          cfdi_use: string;
          created_at: string;
          id: string;
          legal_name: string;
          order_id: string;
          pdf_url: string | null;
          postal_code: string;
          rfc: string;
          status: string;
          tax_regime: string;
          total_cents: number | null;
          updated_at: string;
          uuid: string | null;
          xml_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          cfdi_use: string;
          created_at?: string;
          id?: string;
          legal_name: string;
          order_id: string;
          pdf_url?: string | null;
          postal_code: string;
          rfc: string;
          status?: string;
          tax_regime: string;
          total_cents?: number | null;
          updated_at?: string;
          uuid?: string | null;
          xml_url?: string | null;
        };
        Update: {
          cfdi_use?: string;
          created_at?: string;
          id?: string;
          legal_name?: string;
          order_id?: string;
          pdf_url?: string | null;
          postal_code?: string;
          rfc?: string;
          status?: string;
          tax_regime?: string;
          total_cents?: number | null;
          updated_at?: string;
          uuid?: string | null;
          xml_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          created_at: string;
          email: string;
          id: string;
          name: string;
          phone: string | null;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          phone?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          name_snapshot: string;
          order_id: string;
          qty: number;
          sku_snapshot: string;
          unit_price_cents: number;
          variant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name_snapshot: string;
          order_id: string;
          qty: number;
          sku_snapshot: string;
          unit_price_cents: number;
          variant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name_snapshot?: string;
          order_id?: string;
          qty?: number;
          sku_snapshot?: string;
          unit_price_cents?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          address_snapshot: NonNullable<Json>;
          created_at: string;
          email: string;
          guest_token: string | null;
          id: string;
          public_ref: string | null;
          shipping_cents: number;
          status: string;
          subtotal_cents: number;
          tax_cents: number;
          total_cents: number;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          address_snapshot?: NonNullable<Json>;
          created_at?: string;
          email: string;
          guest_token?: string | null;
          id?: string;
          public_ref?: string | null;
          shipping_cents?: number;
          status?: string;
          subtotal_cents: number;
          tax_cents?: number;
          total_cents: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address_snapshot?: NonNullable<Json>;
          created_at?: string;
          email?: string;
          guest_token?: string | null;
          id?: string;
          public_ref?: string | null;
          shipping_cents?: number;
          status?: string;
          subtotal_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          fee_cents: number;
          id: string;
          method: string | null;
          net_cents: number;
          order_id: string;
          provider: string;
          provider_payment_id: string | null;
          raw_status: string | null;
          reference: string | null;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          created_at?: string;
          fee_cents?: number;
          id?: string;
          method?: string | null;
          net_cents: number;
          order_id: string;
          provider?: string;
          provider_payment_id?: string | null;
          raw_status?: string | null;
          reference?: string | null;
          status: string;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          fee_cents?: number;
          id?: string;
          method?: string | null;
          net_cents?: number;
          order_id?: string;
          provider?: string;
          provider_payment_id?: string | null;
          raw_status?: string | null;
          reference?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      product_categories: {
        Row: {
          category_id: string;
          product_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          product_id: string;
        };
        Update: {
          category_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_categories_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_media: {
        Row: {
          alt: string;
          created_at: string;
          height: number | null;
          id: string;
          path: string;
          sort_order: number;
          variant_id: string;
          width: number | null;
        };
        ComputedFields: never;
        Insert: {
          alt?: string;
          created_at?: string;
          height?: number | null;
          id?: string;
          path: string;
          sort_order?: number;
          variant_id: string;
          width?: number | null;
        };
        Update: {
          alt?: string;
          created_at?: string;
          height?: number | null;
          id?: string;
          path?: string;
          sort_order?: number;
          variant_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_media_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      product_tabs: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          product_id: string;
          sort_order: number;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string;
          created_at?: string;
          id?: string;
          product_id: string;
          sort_order?: number;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          product_id?: string;
          sort_order?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_tabs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          color_id: string;
          compare_at_cents: number | null;
          created_at: string;
          depth_cm: number | null;
          height_cm: number | null;
          id: string;
          material: string;
          price_cents: number;
          product_id: string;
          published: boolean;
          sku: string;
          stock: number;
          updated_at: string;
          weight_kg: number | null;
          width_cm: number | null;
        };
        ComputedFields: never;
        Insert: {
          color_id: string;
          compare_at_cents?: number | null;
          created_at?: string;
          depth_cm?: number | null;
          height_cm?: number | null;
          id?: string;
          material?: string;
          price_cents: number;
          product_id: string;
          published?: boolean;
          sku: string;
          stock?: number;
          updated_at?: string;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Update: {
          color_id?: string;
          compare_at_cents?: number | null;
          created_at?: string;
          depth_cm?: number | null;
          height_cm?: number | null;
          id?: string;
          material?: string;
          price_cents?: number;
          product_id?: string;
          published?: boolean;
          sku?: string;
          stock?: number;
          updated_at?: string;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_color_id_fkey';
            columns: ['color_id'];
            isOneToOne: false;
            referencedRelation: 'colors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          published: boolean;
          search: unknown;
          seo_description: string | null;
          seo_title: string | null;
          sku: string;
          slug: string;
          summary: string | null;
          updated_at: string;
          video_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          published?: boolean;
          search?: never;
          seo_description?: string | null;
          seo_title?: string | null;
          sku: string;
          slug: string;
          summary?: string | null;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          published?: boolean;
          search?: never;
          seo_description?: string | null;
          seo_title?: string | null;
          sku?: string;
          slug?: string;
          summary?: string | null;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string;
          id: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          author_name: string;
          body: string;
          created_at: string;
          id: string;
          order_id: string;
          rating: number;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
          variant_id: string;
        };
        ComputedFields: never;
        Insert: {
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          order_id: string;
          rating: number;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id: string;
          variant_id: string;
        };
        Update: {
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          order_id?: string;
          rating?: number;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_variant_stock: {
        Args: { p_qty: number; p_variant_id: string };
        Returns: undefined;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
