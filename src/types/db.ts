export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Tables {
  laundry_services: {
    Row: {
      id: string
      name: string
      description: string | null
      price_per_item: string | null
      price_per_pound: string | null
      is_active: boolean
      created_at: string
    }
    Insert: {
      id?: string
      name: string
      description?: string | null
      price_per_item?: string | null
      price_per_pound?: string | null
      is_active?: boolean
      created_at?: string
    }
    Update: {
      id?: string
      name?: string
      description?: string | null
      price_per_item?: string | null
      price_per_pound?: string | null
      is_active?: boolean
      created_at?: string
    }
  }
  laundry_requests: {
    Row: {
      id: string
      customer_name: string
      customer_email: string
      customer_phone: string
      pickup_address: string
      pickup_date: string
      pickup_time_slot: string
      special_instructions: string | null
      status: 'pending' | 'confirmed' | 'in_progress' | 'completed'
      total_estimated_cost: string | null
      created_at: string
    }
    Insert: {
      id?: string
      customer_name: string
      customer_email: string
      customer_phone: string
      pickup_address: string
      pickup_date: string
      pickup_time_slot: string
      special_instructions?: string | null
      status?: 'pending' | 'confirmed' | 'in_progress' | 'completed'
      total_estimated_cost?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      customer_name?: string
      customer_email?: string
      customer_phone?: string
      pickup_address?: string
      pickup_date?: string
      pickup_time_slot?: string
      special_instructions?: string | null
      status?: 'pending' | 'confirmed' | 'in_progress' | 'completed'
      total_estimated_cost?: string | null
      created_at?: string
    }
  }
  request_services: {
    Row: {
      id: string
      request_id: string
      service_id: string
      quantity: number
      estimated_cost: string | null
    }
    Insert: {
      id?: string
      request_id: string
      service_id: string
      quantity?: number
      estimated_cost?: string | null
    }
    Update: {
      id?: string
      request_id?: string
      service_id?: string
      quantity?: number
      estimated_cost?: string | null
    }
  }
}

export type TableName = keyof Tables

export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']


