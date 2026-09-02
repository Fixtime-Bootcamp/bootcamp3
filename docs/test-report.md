# Relatorio de testes

Data da primeira execucao: 2026-09-02

## Frontend

Comandos executados em `frontend/`:

```text
npm install
npm test -- --run
npm run build
```

Resultado: **PASS**. Vitest: 1 arquivo de teste e 1 teste aprovados. Build Vite concluido com TypeScript e bundle de producao gerados.

## Backend

Comandos tentados:

```text
cd backend && mvn test
docker compose build backend
```

Resultado: **PENDENTE DE AMBIENTE**. O Maven nao esta disponivel no `PATH` do Windows e o Docker Desktop nao estava com o daemon Linux ativo. Os testes unitarios e de integracao devem ser executados assim que uma dessas ferramentas estiver disponivel.

## Cobertura inicial planejada

- Criacao de visita em horario comercial.
- Conflito de horario para o mesmo tecnico.
- Visita em fim de semana.
- Endpoint de saude via MockMvc.
