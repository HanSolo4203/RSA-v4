-- Supabase schema for Laundry Service app
-- Run this in the Supabase SQL editor or via migrations

-- Enable extensions commonly available in Supabase projects
create extension if not exists pgcrypto;

-- 1) laundry_services
create table if not exists public.laundry_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_per_item numeric(10,2),
  price_per_pound numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) laundry_requests
create table if not exists public.laundry_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  pickup_address text not null,
  pickup_date date not null,
  pickup_time_slot text not null,
  special_instructions text,
  status text not null default 'pending' check (status in ('pending','confirmed','in_progress','completed')),
  total_estimated_cost numeric(10,2),
  created_at timestamptz not null default now()
);

-- 3) request_services (junction table)
create table if not exists public.request_services (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.laundry_requests(id) on delete cascade,
  service_id uuid not null references public.laundry_services(id) on delete restrict,
  quantity integer not null default 1 check (quantity >= 0),
  estimated_cost numeric(10,2)
);

-- Helpful indexes
create index if not exists idx_request_services_request_id on public.request_services(request_id);
create index if not exists idx_request_services_service_id on public.request_services(service_id);
create index if not exists idx_laundry_services_is_active on public.laundry_services(is_active);
create index if not exists idx_laundry_requests_status on public.laundry_requests(status);

-- Row Level Security (RLS)
alter table public.laundry_services enable row level security;
alter table public.laundry_requests enable row level security;
alter table public.request_services enable row level security;

-- Policies
-- NOTE: Client-side (anon key) should only read active services and create requests.
-- Admin/service operations should use the service role (bypasses RLS) from a secure environment.

-- laundry_services: allow anonymous read of active services only
drop policy if exists "Public can read active services" on public.laundry_services;
create policy "Public can read active services"
  on public.laundry_services
  for select
  using (is_active = true);

-- laundry_requests: allow anonymous inserts (creating a request)
drop policy if exists "Public can create requests" on public.laundry_requests;
create policy "Public can create requests"
  on public.laundry_requests
  for insert
  with check (true);

-- request_services: allow anonymous inserts tied to a request
drop policy if exists "Public can add request services" on public.request_services;
create policy "Public can add request services"
  on public.request_services
  for insert
  with check (true);

-- No public updates/deletes by default
