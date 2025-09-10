import { createClient, type PostgrestSingleResponse } from '@supabase/supabase-js'
import type { Insert, Row, Update } from '../types/database.ts'

// Support both Vite and CRA-style env variable names
const SUPABASE_URL =
  (import.meta as any).env?.REACT_APP_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY =
  (import.meta as any).env?.REACT_APP_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or VITE_ equivalents).')
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')

// Helper response types
export type ApiSuccess<T> = { ok: true; data: T }
export type ApiFailure = { ok: false; error: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

function mapPostgrest<T>(res: PostgrestSingleResponse<T>): ApiResponse<T> {
  if (res.error) return { ok: false, error: res.error.message }
  return { ok: true, data: res.data as T }
}

// Common operations
export async function listActiveServices() {
  const res = await supabase
    .from('laundry_services')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })
  return mapPostgrest<Row<'laundry_services'>[]>(res)
}

export async function createLaundryRequest(payload: Insert<'laundry_requests'>) {
  const res = await supabase
    .from('laundry_requests')
    .insert(payload)
    .select('*')
    .single()
  return mapPostgrest<Row<'laundry_requests'>>(res)
}

export async function addRequestService(payload: Insert<'request_services'>) {
  const res = await supabase
    .from('request_services')
    .insert(payload)
    .select('*')
    .single()
  return mapPostgrest<Row<'request_services'>>(res)
}

export async function updateRequest(
  id: string,
  patch: Update<'laundry_requests'>
) {
  const res = await supabase
    .from('laundry_requests')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  return mapPostgrest<Row<'laundry_requests'>>(res)
}

export async function getRequestWithServices(id: string) {
  const res = await supabase
    .from('laundry_requests')
    .select('*, request_services(*)')
    .eq('id', id)
    .single()
  return mapPostgrest<
    Row<'laundry_requests'> & { request_services: Row<'request_services'>[] }
  >(res as any)
}

// Form helper types
export interface RequestFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  pickup_address: string
  pickup_date: string
  pickup_time_slot: string
  special_instructions?: string | null
}

export interface RequestServiceFormItem {
  service_id: string
  quantity: number
}


