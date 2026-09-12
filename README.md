# FixTime

## Visão Geral do Projeto

O FixTime é uma plataforma de agendamento de visitas para pequenas assistências técnicas. Centraliza informações de clientes, técnicos e serviços para evitar conflitos de agenda, perda de histórico e falta de visibilidade no controle por telefone e planilhas.

O sistema permite consultar a disponibilidade de técnicos, criar e listar agendamentos, cancelar visitas elegíveis e registrar sua conclusão. Este repositório usa SDD (Spec-Driven Development) e é dividido em backend Spring Boot e frontend React.


# Integrantes 

- Caio Boudens de Castro - RA: 22304522
- Eduardo Frois Drumond - RA: 22303035
- Fernando Medeiros Farias - RA: 22306100
- Larissa Queiroz Ramos - RA: 22304308
- Mayssa Barobas Dias - RA: 22303603
- Thiago Venâncio Gomides - RA: 22307398


## Stack

- Java 21, Spring Boot 3.4.5, Maven, PostgreSQL e H2
- React 19, TypeScript, Vite
- JUnit, MockMvc, Vitest

## Guia de Instalação/Execução

### Pré-requisitos

- Git para clonar o repositório.
- JDK 21 e Maven para executar e testar o backend localmente.
- Node.js 22.x a partir de 22.22.2 e npm para executar e testar o frontend, conforme os requisitos das dependências registradas em `frontend/package-lock.json`.
- Docker com Docker Compose para a alternativa de backend e banco em contêineres; nessa alternativa, Java e Maven são fornecidos pela imagem de build.

Clone o repositório e entre na pasta do projeto:

```bash
git clone https://github.com/Fixtime-Bootcamp/bootcamp3.git
cd bootcamp3
```

Os blocos de comandos abaixo partem da raiz do repositório. Execute backend e frontend em terminais separados e mantenha ambos em execução.

### Backend

```bash
cd backend
mvn spring-boot:run
```

A API fica em `http://localhost:8080`, com endpoints sob `/api/v1`.

Sem variáveis `SPRING_DATASOURCE_*` configuradas, o backend usa H2 em memória, sem precisar instalar um banco. Os dados desse modo são perdidos ao encerrar a aplicação. Para executar com PostgreSQL, use a alternativa com Docker abaixo.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A interface fica em `http://localhost:5173`. O servidor de desenvolvimento encaminha as chamadas `/api` para `http://localhost:8080`, sem exigir configuração adicional de variáveis de ambiente.

### Ambiente com Docker

Como alternativa ao backend local, execute na raiz do repositório, com o Docker em execução:

```bash
docker compose up --build
```

O Compose inicia **apenas o PostgreSQL e o backend**, disponíveis nas portas `5432` e `8080`. Execute o frontend em outro terminal seguindo a seção Frontend acima. Escolha uma das alternativas de backend para evitar conflito na porta `8080`.

O Compose fornece valores padrão para a configuração do banco. Para personalizá-los, copie `.env.example` para `.env` na raiz e ajuste `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD` antes de iniciar o ambiente. A execução direta com Maven não carrega esse arquivo automaticamente.

## Testes

Backend, a partir da raiz:

```bash
cd backend
mvn test
```

Frontend, em outro terminal a partir da raiz:

```bash
cd frontend
npm install
npm test -- --run
```

O registro da execução inicial está em [docs/test-report.md](docs/test-report.md).

## Governança

- `main`: branch protegida de release; nenhum commit direto.
- `develop`: integração da sprint.
- `feature/*`: trabalho isolado por tarefa.
- Toda mudança deve entrar por Pull Request com revisão e aprovação de outro membro.
- Issues e GitHub Projects registram a decomposição do trabalho.

## SDD

A especificação está em [docs/specification.md](docs/specification.md), e suas revisões em [docs/spec-changelog.md](docs/spec-changelog.md). O fluxo é: Specification -> Plan -> Implement -> Test -> Review.

## ADRs — Registro Sintético de Decisões Arquiteturais Técnicas

### ADR-001: Spring Boot e React

Escolhemos Spring Boot pela maturidade para APIs REST, validação e testes de integração. React com TypeScript e Vite oferece ciclo rápido e tipagem no cliente.

### ADR-002: Regras no Service

Regras de conflito, horário e transição de status ficam na camada de serviço. Controllers apenas validam o contrato HTTP e delegam o caso de uso. Essa separação concentra as regras de negócio e permite testá-las independentemente da camada HTTP.

### ADR-003: PostgreSQL no Compose e H2 na execução local e nos testes

Escolhemos PostgreSQL para o ambiente com Docker Compose por seu suporte a transações e integridade referencial, adequados às relações entre clientes, técnicos, serviços e agendamentos. H2 em memória é o padrão da execução local sem configuração de datasource e dos testes, simplificando a preparação do ambiente e acelerando testes automatizados isolados.

## Agentes de IA

O uso do GitHub Copilot é documentado em [AGENTS.md](AGENTS.md) e [.github/copilot-instructions.md](.github/copilot-instructions.md). Toda sugestão gerada passa por revisão humana, testes e code review.
