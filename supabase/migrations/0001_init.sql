-- ============================================================================
-- Casa Lumen / NOMAHOME — esquema inicial
-- Fase 1: tablas, índices, triggers, RLS, storage.
-- Convenciones:
--   * Montos en centavos enteros (MXN). IVA 16% incluido en precio de vitrina.
--   * Escrituras de pedidos, pagos, carritos y facturas: solo service role
--     desde Route Handlers / Server Actions. El cliente no tiene policies
--     de escritura sobre esas tablas.
--   * Admin se verifica SIEMPRE en servidor con profiles.role = 'admin'
--     a través de public.is_admin() (security definer).
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- Funciones auxiliares
-- ============================================================================

-- Marca updated_at en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Crea el profile al registrarse el usuario en auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================================
-- profiles
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Verificación de rol admin en servidor. Security definer para que la
-- verificación no dependa de que el caller pueda leer profiles.
-- Va DESPUÉS de profiles: las funciones SQL validan el cuerpo al crearse.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
$$;

-- El cliente jamás puede cambiarse el rol a sí mismo: solo puede tocar
-- full_name y phone (grants a nivel columna).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================================
-- categories — árbol de un nivel en v1
-- ============================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_sort_idx on public.categories (sort_order);

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "categories_admin_write"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- products
-- ============================================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name text not null,
  summary text,
  description text,
  published boolean not null default false,
  video_url text,
  seo_title text,
  seo_description text,
  search tsvector generated always as (
    to_tsvector(
      'spanish',
      coalesce(name, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_search_idx on public.products using gin (search);
create index products_published_idx on public.products (published);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "products_public_read_published"
  on public.products for select
  to anon, authenticated
  using (published = true);

create policy "products_admin_write"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- product_categories — un producto vive en varias categorías
-- ============================================================================
create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

alter table public.product_categories enable row level security;

create policy "product_categories_public_read"
  on public.product_categories for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.published = true
    )
  );

create policy "product_categories_admin_write"
  on public.product_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- colors
-- ============================================================================
create table public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hex text not null check (hex ~* '^#[0-9a-f]{6}$'),
  created_at timestamptz not null default now()
);

alter table public.colors enable row level security;

create policy "colors_public_read"
  on public.colors for select
  to anon, authenticated
  using (true);

create policy "colors_admin_write"
  on public.colors for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- product_variants — color, SKU, precio y stock viven AQUÍ
-- ============================================================================
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  color_id uuid not null references public.colors(id),
  material text not null default '',
  width_cm integer check (width_cm is null or width_cm > 0),
  depth_cm integer check (depth_cm is null or depth_cm > 0),
  height_cm integer check (height_cm is null or height_cm > 0),
  weight_kg numeric(8, 2) check (weight_kg is null or weight_kg > 0),
  price_cents integer not null check (price_cents >= 0),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents >= 0),
  stock integer not null default 0 check (stock >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_variants_product_idx on public.product_variants (product_id);
create index product_variants_color_idx on public.product_variants (color_id);

create trigger trg_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

alter table public.product_variants enable row level security;

create policy "variants_public_read_published"
  on public.product_variants for select
  to anon, authenticated
  using (
    published = true
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.published = true
    )
  );

create policy "variants_admin_write"
  on public.product_variants for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- product_media
-- ============================================================================
create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  path text not null,
  alt text not null default '',
  width integer,
  height integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_media_variant_idx on public.product_media (variant_id, sort_order);

alter table public.product_media enable row level security;

create policy "media_public_read_published"
  on public.product_media for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = variant_id
        and v.published = true
        and p.published = true
    )
  );

create policy "media_admin_write"
  on public.product_media for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- product_tabs — pestañas ordenables de la ficha
-- ============================================================================
create table public.product_tabs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_tabs_product_idx on public.product_tabs (product_id, sort_order);

alter table public.product_tabs enable row level security;

create policy "tabs_public_read_published"
  on public.product_tabs for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.published = true
    )
  );

create policy "tabs_admin_write"
  on public.product_tabs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- homepage_blocks — bloques del home ordenables por el admin
-- ============================================================================
create table public.homepage_blocks (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('opening', 'categories', 'pieces', 'craft_note', 'contact')),
  title text not null default '',
  body text,
  product_id uuid references public.products(id) on delete set null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homepage_blocks_sort_idx on public.homepage_blocks (sort_order);

create trigger trg_homepage_blocks_updated_at
  before update on public.homepage_blocks
  for each row execute function public.set_updated_at();

alter table public.homepage_blocks enable row level security;

create policy "home_blocks_public_read_published"
  on public.homepage_blocks for select
  to anon, authenticated
  using (published = true);

create policy "home_blocks_admin_write"
  on public.homepage_blocks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- addresses
-- ============================================================================
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  phone text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_idx on public.addresses (user_id);

create trigger trg_addresses_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

alter table public.addresses enable row level security;

create policy "addresses_select_own_or_admin"
  on public.addresses for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "addresses_insert_own"
  on public.addresses for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "addresses_update_own"
  on public.addresses for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "addresses_delete_own"
  on public.addresses for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- carts — escritura solo vía service role (server actions)
-- ============================================================================
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null,
  status text not null default 'open' check (status in ('open', 'ordered', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index carts_session_idx on public.carts (session_id);
create index carts_user_idx on public.carts (user_id);

create trigger trg_carts_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

alter table public.carts enable row level security;

-- Solo lectura del dueño/admin. Sin policies de escritura para el cliente:
-- el carrito se manipula con service role desde el servidor.
create policy "carts_select_own_or_admin"
  on public.carts for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- cart_items
-- ============================================================================
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  qty integer not null check (qty > 0),
  created_at timestamptz not null default now()
);

create index cart_items_cart_idx on public.cart_items (cart_id);
create unique index cart_items_cart_variant_uq on public.cart_items (cart_id, variant_id);

alter table public.cart_items enable row level security;

create policy "cart_items_select_own_or_admin"
  on public.cart_items for select
  to authenticated
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and (c.user_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- orders — escritura SOLO service role desde el servidor
-- ============================================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'cancelled', 'fulfilled')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  address_snapshot jsonb not null default '{}'::jsonb,
  public_ref text unique,
  guest_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

create policy "orders_select_own_or_admin"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Sin insert/update/delete para el cliente: jamás se marca paid desde el
-- navegador, ni siquiera siendo dueño del pedido.

-- ============================================================================
-- order_items
-- ============================================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  name_snapshot text not null,
  sku_snapshot text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  qty integer not null check (qty > 0),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);

alter table public.order_items enable row level security;

create policy "order_items_select_own_or_admin"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- payments — ledger. Sin columnas de tarjeta: nunca se capturan.
-- ============================================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'spei',
  provider_payment_id text unique,
  status text not null,
  method text,
  reference text,
  amount_cents integer not null check (amount_cents >= 0),
  fee_cents integer not null default 0 check (fee_cents >= 0),
  net_cents integer not null check (net_cents >= 0),
  raw_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy "payments_select_own_or_admin"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- Sin escritura desde cliente: el ledger se alimenta con service role desde
-- el webhook firmado o la confirmación del taller.

-- ============================================================================
-- invoices — CFDI 4.0 vía Facturapi
-- ============================================================================
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  rfc text not null,
  legal_name text not null,
  tax_regime text not null,
  cfdi_use text not null,
  postal_code text not null,
  uuid text,
  status text not null default 'requested'
    check (status in ('requested', 'stamped', 'canceled')),
  xml_url text,
  pdf_url text,
  total_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_status_idx on public.invoices (status);

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;

create policy "invoices_select_own_or_admin"
  on public.invoices for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- reviews — solo compradores verificados; autor visible sin filtrar profiles
-- ============================================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  author_name text not null default '',
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_variant_idx on public.reviews (variant_id);
create index reviews_order_idx on public.reviews (order_id);
create index reviews_status_idx on public.reviews (status);

create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;

create policy "reviews_public_read_published"
  on public.reviews for select
  to anon, authenticated
  using (status = 'published' or user_id = auth.uid());

-- Insertar pendiente SOLO si existe un pedido pagado del usuario con esa
-- variante (reseña de compra verificada).
create policy "reviews_insert_verified_buyer"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where o.user_id = auth.uid()
        and o.status = 'paid'
        and oi.variant_id = variant_id
    )
  );

create policy "reviews_admin_moderate"
  on public.reviews for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "reviews_admin_delete"
  on public.reviews for delete
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- favorites
-- ============================================================================
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.favorites enable row level security;

create policy "favorites_select_own"
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

create policy "favorites_insert_own"
  on public.favorites for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "favorites_delete_own"
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- audit_logs — cada mutación admin deja rastro. Escritura: service role.
-- ============================================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_read"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- messages — formulario de contacto. Insert anónimo; lectura: service role.
-- ============================================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages_anon_insert"
  on public.messages for insert
  to anon, authenticated
  with check (true);

-- ============================================================================
-- Storage — buckets de medios de producto (público) y facturas (privado)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- product-media: lectura pública; escritura solo admin.
create policy "product_media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-media');

create policy "product_media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-media' and public.is_admin());

create policy "product_media_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-media' and public.is_admin())
  with check (bucket_id = 'product-media' and public.is_admin());

create policy "product_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-media' and public.is_admin());

-- invoices: lectura solo del dueño del objeto o admin. Escritura: service role.
-- owner_id en storage.objects es text: se compara contra auth.uid()::text.
create policy "invoices_owner_or_admin_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'invoices'
    and (owner_id = auth.uid()::text or public.is_admin())
  );
