# Lojinha do Canal — Mary Hunter

Next.js App Router. A página `/` é pública; `/admin` usa Supabase Auth com e-mail/senha e autorização no banco. Não há cadastro aberto nem credenciais administrativas no código. Sem Supabase, a curadoria local validada continua disponível e o admin mostra como conectar.

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

Cole o link real obtido no programa de afiliados. A validação permite os hosts específicos documentados em `supabase/README.md`; itens publicados permitem Hotmart, Shopee e Mercado Livre após aplicar a migration `202610220002_enable_mercadolivre.sql`. Amazon continua como rascunho até a aprovação. A validação do host não comprova que o link gera comissão: confira a conta e o destino.

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

## Personalização visual

Os avatares originais fornecidos pela Mary estão em `apps/panel/public/images/mary-*.png`. O botão de sol/lua alterna claro e escuro, salva a escolha localmente e acompanha o sistema quando ainda não existe preferência. O tema vale também para administração, detalhes e páginas auxiliares. O script inicial aplica a aparência antes da hidratação.

## Primeiro produto de afiliada

Sem Supabase configurado, `src/lib/curated-catalog.ts` contém a webcam e o link fornecidos pela Mary, validados pelo schema do catálogo, junto das prévias sinalizadas. A rota `/go/webcam-rise-mode-vision-2k` consulta essa curadoria somente nesse modo. Com Supabase configurado, o banco controla integralmente publicação e destino: cadastre o mesmo produto em `/admin` antes de ativá-lo. Não existe fallback local em falhas do banco.

Preço e estoque não foram confirmados; nenhum valor ou promessa de disponibilidade é mostrado. A foto original da webcam enviada pela Mary foi recuperada do anexo e está em public/images/webcam-rise-mode-original.png. O destino de compra continua sendo exclusivamente o link Shopee informado pela Mary.

O curso INTRODUÇÃO A PROGRAMAÇÃO também está na curadoria com o link Hotmart informado. Sua capa completa original enviada no chat foi recuperada e está em public/images/introducao-programacao-cover.png.

## Trilhas de aprendizagem

A vitrine inclui 17 cursos com os links informados pela Mary. `src/lib/learning-paths.ts` define as sequências e exercícios sugeridos: jogos web, Unity/C#, Godot, Unreal, back-end e dados. Outras linguagens e complementos são alternativas separadas. JavaScript precede Node.js; Java não é apresentado como JavaScript. O novo Kotlin do básico ao avançado substitui a antiga prévia de Kotlin Avançado.

Os títulos não confirmam a ementa: não são prometidos certificados, duração, ferramentas específicas ou resultados do curso. A trilha web inclui um complemento gratuito da MDN para Canvas e jogos. O aluno pode abrir os detalhes de cada curso e seguir para o link de afiliado; projetos de prática não exigem compra adicional. O banco Supabase permanece a fonte de publicação quando configurado, sem fallback local. Etapas cujos cursos não estejam publicados no banco ficam sem botão de compra.

Referências para a organização: [MDN Games](https://developer.mozilla.org/en-US/docs/Games/Tutorials), [Unity Junior Programmer](https://learn.unity.com/pathway/junior-programmer), [Godot passo a passo](https://docs.godotengine.org/en/stable/getting_started/step_by_step/index.html), [Unreal para começar](https://dev.epicgames.com/documentation/unreal-engine/get-started). A capa de Introdução à Programação é a original fornecida pela Mary; as demais capas de cursos seguem ilustrativas até o recebimento dos arquivos. Preços continuam ausentes.

## Mercado Livre

A afiliação foi confirmada pela Mary. Aplique a migration 202610220002_enable_mercadolivre.sql depois da primeira migration para habilitar publicações no Supabase. Os dez links e códigos recebidos estão em src/lib/mercadolivre-links.ts; têm a associação aos produtos confirmada pela Mary; as fotos originais estão salvas em public/images/mercadolivre-product-1.png até mercadolivre-product-10.png, sem inventar nome, preço ou estoque. Amazon permanece bloqueada para publicação.

## Lojas separadas e imagens originais

`/shopee` mostra somente os produtos publicados da Shopee (atualmente a webcam), com laranja e lilás. `/mercado-livre` mostra somente os dez produtos dessa plataforma, com amarelo, azul e lilás. `/cursos` concentra os cursos e trilhas; `/` apresenta as entradas das lojas e os cursos. Amazon continua em breve e bloqueada para publicação. Os antigos produtos fictícios de demonstração não entram na vitrine.

O filtro de isolamento `selectStorefrontItems` está em `packages/core/src/storefront-sections.ts` e é aplicado no servidor antes de enviar os itens ao cliente. Busca, categorias, ordenação e favoritos operam somente sobre o catálogo da página atual. Favoritos são mantidos localmente ao navegar, com a visualização limitada à página escolhida.

As dez fotos do Mercado Livre, a foto da webcam e a capa de Introdução à Programação foram recuperadas dos anexos originais desta conversa, sem recriar ou modificar seus pixels. A correspondência de fotos e links foi confirmada pela Mary. Logos locais: Shopee SVG obtido em https://commons.wikimedia.org/wiki/File:Shopee.svg; logo completo Mercado Livre obtido em https://logospng.org/logo-mercado-livre/. São exibidos para identificar o destino dos links, junto da marca do canal e aviso de afiliado.

A página /cursos é exclusiva para cursos e trilhas: não inclui vitrines de produtos, logos de lojas no conteúdo ou chamada para escolher uma loja. A navegação principal permanece idêntica em todas as páginas, com Início, Cursos, Shopee e Mercado Livre, para permitir acesso direto entre as seções. O hero de cada loja alterna automaticamente suas próprias fotos a cada quatro segundos, com transição de opacidade. A animação é decorativa e não possui botões ou cliques; as ações de compra permanecem no catálogo abaixo. Com um único produto a foto fica estática. O movimento respeita a preferência do sistema e para quando o destaque está fora da tela ou a aba fica oculta.
