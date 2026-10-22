# Catálogo público no Supabase

A migration `migrations/202610220001_catalog.sql` cria uma vitrine independente do pipeline antigo de ofertas. Os scripts Drizzle existentes continuam destinados ao banco do pipeline. Esta migration não altera esses scripts nem cadastra ofertas, links, preços ou administradores.

## Aplicar

No projeto Supabase correto, abra o **SQL Editor**, revise a migration e execute o arquivo completo com a conexão administrativa `postgres`. A transação aplica tabelas, constraints, funções, permissões e RLS em conjunto. A migration deve rodar uma única vez; registre sua aplicação no histórico do projeto. Quem já gerencia migrations com Supabase CLI pode aplicar este mesmo arquivo pelo fluxo de migrations do projeto.

A aplicação pública usa a URL do projeto e a chave **publishable** (ou a chave legada `anon`). O login administrativo usa Supabase Auth e a sessão do usuário. Confira os nomes dessas variáveis no `.env.example` do aplicativo. A chave `service_role`, senha do banco e credenciais administrativas nunca devem entrar no navegador ou em variáveis `NEXT_PUBLIC_*`. Não é necessário usar `service_role` para administrar o catálogo pelo aplicativo.

## Primeiro administrador

Crie o usuário pelo Supabase Auth. Confirme a identidade e copie seu UUID em **Authentication → Users**. Pelo SQL Editor, conectado como `postgres`, substitua o marcador abaixo pelo UUID real antes de executar:

```sql
begin;
insert into private.catalog_admins (user_id)
values ('UUID_REAL_DO_USUARIO_AUTH'::uuid)
on conflict (user_id) do nothing;
commit;
```

O marcador é intencionalmente um UUID inválido: o exemplo não promove nenhuma conta se for executado sem edição. A chave estrangeira exige um usuário existente. Não use dados de `user_metadata`, um parâmetro do navegador ou um usuário escolhido pelo próprio solicitante para conceder acesso. O cadastro/login comum não cria administradores.

Para revogar acesso, execute pelo mesmo canal privilegiado:

```sql
delete from private.catalog_admins
where user_id = 'UUID_REAL_DO_USUARIO_AUTH'::uuid;
```

A lista de administradores fica no schema `private`, sem acesso dos papéis `anon`, `authenticated` e `service_role`, com RLS ativado e nenhuma política de autoinscrição. `public.is_catalog_admin()` verifica somente o `auth.uid()` da sessão, sem aceitar um ID externo. A função tem `SECURITY DEFINER`, `search_path = ''` e nomes de objetos qualificados; apenas `authenticated` recebe `EXECUTE`. O proprietário da função deve continuar sendo a conexão administrativa que aplicou a migration.

## Contrato do catálogo

`public.catalog_items` contém `id` UUID, `slug` único, `title`, `description`, `kind`, `platform`, `category`, `tags` (`text[]`), `image_url`, `affiliate_url`, `price_cents`, `currency`, `badge`, `featured`, `sort_order`, `published`, `course_level`, `confirmed_at`, `created_at` e `updated_at`.

- `kind`: `course` ou `product`; `platform`: `hotmart`, `shopee`, `amazon` ou `mercadolivre`.
- `published` inicia como `false`. `featured` inicia como `false`; `sort_order` inicia em zero. Um trigger mantém `updated_at` no servidor.
- Imagem, link de afiliado, preço, nível, selo e confirmação podem ser nulos. `course_level` aceita `iniciante`, `intermediario` ou `avancado`, apenas para cursos. A descrição aceita até 5.000 caracteres. Imagens aceitam HTTPS ou caminhos locais em `/images/`, sem `..`, barras invertidas ou escapes percentuais.
- `price_cents` é um inteiro não negativo em BRL. Preço preenchido exige `confirmed_at`: o instante em que a pessoa administradora verificou o preço na fonte. Não informe preço sem verificar; use nulo e apresente “Consultar preço”. O timestamp registra a conferência e não garante que o preço continuará válido.
- Um item publicado exige link de afiliado e plataforma `hotmart` ou `shopee`. Amazon e Mercado Livre podem existir como rascunhos, mas a constraint bloqueia sua publicação enquanto a afiliação não estiver aprovada. A liberação futura exige uma migration revisada.

No TypeScript, os nomes correspondentes são `imageUrl`, `courseLevel` e `confirmedAt`; o banco usa `image_url`, `course_level` e `confirmed_at`.

## Links permitidos

O banco aceita apenas HTTPS, sem credenciais, portas explícitas ou espaços, nos hosts exatos abaixo. Subdomínios adicionais não são aceitos automaticamente.

| Plataforma                      | Hosts                                              |
| ------------------------------- | -------------------------------------------------- |
| Hotmart                         | `hotmart.com`, `go.hotmart.com`, `pay.hotmart.com` |
| Shopee                          | `shopee.com.br`, `s.shopee.com.br`, `shope.ee`     |
| Amazon, somente rascunho        | `amazon.com.br`, `amzn.to`                         |
| Mercado Livre, somente rascunho | `mercadolivre.com.br`, `meli.la`                   |

A constraint valida a estrutura e o host; ela não consulta o destino de redirecionamentos nem comprova a afiliação. Cadastre somente links reais obtidos da conta afiliada aprovada. Confira o produto/curso, o destino e qualquer preço imediatamente antes de publicar. Toda apresentação pública deve conter o aviso “link de afiliado”. Não há seed com ofertas inventadas.

## Permissões e conferência

`anon` recebe apenas `SELECT`, restrito a linhas publicadas. `authenticated` recebe permissões de CRUD, mas as políticas RLS só autorizam alterações quando a sessão pertence a `private.catalog_admins`. Usuários autenticados comuns também só leem linhas publicadas. Administradores leem os rascunhos. Não há permissões de `TRUNCATE`, `REFERENCES` ou `TRIGGER` para clientes.

Depois de aplicar, confira com clientes separados: visitante e usuário comum não veem rascunhos nem alteram itens; administrador cadastrado pode criar um rascunho, editar e excluir. Teste também que publicar sem link, publicar Amazon/Mercado Livre e gravar preço sem confirmação são rejeitados. Uma conexão `postgres` ignora RLS e não serve para provar isolamento entre usuários.

Referências oficiais: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database functions](https://supabase.com/docs/guides/database/functions) e [Securing your API](https://supabase.com/docs/guides/api/securing-your-api).

## Teste local de RLS

`tests/catalog-rls.sql` testa as permissões com `SET ROLE`, tenta autoinscrição administrativa e verifica constraints de URLs, publicação e preço. O arquivo só executa no banco descartável chamado `catalog_rls_validation`; todas as fixtures ficam em uma transação encerrada com `ROLLBACK`. Os links e preços sintéticos desse teste nunca são dados da vitrine.

Validação executada com PostgreSQL 16.15 local, em `127.0.0.1:55433`, autenticação SCRAM e senha aleatória, com os papéis `anon`, `authenticated` e `service_role` (`BYPASSRLS`) e uma implementação sintética de `auth.users`/`auth.uid()`. Em um cluster descartável, provisione esses papéis e o schema mínimo descrito no cabeçalho do teste, aplique a migration e execute:

```sh
psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 55433 -U postgres -d catalog_rls_validation -f supabase/tests/catalog-rls.sql
```

O resultado esperado termina em `PASS`. A validação local passou e o servidor foi encerrado. O mock reproduz as decisões de RLS no PostgreSQL; antes do lançamento, confira também o login e a leitura via Data API no projeto Supabase real. Não crie nem substitua o schema `auth` de um projeto Supabase para rodar este teste.
