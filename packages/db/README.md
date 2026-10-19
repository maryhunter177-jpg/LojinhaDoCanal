# Banco de dados — Fase 1

PostgreSQL 16, Drizzle ORM e migrations SQL versionadas. Requer Node 22 e pnpm.

Na raiz, copie `.env.example` para `.env`, ajuste as URLs e execute:

```sh
pnpm install
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
```

`DATABASE_URL` é a conexão usada pelas migrations e pelo seed.
`TEST_DATABASE_URL` é obrigatória para integração e deve apontar para PostgreSQL
de desenvolvimento/teste com permissão para criar schemas. `LOG_LEVEL` controla
os logs. As variáveis são validadas por `loadDatabaseConfig` no módulo central
`packages/core/src/config.ts`, exportado por `@ofertas/core`. Não versione `.env`.

A suíte de integração usa PostgreSQL real, cria schema aleatório exclusivo,
aplica a migration do zero, verifica reaplicação e remove somente esse schema
ao terminar. Uma cópia temporária das migrations troca referências a `public`
pelo schema do teste. Os arquivos versionados permanecem intactos.
A suíte exige `TEST_DATABASE_URL` e não usa mocks de banco.
`pnpm test` executa testes unitários; `pnpm test:integration` executa os de banco.

O seed é transacional e idempotente. Cria os três canais desativados e
`publishing_paused=true` quando ausentes, preservando ajustes existentes.
Somente o booleano `false` libera a consulta de pausa; ausência ou valor inválido
mantêm a publicação pausada. Erros do banco são propagados para interromper
a publicação.

`createDatabase(connectionString)` retorna `{ db, pool }`; o chamador fecha
`pool.end()` ao encerrar. `createRepositories(db)` fornece CRUD tipado de produtos,
histórico, ofertas, canais, posts, links, cliques e comissões. Inclui upsert
por marketplace/ID externo, histórico cronológico, consultas por status, canal
e código, e `settings.isPublishingPaused()` / `setPublishingPaused()`.
Leituras individuais, updates e deletes retornam `undefined` quando não há linha.

Preços e comissões usam centavos inteiros. As FKs impedem remover dados ainda
referenciados. Posts são únicos por oferta/canal; links têm código único;
comissões não repetem marketplace/pedido/produto. Cliques aceitam hashes
hexadecimais de 64 caracteres, nunca IP puro. Geração de hashes com salt,
revalidação de ofertas e publicação ficam para as próximas fases.
