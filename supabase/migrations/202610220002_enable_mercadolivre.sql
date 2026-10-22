-- Aprovação da afiliação Mercado Livre confirmada pela Mary.
-- Amazon continua restrita a rascunhos.
begin;
alter table public.catalog_items
  drop constraint catalog_items_publishing_platform_enabled;
alter table public.catalog_items
  add constraint catalog_items_publishing_platform_enabled
  check (not published or platform in ('hotmart', 'shopee', 'mercadolivre'));
commit;