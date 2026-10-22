# Lojinha do Canal — Mary Hunter

Next.js App Router. A página `/` é pública; `/admin` usa Supabase Auth com e-mail/senha e autorização no banco. Não há cadastro aberto nem credenciais administrativas no código. Sem Supabase, a vitrine de demonstração continua disponível e o admin mostra como conectar.

## Desenvolvimento

Na raiz do monorepo, use Node 22 e pnpm:

```sh
pnpm install
pnpm --filter @ofertas/panel dev
```

Crie `apps/panel/.env.local` a partir de `apps/panel/.env.example`, se disponível, e configure:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

Use a URL e a chave publishable fornecidas em **Supabase → Project Settings → API**. A chave pública identifica o projeto e depende das políticas RLS para limitar o acesso. Nunca coloque `service_role`, segredo JWT ou senha do banco em `NEXT_PUBLIC_*`. Os dois valores públicos precisam pertencer ao mesmo projeto. Reinicie o servidor após alterar o ambiente.

## Banco e primeiro administrador

No SQL Editor do projeto Supabase, aplique uma vez o arquivo completo `supabase/migrations/202610220001_catalog.sql`, a partir da raiz do repositório. Ele cria o catálogo, as políticas RLS e a função `is_catalog_admin`. Leia `supabase/README.md` antes de aplicar em um projeto existente.

Em **Authentication → Users**, crie o usuário administrativo com e-mail e senha. Confirme o e-mail pelo fluxo do Supabase ou use a confirmação administrativa ao criar a conta. Copie o UUID real e, pelo SQL Editor conectado como administrador do banco, execute:

```sql
insert into private.catalog_admins (user_id)
values ('UUID_REAL_DO_USUARIO_AUTH'::uuid)
on conflict (user_id) do nothing;
```

O marcador não é um UUID válido: substitua-o pelo ID da conta criada. Não conceda acesso com base em metadados editáveis pelo usuário. Para impedir cadastros por outros clientes, desative **Allow new users to sign up** nas configurações do Supabase Auth. O aplicativo não oferece inscrição automática.

Configure o **Site URL** do Supabase Auth com a URL pública do aplicativo e os redirecionamentos necessários ao fluxo de e-mail que usar. O login do painel usa senha diretamente, sem OAuth. O proxy do Next.js em `src/proxy.ts` renova cookies de sessão somente em `/admin`; as respostas administrativas usam `Cache-Control: private, no-store`. A autorização permanece no guard e nas políticas RLS.

Para revogar um administrador:

```sql
delete from private.catalog_admins
where user_id = 'UUID_REAL_DO_USUARIO_AUTH'::uuid;
```

A interface chama `auth.getUser()` e `rpc('is_catalog_admin')` antes de listar ou alterar itens. RLS protege o banco também contra chamadas diretas feitas fora da interface. Visitantes e usuários comuns só leem publicados; somente administradores autorizados podem fazer CRUD e ler rascunhos.

## Uso

Entre em `/admin` com a conta autorizada. Crie e edite cursos ou produtos, informando título, slug único, descrição, categoria, tags e imagem. A imagem pode ser local em `/images/` ou HTTPS; arquivos locais precisam estar em `apps/panel/public/images` antes do deploy. Use apenas imagens com permissão de uso.

Cole o link real obtido no programa de afiliados. A validação permite os hosts específicos documentados em `supabase/README.md`; itens publicados ficam restritos a Hotmart e Shopee. Amazon e Mercado Livre ficam como rascunhos até a liberação desses programas. A validação do host não comprova que o link gera comissão: confira a conta e o destino.

O preço é opcional, em centavos inteiros BRL: `4990` representa R$ 49,90. Deixe vazio para “consultar preço”. Para salvar um preço, confira-o na página de origem e marque a confirmação; o horário atual é gravado em `confirmed_at`. A vitrine oculta preços com confirmação vencida. Nenhum preço é gerado automaticamente.

Marque **Publicar no catálogo** quando os dados estiverem conferidos. **Arquivar** desmarca a publicação, mantendo o registro como rascunho. **Excluir** remove definitivamente após confirmação. O painel não envia mensagens nem integra APIs de marketplaces.

## Vercel

1. Importe o repositório Git na Vercel e selecione o framework **Next.js**.
2. Defina **Root Directory** como `apps/panel`. Habilite a inclusão de arquivos fora do Root Directory para que o pacote workspace `packages/core` participe do build.
3. Use `pnpm install --frozen-lockfile` para instalação e `pnpm build` para build a partir desse diretório. O lockfile e o workspace ficam na raiz do monorepo; mantenha ambos versionados. A saída é a padrão do Next.js.
4. Selecione Node.js 22 nas configurações e adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` aos ambientes desejados (Production e Preview). Não adicione service role.
5. Faça o deploy e atualize Site URL/redirecionamentos no Supabase Auth para o domínio publicado. Alterações de variáveis `NEXT_PUBLIC_*` exigem novo deploy.
6. Abra `/` sem sessão; em seguida, teste `/admin` com conta autorizada e conta comum. Confira que a conta comum não consegue alterar dados, mesmo usando o cliente diretamente.

Antes da publicação, execute na raiz `pnpm typecheck`, `pnpm lint`, `pnpm test` e `pnpm --filter @ofertas/panel build`. O teste do guard administrativo cobre falta de usuário, sessão inválida e permissão ausente ou malformada; a verificação real de RLS requer o projeto Supabase configurado.

Referências oficiais: [login por senha](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [verificação do usuário](https://supabase.com/docs/reference/javascript/auth-getuser), [logout](https://supabase.com/docs/reference/javascript/auth-signout), [monorepos na Vercel](https://vercel.com/docs/monorepos).

Sessão SSR: [guia oficial Supabase para Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).
