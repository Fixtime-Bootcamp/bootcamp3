# FixTime — Relatório Consolidado da Entrega 2
## Publicação do Projeto, Refinamento e Análise Crítica do Uso de IA

---

### 📌 Informações Gerais e Identificação da Equipe

* **Instituição / Curso:** Bootcamp Fullstack & Engenharia de Software com IA  
* **Projeto:** FixTime — Plataforma Determinística de Agendamento para Assistências Técnicas  
* **Repositório Público no GitHub:** [https://github.com/Fixtime-Bootcamp/bootcamp3](https://github.com/Fixtime-Bootcamp/bootcamp3)  
* **Branch Principal de Produção (Release):** `main`  
* **Branch de Integração:** `develop`  
* **Data de Fechamento da Entrega:** 06 de Outubro de 2026  

#### Integrantes da Equipe:
1. **Caio Boudens de Castro** — RA: `22304522`
2. **Eduardo Frois Drumond** — RA: `22303035`
3. **Fernando Medeiros Farias** — RA: `22306100`
4. **Larissa Queiroz Ramos** — RA: `22304308`
5. **Mayssa Barbosa Dias** — RA: `22303603`
6. **Thiago Venâncio Gomides** — RA: `22307398`

---

## 1. Visão Geral da Solução e Arquitetura do Sistema

O **FixTime** é uma solução completa e determinística projetada para sanar conflitos de agenda, horários fora de expediente comercial, atendimentos em feriados e perda de histórico operacional comuns em assistências técnicas de pequeno e médio porte.

### 1.1. Stack Tecnológica
* **Backend:** Java 21, Spring Boot 3.4.5, Spring Data JPA, Bean Validation, PostgreSQL (produção/compose) e H2 Database (testes em memória).
* **Frontend:** React 19, TypeScript, Vite, Nginx.
* **DevOps & Qualidade:** Docker, Docker Compose, JUnit 5, MockMvc, Vitest, Testing Library e documentação OpenAPI 3.0 / Swagger UI (`/swagger-ui.html`).

### 1.2. Diagrama de Arquitetura e Fluxo da Aplicação

```text
┌─────────────────────────────────────────────────────────────┐
│             Frontend SPA (React 19 + TypeScript)            │
│  - Gestão de Clientes, Técnicos, Serviços e Agendamentos     │
│  - Filtros avançados, Paginação e Exportação CSV (RFC 4180) │
└──────────────────────────────┬──────────────────────────────┘
                               │  HTTP REST / JSON (/api/v1)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Backend API (Spring Boot 3.4.5)                 │
│  Controllers REST ──> Camada de Serviço (Regras de Domínio) │
│                                                             │
│   Motor de Validações SDD (Spec-Driven Development):        │
│    ✓ RN01: Integridade de cadastros ativos                  │
│    ✓ RN02: Duração vinculada a ServiceEntity                │
│    ✓ RN03: Antecedência mínima de 2 horas (Clock fixo)      │
│    ✓ RN04: Jornada comercial (08:00 às 18:00, Seg-Sex)      │
│    ✓ RN05: Bloqueio de sobreposição (adjacentes permitidos) │
│    ✓ RN06/RN07: Transições válidas (CANCELLED / COMPLETED)  │
│    ✓ RN08: Bloqueio de feriados nacionais e indisponibilid. │
│                                                             │
│  GlobalExceptionHandler ──> Resposta JSON padronizada       │
└──────────────────────────────┬──────────────────────────────┘
                               │  JPA / Hibernate
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Camada de Dados                        │
│   - PostgreSQL 16 (Ambiente de Produção e Docker Compose)    │
│   - H2 Database (Execução Isolada e Rápida do Test Harness) │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Governança de Código, Branches e Evidências de Code Review

O fluxo de versionamento foi conduzido sob o modelo **Gitflow / Feature Branch Workflow**:
* Commits diretos na `main` e na `develop` são estritamente bloqueados.
* Cada tarefa foi vinculada a uma **Issue** no GitHub Projects (`Project 1`) com labels semânticas (`epic:*`, `priority:*`, `backend`, `frontend`, etc.).
* O ciclo de integração exigiu **Pull Requests com revisão obrigatória entre pares (peer review)** e passagem completa da suíte de testes automatizados.
* **Limpeza Pós-Merge:** Por política de governança da equipe, todas as feature branches foram removidas após o merge para manter a integridade e higiene do repositório.

### 🔗 Pull Requests Relevantes de Evidência Colaborativa:

| PR | Título do Pull Request | Área / Módulo | Status | Link no GitHub |
| :---: | :--- | :---: | :---: | :--- |
| **#24** | `feat(docs): definir contrato definitivo de agendamento` | SDD / Fundação | Merged | [PR #24](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/24) |
| **#25** | `feat(api): padronizar tratamento e respostas de erros HTTP` | Backend / API | Merged | [PR #25](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/25) |
| **#29** | `feat(appointment): implementar entidade JPA e repository` | Backend / JPA | Merged | [PR #29](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/29) |
| **#31** | `test(backend): expandir test harness com testes unitários e integração` | Qualidade / Testes | Merged | [PR #31](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/31) |
| **#33** | `feat(devops): tornar docker compose e healthchecks reproduzíveis` | Infra / DevOps | Merged | [PR #33](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/33) |
| **#40** | `feat(frontend): integrar cliente tipado da API` | Frontend / API | Merged | [PR #40](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/40) |
| **#48** | `feat(frontend): implementar fluxo de criacao de agendamento` | Frontend / UI | Merged | [PR #48](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/48) |
| **#50** | `feat(frontend): implementar agenda operacional e acoes de status` | Frontend / UI | Merged | [PR #50](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/50) |
| **#51** | `feat(frontend/backend): telas de cadastro e gestão (Clientes/Técnicos/Serviços)` | Fullstack | Merged | [PR #51](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/51) |
| **#52** | `feat(backend): implementar bloqueio de feriados nacionais e indisponibilidades` | Regras / Domínio | Merged | [PR #52](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/52) |
| **#58** | `feat: exportacao de agendamentos em CSV (streaming UTF-8 BOM)` | Fullstack / RFC | Merged | [PR #58](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/58) |
| **#74** | `feat(api): documentacao interativa com OpenAPI / Swagger` | Documentação API | Merged | [PR #74](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/74) |
| **#77** | `docs(entrega-2): diagramas no README, relatório de erros lógicos e análise ética de IA` | Governança / Entrega 2 | Merged | [PR #77](https://github.com/Fixtime-Bootcamp/bootcamp3/pull/77) |

---

## 3. Relatório de Execução dos Testes Automatizados (100% PASS)

A suíte consolidada de testes (Test Harness) cobre **100% dos Requisitos Funcionais (`RF01` a `RF08`) e Regras de Negócio (`RN01` a `RN08`)**, abrangendo cenários nominais e de borda (*edge cases*).

* **Total de Testes Automatizados:** 104 testes aprovados  
* **Testes Backend (JUnit 5, MockMvc, AssertJ):** 44 testes (**0 falhas, 0 erros**)  
* **Testes Frontend (Vitest, Testing Library):** 60 testes (**0 falhas, 0 erros**)  
* **Taxa de Aprovação:** **100% GREEN (Zero Falhas)**  

### 3.1. Log de Execução Backend (`mvn clean test`)

```text
[INFO] Scanning for projects...
[INFO] -------------------< com.fixtime:fixtime-backend >-------------------
[INFO] Building fixtime-backend 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-surefire-plugin:3.2.5:test (default-test) @ fixtime-backend ---
[INFO] Running com.fixtime.appointment.AppointmentCsvWriterTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.124 s
[INFO] Running com.fixtime.AppointmentServiceTest
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.156 s
[INFO] Running com.fixtime.AppointmentIntegrationTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.892 s
[INFO] Running com.fixtime.AppointmentExportIntegrationTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.632 s
[INFO] Running com.fixtime.BlockedDateIntegrationTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.114 s
[INFO] Running com.fixtime.CustomerServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.089 s
[INFO] Running com.fixtime.HealthControllerTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.065 s
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 44, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  15.341 s
```

### 3.2. Log de Execução Frontend (`npm test -- --run`)

```text
> fixtime-web@0.0.1 test
> vitest --run

 RUN  v4.1.11 C:/Users/thiag/Documents/BootCamp/bootcamp3/frontend

 ✓ src/utils/appointmentEligibility.test.ts (7 tests) 4ms
 ✓ src/api/client.test.ts (3 tests) 11ms
 ✓ src/components/AppointmentCard.test.tsx (7 tests) 307ms
 ✓ src/pages/TechniciansPage.test.tsx (7 tests) 447ms
 ✓ src/pages/CustomersPage.test.tsx (10 tests) 557ms
 ✓ src/pages/ServicesPage.test.tsx (8 tests) 573ms
 ✓ src/components/CreateAppointmentModal.test.tsx (8 tests) 707ms
 ✓ src/App.test.tsx (10 tests) 1002ms

 Test Files  8 passed (8)
      Tests  60 passed (60)
   Duration  19.69s (transform 1.26s, setup 22.01s, import 3.27s, tests 3.61s)
```

---

## 4. Inspeção de Erros Lógicos e Loop de Re-especificação (SDD)

A adesão ao Spec-Driven Development garantiu que cada erro lógico detectado durante o desenvolvimento fosse tratado por meio de um ciclo formal: pausa na codificação, reajuste da especificação formal (`docs/SPEC.md`), criação de teste de regressão e correção definitiva no domínio.

### Casos Reais de Erros Lógicos Identificados e Corrigidos:
1. **Duração Arbitrária de Serviços (Issue #1 e #8):** O payload inicial permitia que o usuário informasse a duração da visita manualmente. O erro permitia agendamentos fictícios de 5 minutos para serviços complexos. **Correção:** A duração foi atrelada estritamente à entidade `ServiceEntity`, calculando `endsAt` no backend a partir de `startsAt + service.getDurationMinutes()`.
2. **Falso Positivo de Sobreposição em Horários Adjacentes (RN05 / Issue #10):** A verificação de horários bloqueava visitas que terminavam no horário exato do início da próxima (ex.: 09:00-10:00 e 10:00-11:00). **Correção:** Ajuste na query de conflito para intervalos semi-abertos `(startsAt < other.endsAt AND endsAt > other.startsAt)`.
3. **Flutuação de Tempo e Testes Flaky (RN03 / Issue #17):** O uso de `Instant.now()` gerava testes instáveis que falhavam por milissegundos na validação de 2 horas de antecedência. **Correção:** Injeção de dependência de `java.time.Clock`, permitindo fixar o relógio de referência durante os testes.
4. **Tentativa de Conclusão Prematura (RN07 / Issue #13):** O endpoint permitia marcar visitas como `COMPLETED` antes da sua realização em campo. **Correção:** Validação estrita exigindo `clock.instant().isAfter(appointment.getEndsAt())`.
5. **Corrupção de Acentuação no CSV (RF08 / Issue #28):** Arquivos exportados abriam com caracteres corrompidos no Excel (Windows/PT-BR). **Correção:** Implementação de streaming com Byte Order Mark UTF-8 (`0xEF, 0xBB, 0xBF`) e aderência estrita à RFC 4180.

---

## 5. Análise Comparativa e Avaliação Crítica de IA (Relatório Técnico-Ético)

### 5.1. Matriz Comparativa entre Ferramentas de IA

A equipe experimentou quatro soluções de assistência de código durante o projeto: **Claude Code**, **OpenAI Codex**, **Cursor** e **Antigravity**.

| Critério de Comparação | Claude Code (CLI) | OpenAI Codex / CLI | Cursor (IDE) | Antigravity (Google / IDE) |
| :--- | :---: | :---: | :---: | :---: |
| **Interface / Operação** | CLI de Terminal | Terminal / Chamadas API | Fork do VS Code | IDE Integrada com Subagentes |
| **Visão de Contexto do Repositório** | Alta (Leitura e busca ativa) | Média (Janela pontual) | Muito Alta (Embeddings locais) | Muito Alta (Indexação + Knowledge Items) |
| **Aderência ao Modelo SDD** | Alta (Forte rigor lógico) | Média (Foco em boilerplate) | Alta (via `@docs/SPEC.md`) | Excelente (Instrução contínua de regras) |
| **Geração de Testes Unitários** | Excelente (Edge cases) | Boa (Caminho feliz) | Muito Boa (Mocks e asserções) | Excelente (Rastreabilidade e docstrings) |
| **Execução Autônoma de Comandos** | Alta (Execução direta em shell) | Baixa (Requer script externo) | Média (Interativo com usuário) | Total (Roda testes, compila e avalia logs) |
| **Taxa de Alucinação Sintática** | Baixa | Média | Baixa | Muito Baixa (Audita antes de aplicar) |
| **Aplicação de Governança e Regras** | Alta | Baixa | Alta (via `.cursorrules`) | Muito Alta (Força `AGENTS.md` e branch flow) |

#### Conclusão Comparativa:
* **Antigravity** e **Cursor** destacaram-se na integração ao fluxo de desenvolvimento diário (DX), compreendendo relacionamentos profundos entre arquivos e garantindo conformidade com a governança.
* **Claude Code** demonstrou alta capacidade analítica na resolução de regras temporais complexas via terminal.
* **OpenAI Codex** foi ágil para templates sintáticos, mas exigiu supervisão humana constante para não introduzir padrões desatualizados de bibliotecas (Spring Boot 2.x em vez de 3.4.5).

---

### 5.2. Ética, Limites e Segurança do Uso de IA: Os Quatro Pilares Críticos

#### Pilar 1: Riscos de Alucinação de Código e Geração Insegura
Modelos generativos operam estatisticamente prevendo o próximo token mais provável e não possuem compilação intrínseca. Isso acarreta riscos como:
* **"Package Hallucination":** A sugestão de pacotes inexistentes que podem ser explorados por ataques de *typosquatting* em gerenciadores de dependências.
* **Vulnerabilidades Ocultas (OWASP):** Sugestão de padrões legados vulneráveis (injeção SQL, supressão de exceções, falhas de autorização).
* **Mitigação no FixTime:** Proibição de novas dependências externas sem aprovação prévia, tipagem estrita (Java 21 e TypeScript estrito) e execução de suíte de testes com cobertura de edge cases.

#### Pilar 2: Vazamento de Dados, Privacidade e Confidencialidade (LGPD)
O envio de contexto de código para servidores em nuvem de fornecedores pode expor credenciais, chaves de API ou dados confidenciais.
* **Mitigação no FixTime:** Uso rigoroso de variáveis de ambiente (`.env`), sem inclusão de segredos no código-fonte. Todos os dados utilizados nos testes e sementes são puramente sintéticos (nomes como "Carlos Silva", e-mails `@example.com` conforme RFC 2606), em total observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

#### Pilar 3: Propriedade Intelectual (IP) e Direitos Autorais
Bases de treinamento de LLMs contêm códigos de repositórios sob licenças copyleft (GPL, AGPL). A replicação cega de blocos protegidos pode contaminar bases proprietárias.
* **Mitigação no FixTime:** Os agentes atuaram estritamente na implementação de lógica de domínio original concebida pela equipe. A propriedade intelectual da arquitetura, das regras e dos contratos cabe exclusivamente aos membros da equipe, usando a IA como acelerador e não como autora autônoma.

#### Pilar 4: A Centralidade e Obrigatoriedade da Homologação Humana (Human-in-the-Loop)
O maior risco na engenharia com IA é o **viés de automação**: a falsa premissa de que código gerado com sintaxe elegante está logicamente correto.
* **Diretriz Absoluta:** No fluxo SDD, **a IA propõe, mas o ser humano homologa**. Nenhum Pull Request foi mergeado sem code review entre colegas de equipe e sem 100% de aprovação no pipeline de testes.

---

## 6. Relato de Experiência e Aprendizados da Equipe

O desenvolvimento colaborativo do FixTime com 6 integrantes evidenciou que a **especificação técnica detalhada (SDD) e a governança rígida de branchs e PRs são os verdadeiros pilares da produtividade**, muito mais do que a velocidade de digitação de código.

1. **Eliminação do Retrabalho:** A definição precoce dos contratos literais JSON em `docs/SPEC.md` permitiu que a equipe de backend e a de frontend trabalhassem de forma paralela e independente sem quebras de integração.
2. **A Cultura do Test Harness:** Ter 104 testes automatizados em execução contínua transformou refatorações complexas em processos seguros e sem medo de quebra de regras adjacentes.
3. **Maturidade no Uso de IA:** A equipe compreendeu que agentes de IA são multiplicadores excepcionais de velocidade para times bem estruturados, mas que se tornam geradores de dívida técnica quando usados sem especificações sólidas ou sem testes automatizados.

---

### 📂 Documentos Complementares no Repositório

Para aprofundamento técnico, os seguintes arquivos encontram-se disponíveis no repositório oficial:
* **README Principal:** [README.md](file:///c:/Users/thiag/Documents/BootCamp/bootcamp3/README.md)
* **Especificação Canônica:** [docs/SPEC.md](file:///c:/Users/thiag/Documents/BootCamp/bootcamp3/docs/SPEC.md)
* **Histórico de Mudanças:** [docs/spec-changelog.md](file:///c:/Users/thiag/Documents/BootCamp/bootcamp3/docs/spec-changelog.md)
* **Relatório do Test Harness:** [docs/test-report.md](file:///c:/Users/thiag/Documents/BootCamp/bootcamp3/docs/test-report.md)
* **Inspeção de Erros Lógicos:** [docs/erros-logicos.md](file:///c:/Users/thiag/Documents/BootCamp/bootcamp3/docs/erros-logicos.md)
* **Relatório Ético e Segurança de IA:** [docs/relatorio-etico-ia.md](file:///c:/Users/thiag/Documents/BootCamp/bootcamp3/docs/relatorio-etico-ia.md)
