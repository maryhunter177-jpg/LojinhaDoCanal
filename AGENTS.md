# Regras do projeto

## Stack e estilo
- TypeScript strict, Node 22, pnpm workspaces. Sem `any` (use `unknown` + Zod para validar entrada externa).
- Toda configuração vem de variáveis de ambiente validadas com Zod em um único módulo `config`. Nunca hardcode tokens. Mantenha `.env.example` atualizado e `.env` no .gitignore.
- Funções puras no `packages/core`; I/O (HTTP, banco, filas) nas bordas.
- Erros: nunca engolir exceção. Logar com contexto (pino) e, em jobs, usar retry com backoff.
- Commits pequenos, mensagens no padrão Conventional Commits.

## Regras de negócio inegociáveis
1. **Nunca inventar endpoints, campos ou parâmetros de API.** Se não tiver certeza de como a API oficial de um marketplace funciona, implemente atrás da interface `OfferConnector` com um mock + `// TODO(verificar doc oficial)` e me avise. Não faça scraping sem eu pedir.
2. **Preço e link no texto publicado vêm SEMPRE dos dados validados, nunca de LLM.** Se usar LLM para variar a copy, o texto é validado depois: preço, link e nome do produto precisam bater com o dado original, senão cai no template fixo.
3. **Revalidar preço/estoque imediatamente antes de publicar.** Oferta desatualizada não é publicada.
4. **Toda mensagem publicada inclui aviso de link de afiliado** (ex.: "link de afiliado").
5. **Não implementar automação não oficial de WhatsApp** (Baileys, whatsapp-web.js etc.). Apenas gerar texto para postagem manual.
6. **Modo DRY_RUN** (variável de ambiente): quando ativo, tudo roda mas nada é publicado, só logado.
7. **Kill switch**: flag no banco que pausa toda publicação imediatamente.
8. **Rate limit e cadência configuráveis** por canal (ex.: intervalo mínimo entre posts, máximo por hora, janela de horário).
9. Dados de membros: coletar o mínimo possível (LGPD).

## Definição de pronto (cada tarefa)
- `pnpm typecheck`, `pnpm lint` e `pnpm test` passando.
- Testes unitários para lógica de domínio (dedupe, score, templates, validação).
- README do módulo com como rodar e variáveis necessárias.
