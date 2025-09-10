// Type definitions based on schema in supabase/schema.sql

export interface LaundryService {
  id: string
  name: string
  description: string | null
  price_per_item: string | null
  price_per_pound: string | null
  is_active: boolean
  created_at: string
}

export interface LaundryRequest {
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

export interface RequestService {
  id: string
  request_id: string
  service_id: string
  quantity: number
  estimated_cost: string | null
}

// Generic table helpers similar to Supabase-generated types
export interface Tables {
  laundry_services: {
    Row: LaundryService
    Insert: Partial<Pick<LaundryService, 'id' | 'created_at' | 'is_active'>> &
      Pick<LaundryService, 'name'> &
      Partial<Pick<LaundryService, 'description' | 'price_per_item' | 'price_per_pound'>>
    Update: Partial<LaundryService>
  }
  laundry_requests: {
    Row: LaundryRequest
    Insert: Partial<Pick<LaundryRequest, 'id' | 'status' | 'total_estimated_cost' | 'created_at'>> &
      Pick<
        LaundryRequest,
        'customer_name' | 'customer_email' | 'customer_phone' | 'pickup_address' | 'pickup_date' | 'pickup_time_slot'
      > &
      Partial<Pick<LaundryRequest, 'special_instructions'>>
    Update: Partial<LaundryRequest>
  }
  request_services: {
    Row: RequestService
    Insert: Partial<Pick<RequestService, 'id' | 'estimated_cost' | 'quantity'>> &
      Pick<RequestService, 'request_id' | 'service_id'>
    Update: Partial<RequestService>
  }
}

export type TableName = keyof Tables
export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']

// Helper types for forms and API
export interface CreateRequestPayload {
  request: Insert<'laundry_requests'>
  services: Array<Pick<RequestService, 'service_id' | 'quantity'>>
}

export type ApiSuccess<T> = { ok: true; data: T }
export type ApiFailure = { ok: false; error: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure


