# FixTime

Plataforma de agendamento de visitas para assistencia tecnica. Este repositorio usa SDD (Spec-Driven Development) e e dividido em backend Spring Boot e frontend React.

## Stack

- Java 21, Spring Boot 3.5, Maven, PostgreSQL
- React 19, TypeScript, Vite
- JUnit, MockMvc, Vitest

## Executar localmente

### Backend

```bash
cd backend
mvn spring-boot:run
```

A API fica em `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A interface fica em `http://localhost:5173`.

### Ambiente com Docker

```bash
docker compose up --build
```

## Testes

```bash
cd backend && mvn test
cd frontend && npm install && npm test -- --run
```

O resultado da primeira execucao sera registrado em [docs/test-report.md](docs/test-report.md).

## Governanca

- `main`: branch protegida de release; nenhum commit direto.
- `develop`: integracao da sprint.
- `feature/*`: trabalho isolado por tarefa.
- Toda mudanca deve entrar por Pull Request com revisao e aprovacao de outro membro.
- Issues e GitHub Projects registram a decomposicao do trabalho.

## SDD

A especificacao esta em [docs/specification.md](docs/specification.md), e suas revisoes em [docs/spec-changelog.md](docs/spec-changelog.md). O fluxo e: Specification -> Plan -> Implement -> Test -> Review.

## ADRs

### ADR-001: Spring Boot e React

Escolhemos Spring Boot pela maturidade para APIs REST, validacao e testes de integracao. React com TypeScript e Vite oferece ciclo rapido e tipagem no cliente.

### ADR-002: Regras no Service

Regras de conflito, horario e transicao de status ficam na camada de servico. Controllers apenas validam o contrato HTTP e delegam o caso de uso.

### ADR-003: PostgreSQL em runtime e H2 em testes

PostgreSQL representa o ambiente de execucao; H2 reduz o custo e acelera testes automatizados isolados.

## Agentes de IA

O uso do GitHub Copilot e documentado em [AGENTS.md](AGENTS.md) e [.github/copilot-instructions.md](.github/copilot-instructions.md). Toda sugestao gerada passa por revisao humana, testes e code review.
