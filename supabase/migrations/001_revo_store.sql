create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  title_ru text not null,
  title_en text not null,
  description_ru text,
  description_en text,
  category text not null default 'medium',
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2) check (old_price is null or old_price >= 0),
  stock int not null default 0 check (stock >= 0),
  image_url text,
  gallery jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('RV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  comment text,
  total numeric(10,2) not null check (total >= 0),
  status text not null default 'new' check (status in ('new', 'work', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id text not null references public.products,
  quantity int not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0)
);

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  email text not null,
  subject text not null,
  status text not null default 'new' check (status in ('new', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads on delete cascade,
  sender_id uuid references auth.users on delete set null,
  sender_role text not null check (sender_role in ('customer', 'admin')),
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null check (length(trim(body)) > 0),
  admin_reply text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists support_threads_user_id_idx on public.support_threads(user_id);
create index if not exists support_messages_thread_id_idx on public.support_messages(thread_id);
create index if not exists reviews_product_id_idx on public.reviews(product_id);

insert into public.products
  (id, title_ru, title_en, description_ru, description_en, category, price, old_price, stock, image_url, gallery)
values
  ('morning', 'REVO Утренний кофе', 'REVO Morning', 'Сбалансированный кофе с нотами карамели и цитруса.', 'Balanced coffee with caramel and citrus notes.', 'medium', 5.99, 7.49, 24, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-03.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-03.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-10.png"]'),
  ('origin', 'REVO Ориджин', 'REVO Origin', 'Чистый вкус отборной арабики из высокогорья.', 'A clean taste of selected highland arabica.', 'light', 6.49, null, 18, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-02.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-02.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-10.png"]'),
  ('honey', 'REVO Хани', 'REVO Honey', 'Медовая сладость, какао и долгое послевкусие.', 'Honey sweetness, cocoa and a long finish.', 'medium', 7.29, null, 31, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-01.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-01.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-04.png"]'),
  ('everyday', 'REVO На каждый день', 'REVO Everyday', 'Универсальный кофе для фильтра и чашки.', 'An easy everyday coffee for filter and cup.', 'medium', 5.49, null, 42, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-06.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-06.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-15.png"]'),
  ('natural', 'REVO Натурал', 'REVO Natural', 'Фруктовый профиль натуральной обработки.', 'A fruity natural-process flavor profile.', 'light', 6.89, null, 20, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-12.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-12.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-11.png"]'),
  ('dam-da', 'REVO Дам Да', 'REVO Đậm Đà', 'Насыщенный кофе с шоколадной плотностью.', 'Full-bodied coffee with chocolate depth.', 'dark', 6.69, null, 15, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-17.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-17.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-08.png"]'),
  ('giftset', 'Подарочный набор REVO', 'REVO Gift Set', 'Вьетнамский кофе, золотой фильтр и подарочная упаковка.', 'Vietnamese coffee, a golden filter and gift packaging.', 'gift', 24.90, 29.90, 9, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-05.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-05.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-16.png"]'),
  ('honey-combo', 'Комбо REVO Хани', 'REVO Honey Combo', 'Кофе REVO Honey и фирменная чашка-фильтр.', 'REVO Honey coffee with a signature filter cup.', 'combo', 12.90, null, 12, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-04.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-04.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-01.png"]'),
  ('natural-combo', 'Комбо REVO Натурал', 'REVO Natural Combo', 'Натуральный кофе и зелёная чашка-фильтр.', 'Natural coffee with a green filter cup.', 'combo', 12.90, null, 12, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-11.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-11.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-12.png"]'),
  ('everyday-combo', 'Комбо REVO На каждый день', 'REVO Everyday Combo', 'Любимый кофе и голубая чашка для заваривания.', 'Everyday coffee and a blue brewing cup.', 'combo', 11.90, null, 14, 'https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-15.png', '["https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-15.png","https://vasiliy2197463-jpg.github.io/revo-project-9/assets/revo/raw-06.png"]')
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles admin manage" on public.profiles;
create policy "profiles admin manage" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (active = true or public.is_admin());
drop policy if exists "products admin manage" on public.products;
create policy "products admin manage" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders own read" on public.orders;
create policy "orders own read" on public.orders for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "orders own create" on public.orders;
create policy "orders own create" on public.orders for insert with check (auth.uid() = user_id and user_id is not null);
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders admin delete" on public.orders;
create policy "orders admin delete" on public.orders for delete using (public.is_admin());

drop policy if exists "order items own read" on public.order_items;
create policy "order items own read" on public.order_items for select using (exists (
  select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
));
drop policy if exists "order items own create" on public.order_items;
create policy "order items own create" on public.order_items for insert with check (exists (
  select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
));
drop policy if exists "order items admin delete" on public.order_items;
create policy "order items admin delete" on public.order_items for delete using (public.is_admin());

drop policy if exists "threads own read" on public.support_threads;
create policy "threads own read" on public.support_threads for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "threads own create" on public.support_threads;
create policy "threads own create" on public.support_threads for insert with check (auth.uid() = user_id and user_id is not null);
drop policy if exists "threads participant update" on public.support_threads;
create policy "threads participant update" on public.support_threads for update
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
drop policy if exists "threads participant delete" on public.support_threads;
create policy "threads participant delete" on public.support_threads for delete using (auth.uid() = user_id or public.is_admin());

drop policy if exists "messages participant read" on public.support_messages;
create policy "messages participant read" on public.support_messages for select using (exists (
  select 1 from public.support_threads t where t.id = thread_id and (t.user_id = auth.uid() or public.is_admin())
));
drop policy if exists "messages participant create" on public.support_messages;
create policy "messages participant create" on public.support_messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.support_threads t where t.id = thread_id and (t.user_id = auth.uid() or public.is_admin()))
  and ((public.is_admin() and sender_role = 'admin') or (not public.is_admin() and sender_role = 'customer'))
);

drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);
drop policy if exists "reviews own create" on public.reviews;
create policy "reviews own create" on public.reviews for insert with check (auth.uid() = user_id);
drop policy if exists "reviews own update" on public.reviews;
create policy "reviews own update" on public.reviews for update
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
drop policy if exists "reviews own delete" on public.reviews;
create policy "reviews own delete" on public.reviews for delete using (auth.uid() = user_id or public.is_admin());

revoke update (role) on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (name, phone, updated_at) on public.profiles to authenticated;

-- Execute once after the owner has registered:
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'owner@example.com');
