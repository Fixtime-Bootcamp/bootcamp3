# FixTime

## Visão Geral do Projeto

O **FixTime** é uma plataforma determinística e escalável de agendamento de visitas para pequenas e médias assistências técnicas. Centraliza cadastros de clientes, técnicos e catálogo de serviços para eliminar conflitos de agenda, perda de histórico e falta de visibilidade comum em controles informais por telefone e planilhas.

O sistema permite consultar a disponibilidade técnica em tempo real, criar e listar agendamentos com filtros e paginação, cancelar visitas elegíveis, registrar conclusão pós-atendimento, bloquear feriados nacionais e exportar históricos operacionais em CSV (RFC 4180 / UTF-8 BOM).

O repositório segue rigorosamente o modelo **SDD (Spec-Driven Development)**, dividindo-se em backend Spring Boot e frontend React.

---

## Integrantes 

- Caio Boudens de Castro - RA: 22304522
- Eduardo Frois Drumond - RA: 22303035
- Fernando Medeiros Farias - RA: 22306100
- Larissa Queiroz Ramos - RA: 22304308
- Mayssa Barbosa Dias - RA: 22303603
- Thiago Venâncio Gomides - RA: 22307398

---

## Stack Tecnológica

- **Backend:** Java 21, Spring Boot 3.4.5, Maven, Spring Data JPA, PostgreSQL e H2 Database (testes)
- **Frontend:** React 19, TypeScript, Vite, Nginx
- **Testes & Qualidade:** JUnit 5, MockMvc, AssertJ, Vitest, Testing Library

---

## Guia de Instalação e Execução

### Pré-requisitos
- **Git** para clonagem do repositório.
- **Docker & Docker Compose** (método recomendado — não exige Java, Maven ou Node.js instalados na máquina).
- *Opcional para desenvolvimento nativo local:* JDK 21, Maven 3.9+ e Node.js 22+.

Clone o repositório:
```bash
git clone https://github.com/Fixtime-Bootcamp/bootcamp3.git
cd bootcamp3
```

---

### 🚀 Execução Completa com Docker (Recomendado)

Inicie toda a aplicação (Banco PostgreSQL + API Backend + SPA Frontend) com um único comando:

```bash
docker compose up --build
```

* **Frontend (React/Nginx):** `http://localhost:5173` ou `http://localhost:80`
* **Backend API (Spring Boot):** `http://localhost:8080/api/v1`
* **Banco PostgreSQL:** `localhost:5432`

---

### Execução Local Nativa (Alternativa)

#### 1. Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
*A API estará disponível em `http://localhost:8080/api/v1` (usando banco H2 em memória por padrão).*

#### 2. Frontend (React/Vite)
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
*A interface estará disponível em `http://localhost:5173` com proxy reverso automático para o backend.*

---

## Test Harness (Suíte de Testes Automatizados)

A suíte cobre 100% dos Requisitos Funcionais (`RF01` a `RF08`) e Regras de Negócio (`RN01` a `RN08`), com rastreabilidade formal via docstrings em cada teste.

### Executar Testes com Docker (Comando Único)
```bash
docker compose run --rm backend mvn test
```

### Executar Testes Localmente

**Backend (JUnit 5 & MockMvc):**
```bash
cd backend
mvn clean test
```

**Frontend (Vitest):**
```bash
cd frontend
npm install
npm test -- --run
```

O relatório consolidado de execução do Test Harness encontra-se em [docs/test-report.md](docs/test-report.md).

---

## Governança do Repositório

- `main`: Branch protegida de release para produção; commits diretos são estritamente bloqueados.
- `develop`: Branch de integração da sprint.
- `feature/*`: Branches isoladas por Issue/tarefa.
- Todo código é integrado exclusivamente via **Pull Requests** com revisão humana, verificação de CI e aprovação por outro membro da equipe.
- Rastreamento e divisão de tarefas documentados via **Issues** e **GitHub Projects**.

---

## Especificação Técnica (SDD)

A especificação canônica do FixTime encontra-se em [docs/SPEC.md](docs/SPEC.md), e o histórico evolutivo de refinamentos em [docs/spec-changelog.md](docs/spec-changelog.md).

O ciclo de desenvolvimento segue o fluxo:  
`Specification` ➔ `Plan` ➔ `Implement` ➔ `Test` ➔ `Review`

---

## ADRs — Decisões Arquiteturais Técnicas

### ADR-001: Spring Boot e React
Escolhemos Spring Boot pela maturidade para APIs REST, validação declarativa e testes de integração. React com TypeScript e Vite oferece ciclo rápido de desenvolvimento e tipagem estática no cliente.

### ADR-002: Regras de Negócio na Camada de Serviço
Regras de conflito, horário comercial, antecedência e transição de status ficam concentradas exclusivamente na camada de serviço (`AppointmentService`). Controllers apenas validam contratos HTTP e delegam para o domínio.

### ADR-003: PostgreSQL em Produção/Compose e H2 em Testes
PostgreSQL é adotado no ambiente Docker Compose por seu suporte a transações ACID e integridade referencial. O banco em memória H2 é utilizado na execução isolada de testes para garantir velocidade e independência de infraestrutura externa.

---

## Agentes de IA

As diretrizes operacionais de assistência por IA são versionadas em [AGENTS.md](AGENTS.md), [.cursorrules](.cursorrules) e [.github/copilot-instructions.md](.github/copilot-instructions.md). Toda sugestão gerada passa por testes automatizados e code review humano rigoroso antes do merge.
