-- Public storefront: drafts are private, and admin membership is provisioned only
-- through a privileged database connection. No marketplace APIs or fake offers.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.catalog_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.catalog_admins enable row level security;
revoke all on table private.catalog_admins from public, anon, authenticated, service_role;

create function public.is_catalog_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.catalog_admins as administrators
    where administrators.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_catalog_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_catalog_admin() to authenticated;

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  kind text not null,
  platform text not null,
  category text not null default 'Geral',
  tags text[] not null default '{}',
  image_url text,
  affiliate_url text,
  price_cents integer,
  currency text not null default 'BRL',
  badge text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  published boolean not null default false,
  course_level text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_items_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 160),
  constraint catalog_items_title_valid check (length(btrim(title)) between 1 and 240),
  constraint catalog_items_description_length check (length(description) <= 5000),
  constraint catalog_items_category_valid check (length(btrim(category)) between 1 and 120),
  constraint catalog_items_kind_valid check (kind in ('course', 'product')),
  constraint catalog_items_platform_valid check (platform in ('hotmart', 'shopee', 'amazon', 'mercadolivre')),
  constraint catalog_items_currency_brl check (currency = 'BRL'),
  constraint catalog_items_price_nonnegative check (price_cents is null or price_cents >= 0),
  constraint catalog_items_price_confirmed check (price_cents is null or confirmed_at is not null),
  constraint catalog_items_course_level_valid check (course_level is null or (kind = 'course' and course_level in ('iniciante', 'intermediario', 'avancado'))),
  constraint catalog_items_image_valid check (image_url is null or image_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$' or (image_url ~ '^/images/[A-Za-z0-9][A-Za-z0-9._/-]*$' and position('..' in image_url) = 0)),
  constraint catalog_items_affiliate_platform_host check (
    affiliate_url is null or
    case platform
      when 'hotmart' then affiliate_url ~ '^https://(go\.hotmart\.com|hotmart\.com|pay\.hotmart\.com)([/?#][^[:space:]]*)?$'
      when 'shopee' then affiliate_url ~ '^https://(shopee\.com\.br|s\.shopee\.com\.br|shope\.ee)([/?#][^[:space:]]*)?$'
      when 'amazon' then affiliate_url ~ '^https://(amazon\.com\.br|amzn\.to)([/?#][^[:space:]]*)?$'
      when 'mercadolivre' then affiliate_url ~ '^https://(mercadolivre\.com\.br|meli\.la)([/?#][^[:space:]]*)?$'
      else false
    end
  ),
  constraint catalog_items_published_has_affiliate_link check (not published or affiliate_url is not null),
  -- Amazon and Mercado Livre remain drafts until affiliation is approved and a
  -- reviewed migration explicitly widens this constraint.
  constraint catalog_items_publishing_platform_enabled check (not published or platform in ('hotmart', 'shopee'))
);

create index catalog_items_published_order_idx
  on public.catalog_items (featured desc, sort_order, created_at desc)
  where published;
create index catalog_items_published_filters_idx
  on public.catalog_items (kind, platform, category)
  where published;

create function private.set_catalog_item_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.set_catalog_item_updated_at() from public, anon, authenticated, service_role;
create trigger catalog_items_set_updated_at
  before update on public.catalog_items
  for each row execute function private.set_catalog_item_updated_at();

alter table public.catalog_items enable row level security;
revoke all on table public.catalog_items from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated;
grant select on table public.catalog_items to anon;
grant select, insert, update, delete on table public.catalog_items to authenticated;

create policy catalog_items_public_read
  on public.catalog_items for select to anon, authenticated
  using (published);
create policy catalog_items_admin_read
  on public.catalog_items for select to authenticated
  using ((select public.is_catalog_admin()));
create policy catalog_items_admin_insert
  on public.catalog_items for insert to authenticated
  with check ((select public.is_catalog_admin()));
create policy catalog_items_admin_update
  on public.catalog_items for update to authenticated
  using ((select public.is_catalog_admin()))
  with check ((select public.is_catalog_admin()));
create policy catalog_items_admin_delete
  on public.catalog_items for delete to authenticated
  using ((select public.is_catalog_admin()));

comment on table public.catalog_items is 'Curated affiliate catalog. Public clients can read published entries only.';
comment on table private.catalog_admins is 'Admin membership managed only with a privileged database connection; no self-enrollment.';
comment on column public.catalog_items.confirmed_at is 'Time the administrator verified the displayed price with the affiliate source. Not a guarantee of future price.';

commit;