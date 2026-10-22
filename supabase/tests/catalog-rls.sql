-- ISOLATED LOCAL VALIDATION ONLY. Never run against a real Supabase project.
-- Requires a disposable database catalog_rls_validation, synthetic auth.users
-- (id uuid primary key), auth.uid() reading request.jwt.claim.sub, Supabase-like
-- anon/authenticated/service_role roles and the catalog migration already applied.
\set ON_ERROR_STOP on

do $$ begin
  if current_database() <> 'catalog_rls_validation' then
    raise exception 'Refusing to run fixtures outside disposable catalog_rls_validation';
  end if;
end $$;

begin;
insert into auth.users (id) values
 ('10000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000002');
insert into private.catalog_admins(user_id) values ('10000000-0000-4000-8000-000000000001');
insert into public.catalog_items(slug,title,kind,platform,affiliate_url,published,updated_at) values
 ('fixture-draft','Isolated fixture draft','course','hotmart',null,false,'2000-01-01'),
 ('fixture-hotmart','Isolated fixture published','course','hotmart','https://go.hotmart.com/fixture',true,now()),
 ('fixture-shopee','Isolated fixture published','product','shopee','https://s.shopee.com.br/fixture',true,now()),
 ('fixture-amazon','Isolated fixture disabled','product','amazon','https://amzn.to/fixture',false,now()),
 ('fixture-meli','Isolated fixture disabled','product','mercadolivre','https://meli.la/fixture',false,now());

set local role anon;
do $$ begin
  if (select count(*) from public.catalog_items) <> 2 then raise exception 'anon leaked drafts'; end if;
  begin
    perform public.is_catalog_admin();
    raise exception 'anon unexpectedly executed admin RPC';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.catalog_items(slug,title,kind,platform) values ('anon-insert','Forbidden','course','hotmart');
    raise exception 'anon unexpectedly inserted';
  exception when insufficient_privilege then null; end;
  begin
    update public.catalog_items set title = 'Forbidden';
    raise exception 'anon unexpectedly updated';
  exception when insufficient_privilege then null; end;
  begin
    perform user_id from private.catalog_admins;
    raise exception 'anon unexpectedly read admin membership';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$ declare changed integer; begin
  if public.is_catalog_admin() then raise exception 'ordinary user is admin'; end if;
  if (select count(*) from public.catalog_items) <> 2 then raise exception 'ordinary user leaked drafts'; end if;
  begin
    insert into public.catalog_items(slug,title,kind,platform) values ('ordinary-insert','Forbidden','course','hotmart');
    raise exception 'ordinary user unexpectedly inserted';
  exception when insufficient_privilege then null; end;
  update public.catalog_items set title = 'Forbidden';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'ordinary user unexpectedly updated rows'; end if;
  delete from public.catalog_items;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'ordinary user unexpectedly deleted rows'; end if;
  begin
    insert into private.catalog_admins(user_id) values ('10000000-0000-4000-8000-000000000002');
    raise exception 'ordinary user promoted itself';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ declare changed integer; item_published boolean; item_updated timestamptz; bad_url text; i integer := 0; begin
  if not public.is_catalog_admin() then raise exception 'admin membership not recognized'; end if;
  if (select count(*) from public.catalog_items) <> 5 then raise exception 'admin cannot read drafts'; end if;
  insert into public.catalog_items(slug,title,kind,platform) values ('admin-created','Admin fixture','course','hotmart') returning published into item_published;
  if item_published then raise exception 'default publishes items'; end if;
  update public.catalog_items set title = 'Edited fixture' where slug = 'fixture-draft' returning updated_at into item_updated;
  if item_updated <= '2000-01-01'::timestamptz then raise exception 'updated_at trigger did not run'; end if;
  delete from public.catalog_items where slug = 'admin-created';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'admin cannot delete'; end if;
  begin
    update public.catalog_items set published = true where slug = 'fixture-draft';
    raise exception 'published without affiliate URL';
  exception when check_violation then null; end;
  begin
    update public.catalog_items set published = true where slug = 'fixture-amazon';
    raise exception 'Amazon published before approval';
  exception when check_violation then null; end;
  begin
    update public.catalog_items set published = true where slug = 'fixture-meli';
    raise exception 'Mercado Livre published before approval';
  exception when check_violation then null; end;
  begin
    update public.catalog_items set price_cents = 12345 where slug = 'fixture-draft';
    raise exception 'price accepted without confirmation';
  exception when check_violation then null; end;
  begin
    update public.catalog_items set price_cents = -1, confirmed_at = now() where slug = 'fixture-draft';
    raise exception 'negative price accepted';
  exception when check_violation then null; end;
  begin
    update public.catalog_items set description = repeat('x', 5001) where slug = 'fixture-draft';
    raise exception 'overlong description accepted';
  exception when check_violation then null; end;
  begin
    update public.catalog_items set course_level = 'expert' where slug = 'fixture-draft';
    raise exception 'invalid course level accepted';
  exception when check_violation then null; end;
  begin
    update public.catalog_items set course_level = 'iniciante' where slug = 'fixture-shopee';
    raise exception 'course level accepted for a product';
  exception when check_violation then null; end;
  update public.catalog_items set course_level = 'intermediario' where slug = 'fixture-draft';
  update public.catalog_items set price_cents = 12345, confirmed_at = now() where slug = 'fixture-draft';
  foreach bad_url in array array[
    'https://go.hotmart.com.evil.example/fixture',
    'https://go.hotmart.com@evil.example/fixture',
    'https://evil.example/?target=https://go.hotmart.com',
    'http://go.hotmart.com/fixture',
    'https://go.hotmart.com:443/fixture',
    'https://go.hotmart.com/has space',
    'https://shopee.com.br/fixture'
  ] loop
    i := i + 1;
    begin
      insert into public.catalog_items(slug,title,kind,platform,affiliate_url) values ('bad-host-' || i,'URL fixture','course','hotmart',bad_url);
      raise exception 'unsafe platform URL accepted: %', bad_url;
    exception when check_violation then null; end;
  end loop;
  begin
    insert into private.catalog_admins(user_id) values ('10000000-0000-4000-8000-000000000002');
    raise exception 'frontend admin unexpectedly changed membership';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role service_role;
do $$ begin
  begin
    perform id from public.catalog_items;
    raise exception 'service role unexpectedly has catalog grants';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

rollback;
\echo 'PASS: public read, admin CRUD, no self-enrollment, explicit grants, URL and publication/price constraints'