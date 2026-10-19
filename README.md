# Bot de ofertas afiliadas

Monorepo TypeScript strict com Node 22 e pnpm 10.18.3. A Fase 1 implementa o
banco PostgreSQL com Drizzle, migrations, repositórios tipados e seed seguro.
A estrutura essencial da Fase 0 foi criada como pré-requisito.

## Preparar o ambiente

Instale Node 22, pnpm e Docker com Compose. Na raiz do projeto:

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
```

Revise `.env` antes de expor serviços fora do ambiente local. Ele fica fora do
Git. As variáveis são validadas em `packages/core/src/config.ts`. Operações de
banco usam `DATABASE_URL` e `LOG_LEVEL`; testes de integração exigem
`TEST_DATABASE_URL`, com permissão para criar schemas. A configuração da
aplicação prevê `REDIS_URL`, `SHORTENER_BASE_URL`, `API_PORT`, `TIMEZONE`,
`DRY_RUN` e os segredos opcionais listados em `.env.example`.

O seed cria Telegram, Discord e WhatsApp para exportação manual, todos inativos,
e `publishing_paused=true` quando ausentes. Reaplicações preservam ajustes
existentes. Mantenha `DRY_RUN=true` durante o desenvolvimento. Nenhuma credencial
de marketplace ou publicador é necessária nesta fase.

## Comandos

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm build
```

`pnpm test` executa testes unitários. `pnpm test:integration` exige PostgreSQL
real e aplica migrations em um schema temporário isolado, removido ao terminar.
`pnpm db:generate` gera migrations após mudanças no schema;
`pnpm db:migrate` aplica migrations e `pnpm db:seed` inicializa a configuração.
Os dois últimos comandos leem `.env` na raiz.

`pnpm dev` executa os scripts `dev` disponíveis nos pacotes. Nesta fase ainda
não existem serviços ou jobs de aplicação para iniciar: o comando não inicia
API, worker ou painel. PostgreSQL e Redis são iniciados pelo Docker Compose.

## Estrutura e escopo

- `packages/core`: configuração central validada com Zod e base do domínio.
- `packages/db`: nove tabelas, migrations, CRUD e seed. Veja
  [a documentação do banco](packages/db/README.md).
- `packages/connectors` e `packages/publishers`: estrutura para fases seguintes.
- `apps/api`, `apps/worker` e `apps/panel`: placeholders sem serviços.

Conectores oficiais, avaliação, encurtador, textos, publicação, filas, painel e
deploy ficam para as próximas fases. Nenhuma mensagem é enviada nesta fase.
WhatsApp continuará restrito à exportação para postagem manual.

## Cópia de trabalho recuperada

A cópia ativa está em `C:\Users\maryh\Projects\GrupoVendas`. O disco USB de `E:` apresentou falhas de comunicação nos eventos 129/153 do Windows; a pasta original foi preservada.

Node e pnpm portáteis estão em `.tools` (fora do Git). Neste PowerShell:

```powershell
cd C:\Users\maryh\Projects\GrupoVendas
. .\scripts\Use-LocalTools.ps1
pnpm typecheck
pnpm lint
pnpm test
```

As ferramentas portáteis são locais e não são distribuídas no código. Em outra máquina instale Node 22 e pnpm 10.18.3. `pnpm db:generate`, `pnpm db:migrate` e `pnpm db:seed` carregam o `.env` da raiz. Os testes de integração exigem PostgreSQL real; a validação desta entrega utilizou uma instância isolada em localhost.
