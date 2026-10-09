create extension if not exists "pgcrypto";
create table if not exists public.profiles (id uuid primary key references auth.users on delete cascade, name text, phone text, role text not null default 'customer' check(role in('customer','admin')), created_at timestamptz default now());
create table if not exists public.products (id text primary key, title_ru text not null, title_en text not null, description_ru text, description_en text, price numeric(10,2) not null, old_price numeric(10,2), stock int not null default 0, image_url text, gallery jsonb default '[]', active boolean default true, created_at timestamptz default now());
create table if not exists public.orders (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, email text not null, phone text, address text, total numeric(10,2) not null, status text not null default 'new', created_at timestamptz default now());
create table if not exists public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid references public.orders on delete cascade, product_id text references public.products, quantity int not null, price numeric(10,2) not null);
create table if not exists public.support_threads (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, email text not null, status text default 'new', created_at timestamptz default now());
create table if not exists public.support_messages (id uuid primary key default gen_random_uuid(), thread_id uuid references public.support_threads on delete cascade, sender_id uuid references auth.users, body text not null, created_at timestamptz default now());
create table if not exists public.reviews (id uuid primary key default gen_random_uuid(), product_id text references public.products, user_id uuid references auth.users, rating int check(rating between 1 and 5), body text, admin_reply text, created_at timestamptz default now());
alter table public.profiles enable row level security; alter table public.products enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security; alter table public.support_threads enable row level security; alter table public.support_messages enable row level security; alter table public.reviews enable row level security;
create policy "products public read" on public.products for select using(active=true);
create policy "own profile" on public.profiles for all using(auth.uid()=id) with check(auth.uid()=id);
create policy "own orders" on public.orders for select using(auth.uid()=user_id);
create policy "create order" on public.orders for insert with check(auth.uid()=user_id or user_id is null);
create policy "own reviews read" on public.reviews for select using(true);
create policy "own reviews create" on public.reviews for insert with check(auth.uid()=user_id);
create policy "own threads" on public.support_threads for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
-- Admin policies should be added after assigning profiles.role='admin' to the real owner account.
