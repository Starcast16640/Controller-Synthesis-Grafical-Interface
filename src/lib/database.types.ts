export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      sensors: {
        Row: {
          id: string;
          name: string;
          type: 'Boolean' | 'Integer' | 'Real';
          machine: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'Boolean' | 'Integer' | 'Real';
          machine: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'Boolean' | 'Integer' | 'Real';
          machine?: string;
          created_at?: string;
        };
      };
      observers: {
        Row: {
          id: string;
          name: string;
          type: 'expression' | 'counter' | 'jk_flip_flop';
          expressions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'expression' | 'counter' | 'jk_flip_flop';
          expressions: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'expression' | 'counter' | 'jk_flip_flop';
          expressions?: Json;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          name: string;
          type: string[];
          authorization_expression: string;
          final_condition: string;
          max_simultaneous_executions: number;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string[];
          authorization_expression?: string;
          final_condition?: string;
          max_simultaneous_executions?: number;
          priority?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string[];
          authorization_expression?: string;
          final_condition?: string;
          max_simultaneous_executions?: number;
          priority?: number;
          created_at?: string;
        };
      };
      incompatibility_links: {
        Row: {
          id: string;
          task_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          task_ids: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          task_ids: string[];
          created_at?: string;
        };
      };
      succession_arrows: {
        Row: {
          id: string;
          from_type: 'task' | 'node';
          from_id: string;
          to_type: 'task' | 'node';
          to_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_type: 'task' | 'node';
          from_id: string;
          to_type: 'task' | 'node';
          to_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_type?: 'task' | 'node';
          from_id?: string;
          to_type?: 'task' | 'node';
          to_id?: string;
          created_at?: string;
        };
      };
      succession_nodes: {
        Row: {
          id: string;
          expression: string;
          split_type: 'both' | 'only_one' | 'none';
          position_x: number;
          position_y: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          expression?: string;
          split_type: 'both' | 'only_one' | 'none';
          position_x?: number;
          position_y?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          expression?: string;
          split_type: 'both' | 'only_one' | 'none';
          position_x?: number;
          position_y?: number;
          created_at?: string;
        };
      };
    };
  };
}

export type Sensor = Database['public']['Tables']['sensors']['Row'];
export type Observer = Database['public']['Tables']['observers']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type IncompatibilityLink = Database['public']['Tables']['incompatibility_links']['Row'];
export type SuccessionArrow = Database['public']['Tables']['succession_arrows']['Row'];
export type SuccessionNode = Database['public']['Tables']['succession_nodes']['Row'];
