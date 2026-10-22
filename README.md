# Lojinha do Canal — Mary Hunter

Vitrine pública de cursos de programação e achadinhos para a comunidade do canal. Next.js App Router, React, Tailwind e Supabase, preparada para hospedar na Vercel. O monorepo também preserva a base anterior do bot de ofertas.

## Abrir a lojinha

No Windows, com as ferramentas portáteis locais já instaladas:

```powershell
cd D:\GrupoVendas
.\scripts\dev.cmd
```

Abra `http://127.0.0.1:3000`. O comando usa somente as ferramentas do projeto no D e não altera a política de execução do PowerShell. Em outra máquina, instale Node 22 e pnpm 10.18.3 e execute:

```sh
pnpm install
pnpm --filter @ofertas/panel dev
```

A página `/` é pública. `/admin` é a área de administração, com login Supabase e autorização por RLS. Busca, categorias, cursos/produtos, filtros, favoritos locais e detalhes funcionam sem cadastro de visitantes. O catálogo de prévia contém ilustrações próprias e dados identificados como demonstração, sem preços ou links de compra inventados.

## Conectar o Supabase e publicar na Vercel

Veja [apps/panel/README.md](apps/panel/README.md) para o passo a passo completo.

1. Crie seu projeto Supabase e aplique `supabase/migrations/202610220001_catalog.sql` no SQL Editor.
2. Crie seu usuário administrativo no Supabase Auth e autorize o UUID na tabela privada conforme [supabase/README.md](supabase/README.md).
3. Copie `apps/panel/.env.example` para `apps/panel/.env.local` e informe a URL do projeto, a chave pública publishable e `SITE_URL`. Nunca use `service_role` em variáveis públicas.
4. Entre em `/admin` para cadastrar os cursos e produtos, as imagens e seus links reais de afiliada. Hotmart, Shopee e Mercado Livre são as plataformas liberadas. Para o Mercado Livre no Supabase, aplique também `supabase/migrations/202610220002_enable_mercadolivre.sql`. Amazon continua como opção futura, bloqueada para publicação até a aprovação.
5. Na Vercel, importe o repositório com **Root Directory `apps/panel`**, framework Next.js, Node 22 e acesso aos arquivos externos do workspace. Configure as variáveis e faça o deploy.

O modo de demonstração é usado apenas quando não há Supabase configurado. Quando o Supabase está configurado, erros não exibem dados de demonstração como se fossem ofertas reais. Preços são opcionais, precisam de confirmação manual e deixam de ser exibidos após 24 horas. Não há integração fictícia com APIs de marketplaces nem envio automático de mensagens.

## Validação

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

As regras RLS do catálogo também têm teste SQL real e isolado em `supabase/tests/catalog-rls.sql`; veja o README do Supabase. Os testes antigos do banco Drizzle continuam em `pnpm test:integration` e exigem `TEST_DATABASE_URL` para PostgreSQL local.

## Estrutura

- `apps/panel`: vitrine pública, administração autenticada, páginas de transparência e destino seguro de links.
- `packages/core`: configuração Zod, modelos, validação de links, filtros e regras de preços.
- `supabase`: migration do catálogo, RLS, orientações de acesso e teste SQL.
- `packages/db`: banco da base do bot, com nove tabelas Drizzle, migrations, repositórios e seed.
- `apps/api`, `apps/worker`, `packages/connectors`, `packages/publishers`: estrutura reservada às fases futuras do bot.

A base do bot usa Postgres/Redis pelo Compose e os comandos `pnpm db:migrate`, `pnpm db:seed`. Seu seed mantém canais inativos e publicação pausada; `.env.example` contém as variáveis. A vitrine Next.js usa diretamente Supabase e não exige Redis para funcionar na Vercel.

## Local do projeto

A cópia ativa está em `D:\GrupoVendas`. Ferramentas locais ficam em `.tools` e o cache de pacotes em `.pnpm-store`, ambos ignorados pelo Git. As cópias de trabalho criadas no C foram removidas. O original antigo em E foi preservado devido às falhas de comunicação daquele disco.


As vitrines públicas agora são separadas: /shopee (laranja + lilás), /mercado-livre (amarelo + lilás) e /cursos. A página inicial apresenta entradas para cada loja. Fotos originais dos dez produtos do Mercado Livre, da webcam e a capa de Introdução à Programação já estão nos arquivos locais da vitrine.
