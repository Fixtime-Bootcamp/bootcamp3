# Especificação Técnica (SDD): FixTime

**Versão da Especificação:** 1.0.0 (As-Built)  
**Status:** As-Built: descreve o produto exatamente como entregue na release v1.0.0. Itens planejados na proposta v1.3 e não implementados estão marcados como **Não implementado**.  
**Documento Base:** Spec-Driven Development (SDD)  

---

## 0. Status de Implementação (As-Built)

| Item | Situação | Observação |
| --- | --- | --- |
| RF01 a RF08 | Implementado | Cobertos por testes automatizados. |
| RF09, RF10, RN09, RN10, RNF08 (autenticação JWT, perfis, segredos JWT) | **Fora de escopo** | Decisão da equipe: a v1.0.0 não possui autenticação nem controle de acesso (issue #98 encerrada). |
| RF11, RF12, RF13, RN11 (página inicial, roteamento, agenda semanal, toasts/error boundary) | **Não implementado** | Frontend é uma SPA de tela única, sem React Router. |
| RNF01, RNF03, RNF05, RNF06 | Implementado | RNF06: CI executa testes, cobertura e build. |
| RNF02, RNF07 | Não verificado | Sem medição de P95 nem de Lighthouse/WCAG nesta versão. |
| RNF04 | Parcial | Regras RN01-RN08 cobertas; ver cobertura medida na seção 7.1. |

Rastreabilidade das issues da proposta v1.3 (conferida contra o código da v1.0.0):

| Issue | Tema | Situação na v1.0.0 |
| --- | --- | --- |
| #65 | Página inicial | Não implementada (sem rota `/`) |
| #66 | Roteamento e menu | Não implementada (sem React Router; navegação por abas em `App.tsx`) |
| #67 | Login JWT e rota protegida | Fora de escopo (sem Spring Security) |
| #68 | Perfis de acesso | Fora de escopo |
| #69 | Agenda semanal | Não implementada (agenda em lista) |
| #70 | Toasts, loading e error boundary | Não implementada (apenas mensagens de erro inline) |
| #71 | Responsividade e acessibilidade | Parcial (`@media` e atributos ARIA pontuais; sem auditoria Lighthouse/WCAG) |
| #72 | Pipeline de CI | Implementada (`.github/workflows/ci.yml`: testes, cobertura e build) |
| #98 | Spring Security + JWT e perfis | Encerrada como não planejada |

Endpoints efetivamente expostos (todos sem autenticação, pois o controle de acesso está fora de escopo):

| Método | Rota |
| --- | --- |
| GET | `/api/v1/health` |
| POST, GET | `/api/v1/customers`; PATCH `/api/v1/customers/{id}/toggle-active` |
| POST, GET | `/api/v1/technicians`; PATCH `/api/v1/technicians/{id}/toggle-active` |
| GET | `/api/v1/technicians/{id}/availability?date=` |
| POST, GET | `/api/v1/services`; PATCH `/api/v1/services/{id}/toggle-active` |
| POST, GET | `/api/v1/blocked-dates` |
| POST, GET | `/api/v1/appointments` |
| GET | `/api/v1/appointments/export` |
| PATCH | `/api/v1/appointments/{id}/cancel`, `/api/v1/appointments/{id}/complete` |
| GET | `/swagger-ui.html`, `/v3/api-docs` |

---

## 1. Descrição do Problema Real

Pequenas e médias assistências técnicas frequentemente realizam a gestão de suas visitas presenciais de reparo por meio de anotações telefônicas e planilhas descentralizadas. Esse modelo manual acarreta:
- **Conflitos de agenda**: sobreposição de visitas atribuídas ao mesmo técnico no mesmo intervalo de horário.
- **Falta de controle de regras operacionais**: agendamentos em horários não comerciais, finais de semana ou feriados nacionais sem prévia validação.
- **Perda de histórico operacional e rastreabilidade**: dificuldade em consultar atendimentos passados, extrair dados para conciliação ou acompanhar transições de status (*SCHEDULED*, *CANCELLED*, *COMPLETED*).
- **Baixa visibilidade para clientes e operadores**: ausência de resposta imediata sobre disponibilidade técnica.

O **FixTime** resolve esse cenário fornecendo uma plataforma centralizada e determinística para cadastro de clientes, técnicos, catálogo de serviços com durações e preços padronizados, controle estrito de agenda e cálculo automatizado de janelas de atendimento.

---

## 2. Personas

* **Operador(a) / Gestor(a)**: Cadastra clientes, técnicos e serviços; agenda novas visitas operacionais; gerencia bloqueios de calendário e exporta relatórios de conciliação em CSV.
* **Técnico(a)**: Profissional de campo que cumpre as visitas agendadas dentro de sua jornada de trabalho comercial (dias úteis das 08:00 às 18:00).
* **Cliente**: Solicitante do serviço de assistência técnica que necessita de atendimento pontual e com antecedência programada.

---

## 3. Requisitos Funcionais (RF)

* **RF01 - Gestão de Clientes**: Cadastrar clientes (nome, e-mail, telefone) e listar todos os clientes ativos.
* **RF02 - Gestão de Técnicos**: Cadastrar técnicos (nome, e-mail, telefone) e listar técnicos ativos aptos a receber agendamentos.
* **RF03 - Catálogo de Serviços**: Cadastrar serviços (nome, descrição, duração em minutos, preço em reais) e listar os serviços disponíveis.
* **RF04 - Consulta de Disponibilidade**: Consultar os intervalos livres de um técnico em uma data específica em dias úteis, descontando visitas já agendadas e feriados/datas bloqueadas.
* **RF05 - Criação e Listagem de Agendamentos**: Criar novos agendamentos validando disponibilidade, antecedência e jornada, e listar agendamentos com suporte a filtros combinados (técnico, cliente, status, período) e paginação.
* **RF06 - Cancelamento de Agendamento**: Cancelar agendamentos elegíveis com status `SCHEDULED` e antecedência mínima estipulada.
* **RF07 - Conclusão de Agendamento**: Marcar agendamento com status `SCHEDULED` como `COMPLETED` estritamente após o término do horário da visita.
* **RF08 - Exportação de Histórico em CSV**: Exportar o histórico filtrado de agendamentos em formato CSV streaming (RFC 4180) com BOM UTF-8 e cabeçalho para integração com ferramentas de planilha.
* **RF09 - Autenticação [FORA DE ESCOPO]**: Removido do escopo da v1.0.0 por decisão da equipe. Identificador mantido para rastreabilidade.
* **RF10 - Perfis de Acesso [FORA DE ESCOPO]**: Removido do escopo da v1.0.0 por decisão da equipe. Identificador mantido para rastreabilidade.
* **RF11 - Página Inicial e Navegação (Issues #65 e #66) [NÃO IMPLEMENTADO]**: Frontend possui página inicial (`/`) com apresentação, atalhos e resumo dos agendamentos do dia, além de roteamento com menu de navegação e página 404.
* **RF12 - Agenda Visual Semanal (Issue #69) [NÃO IMPLEMENTADO]**: Visualização em calendário semanal (segunda a sexta) dos agendamentos por técnico, com navegação entre semanas e criação de agendamento a partir de um horário livre.
* **RF13 - Feedback ao Usuário (Issue #70) [NÃO IMPLEMENTADO]**: Frontend exibe estados de carregamento, notificações (toasts) de sucesso/erro e captura erros inesperados com *error boundary*, usando o `ErrorResponse` da API.

---

## 4. Requisitos Não-Funcionais (RNF) - Mensuráveis

* **RNF01 - Arquitetura e Versionamento de API**: Todos os endpoints HTTP devem expor formato RESTful JSON sob o prefixo `/api/v1`, respondendo com `Content-Type: application/json;charset=UTF-8` (exceto exportações binárias/CSV).
* **RNF02 - Desempenho e Latência**: Operações transacionais de leitura e escrita devem responder em menos de **300ms** no percentil 95 (P95) em condições normais de carga local.
* **RNF03 - Consistência Estruturada de Erros**: Toda falha de validação ou de regra de negócio deve retornar payloads com formato JSON padronizado (`ErrorResponse`), contendo `status` (código HTTP numérico), `error` (descrição padrão), `message` (mensagem orientativa em PT-BR) e `fieldErrors` (mapa de campos quando aplicável), sem expor stack traces em produção.
* **RNF04 - Cobertura do Test Harness**: A suíte de testes automatizados deve cobrir **100% das Regras de Negócio (RN01 a RN11)** e alcançar no mínimo **85% de cobertura de linhas** nas classes de serviço de domínio. Medido na v1.0.0: `AppointmentService` 86,0%; `BlockedDateService` 71,4%; `CustomerService` 57,9%; `TechnicianService` 52,6%; `ServiceCatalogService` 60,9% (ver seção 7.1).
* **RNF05 - Reprodutibilidade Total do Ambiente**: O ambiente completo (PostgreSQL, Backend Spring Boot e Frontend React) deve ser inicializável a partir de um único comando (`docker compose up --build`), sem necessidade de instalação prévia de Java, Maven ou Node.js na máquina host.
* **RNF06 - Integração Contínua (Issue #72)**: Todo Pull Request para `develop` deve executar automaticamente `mvn test`, `npm test` e `npm run build`; o merge só é válido com o pipeline verde. O relatório de cobertura é publicado como artefato do workflow.
* **RNF07 - Responsividade e Acessibilidade (Issue #71)**: Telas utilizáveis a partir de **360px** de largura, sem rolagem horizontal da página; formulários e modais com *labels* associados, foco visível, navegação por teclado, contraste mínimo **WCAG 2.1 AA** e pontuação de acessibilidade **>= 90** no Lighthouse nas telas principais.
* **RNF08 - Segurança de Credenciais**: Nenhum segredo, credencial ou dado pessoal real é versionado no repositório; credenciais do banco são fornecidas por variáveis de ambiente (`.env`, ignorado pelo Git, a partir de `.env.example`).

---

## 5. Regras de Negócio (RN)

* **RN01 - Integridade e Ativação de Cadastros**: Clientes, técnicos e serviços informados no agendamento devem existir no banco de dados e possuir status ativo (`active = true`).
* **RN02 - Validação de Valores e Duração**: A duração do serviço deve ser um número inteiro estritamente positivo (> 0 minutos) e o preço deve ser um valor monetário não-negativo (>= 0.00). O término do agendamento (`endsAt`) é sempre calculado pelo backend somando a duração do serviço ao início (`startsAt`).
* **RN03 - Antecedência Mínima de Agendamento**: O início da visita (`startsAt`) deve ocorrer no futuro com pelo menos **2 horas de antecedência** em relação ao momento da requisição (`Clock` atual).
* **RN04 - Janela de Atendimento Comercial**: A visita técnica deve ser agendada exclusivamente de **segunda a sexta-feira (dias úteis)**, iniciando no máximo a partir das **08:00** e concluindo impreterivelmente até as **18:00** do mesmo dia civil.
* **RN05 - Bloqueio de Sobreposição de Agenda**: Um técnico não pode ter dois agendamentos com horários sobrepostos em status `SCHEDULED`. Intervalos adjacentes (onde o término de uma visita coincide com o início exato da próxima) são explicitamente permitidos.
* **RN06 - Política de Cancelamento**: O cancelamento (`CANCELLED`) é permitido apenas para agendamentos em status `SCHEDULED` e deve ser requisitado com no mínimo **2 horas de antecedência** do horário de início (`startsAt`).
* **RN07 - Política de Conclusão**: A conclusão (`COMPLETED`) só pode ser registrada em agendamentos em status `SCHEDULED` e **estritamente após** o horário final previsto da visita (`endsAt`).
* **RN08 - Bloqueio de Feriados e Indisponibilidades**: Não são permitidos agendamentos em datas bloqueadas cadastradas pelo operador nem em feriados nacionais fixos brasileiros (ex.: 01/01, 21/04, 01/05, 07/09, 12/10, 02/11, 15/11, 20/11, 25/12). A consulta de disponibilidade deve retornar lista vazia nessas datas.
* **RN09 - Autenticação e Token [FORA DE ESCOPO]**: Removida do escopo da v1.0.0. Identificador mantido para rastreabilidade.
* **RN10 - Autorização por Perfil [FORA DE ESCOPO]**: Removida do escopo da v1.0.0. Identificador mantido para rastreabilidade.
* **RN11 - Agenda Semanal (Issue #69) [NÃO IMPLEMENTADO]**: A visão semanal exibe apenas dias úteis, faixa 08:00-18:00, agendamentos `SCHEDULED`/`COMPLETED` do técnico selecionado e destaca feriados e datas bloqueadas (RN08). Horários passados ou com menos de 2h de antecedência (RN03) não permitem criar agendamento.

---

## 6. Contratos Literais de Entrada e Saída

### 6.1. Clientes

#### Criar Cliente
* **Método/URL:** `POST /api/v1/customers`
* **Request Payload (201 Created):**
```json
{
  "name": "Carlos Silva",
  "email": "carlos.silva@example.com",
  "phone": "11987654321"
}
```
* **Response Payload (201 Created):**
```json
{
  "id": 1,
  "name": "Carlos Silva",
  "email": "carlos.silva@example.com",
  "phone": "11987654321",
  "active": true
}
```

#### Listar Clientes
* **Método/URL:** `GET /api/v1/customers`
* **Response Payload (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Carlos Silva",
    "email": "carlos.silva@example.com",
    "phone": "11987654321",
    "active": true
  }
]
```

---

### 6.2. Técnicos

#### Criar Técnico
* **Método/URL:** `POST /api/v1/technicians`
* **Request Payload (201 Created):**
```json
{
  "name": "Mariana Costa",
  "email": "mariana.costa@example.com",
  "phone": "11912345678"
}
```
* **Response Payload (201 Created):**
```json
{
  "id": 2,
  "name": "Mariana Costa",
  "email": "mariana.costa@example.com",
  "phone": "11912345678",
  "active": true
}
```

---

### 6.3. Catálogo de Serviços

#### Criar Serviço
* **Método/URL:** `POST /api/v1/services`
* **Request Payload (201 Created):**
```json
{
  "name": "Manutenção de Ar-Condicionado",
  "description": "Limpeza, higienização e recarga de gás",
  "durationMinutes": 90,
  "price": 250.00
}
```
* **Response Payload (201 Created):**
```json
{
  "id": 3,
  "name": "Manutenção de Ar-Condicionado",
  "description": "Limpeza, higienização e recarga de gás",
  "durationMinutes": 90,
  "price": 250.00,
  "active": true
}
```

---

### 6.4. Disponibilidade de Técnicos

#### Consultar Janelas Livres
* **Método/URL:** `GET /api/v1/technicians/{id}/availability?date=2026-09-14`
* **Response Payload (200 OK):**
```json
[
  {
    "startsAt": "2026-09-14T08:00:00",
    "endsAt": "2026-09-14T10:00:00"
  },
  {
    "startsAt": "2026-09-14T11:30:00",
    "endsAt": "2026-09-14T18:00:00"
  }
]
```

---

### 6.5. Datas Bloqueadas e Feriados

#### Criar Bloqueio de Data
* **Método/URL:** `POST /api/v1/blocked-dates`
* **Request Payload (201 Created):**
```json
{
  "date": "2026-12-31",
  "reason": "Recesso de Fim de Ano"
}
```
* **Response Payload (201 Created):**
```json
{
  "id": 1,
  "date": "2026-12-31",
  "reason": "Recesso de Fim de Ano"
}
```

---

### 6.6. Agendamentos

#### Criar Agendamento
* **Método/URL:** `POST /api/v1/appointments`
* **Request Payload (201 Created):**
```json
{
  "customerId": 1,
  "technicianId": 2,
  "serviceId": 3,
  "startsAt": "2026-09-14T10:00:00"
}
```
* **Response Payload (201 Created):**
```json
{
  "id": 10,
  "customerId": 1,
  "technicianId": 2,
  "serviceId": 3,
  "startsAt": "2026-09-14T10:00:00",
  "endsAt": "2026-09-14T11:30:00",
  "status": "SCHEDULED"
}
```

#### Listar Agendamentos com Paginação e Filtros
* **Método/URL:** `GET /api/v1/appointments?technicianId=2&status=SCHEDULED&startDate=2026-09-01&endDate=2026-09-30&page=0&size=20&sort=startsAt,asc`
* **Response Payload (200 OK):**
```json
{
  "content": [
    {
      "id": 10,
      "customerId": 1,
      "technicianId": 2,
      "serviceId": 3,
      "startsAt": "2026-09-14T10:00:00",
      "endsAt": "2026-09-14T11:30:00",
      "status": "SCHEDULED"
    }
  ],
  "pageNumber": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

#### Cancelar Agendamento
* **Método/URL:** `PATCH /api/v1/appointments/{id}/cancel`
* **Response Payload (200 OK):**
```json
{
  "id": 10,
  "customerId": 1,
  "technicianId": 2,
  "serviceId": 3,
  "startsAt": "2026-09-14T10:00:00",
  "endsAt": "2026-09-14T11:30:00",
  "status": "CANCELLED"
}
```

#### Concluir Agendamento
* **Método/URL:** `PATCH /api/v1/appointments/{id}/complete`
* **Response Payload (200 OK):**
```json
{
  "id": 10,
  "customerId": 1,
  "technicianId": 2,
  "serviceId": 3,
  "startsAt": "2026-09-14T10:00:00",
  "endsAt": "2026-09-14T11:30:00",
  "status": "COMPLETED"
}
```

#### Exportar Agendamentos em CSV
* **Método/URL:** `GET /api/v1/appointments/export?startDate=2026-09-01&endDate=2026-09-30`
* **Headers de Resposta (200 OK):**
  - `Content-Type: text/csv; charset=UTF-8`
  - `Content-Disposition: attachment; filename=appointments-YYYY-MM-DD.csv`
* **Corpo da Resposta:** Streaming com UTF-8 BOM (`0xEF, 0xBB, 0xBF`), cabeçalho e linhas conformes com RFC 4180.
```csv
ID,Data Inicio,Data Fim,ID Cliente,Nome Cliente,ID Tecnico,Nome Tecnico,ID Servico,Nome Servico,Duracao (min),Preco (R$),Status
10,2026-09-14 10:00:00,2026-09-14 11:30:00,1,Carlos Silva,2,Mariana Costa,3,Manutenção de Ar-Condicionado,90,250.00,SCHEDULED
```

---

### 6.7. Autenticação — Fora de escopo

A v1.0.0 não expõe `/api/v1/auth/login` nem exige token; todos os endpoints são abertos (ver seção 0).

---

### 6.8. Rotas do Frontend (Issues #65, #66, #69 e #70) — Não implementado (contrato planejado)

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/` | Página inicial: descrição, atalhos e resumo do dia | Livre |
| `/agenda` | Agenda em lista (atual) e visão semanal por técnico | Livre |
| `/customers`, `/technicians`, `/services` | Cadastros | Livre |
| `*` | Página 404 | Qualquer |

* **Resumo do dia (sem novo endpoint):** `GET /api/v1/appointments?startDate=<hoje>&endDate=<hoje>&status=SCHEDULED&size=1`, usando `totalElements`.
* **Agenda semanal (sem novo endpoint):** `GET /api/v1/appointments?technicianId=<id>&startDate=<segunda>&endDate=<sexta>&size=100&sort=startsAt,asc` combinado com `GET /api/v1/technicians/{id}/availability`.
* **Erros e feedback:** respostas `ErrorResponse` são exibidas em toast com o campo `message`.

---

### 6.9. Formato Padronizado de Resposta de Erros

#### Erro de Validação de Regra de Negócio (400 Bad Request)
```json
{
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "A visita deve iniciar com pelo menos duas horas de antecedencia",
  "timestamp": "2026-09-12T16:50:00.123",
  "path": "/api/v1/appointments"
}
```

#### Erro de Conflito de Horário (409 Conflict)
```json
{
  "status": 409,
  "error": "CONFLICT",
  "message": "O tecnico ja possui uma visita nesse intervalo",
  "timestamp": "2026-09-12T16:50:00.456",
  "path": "/api/v1/appointments"
}
```

#### Erro de Recurso Não Encontrado (404 Not Found)
```json
{
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Agendamento nao encontrado com o ID 999",
  "timestamp": "2026-09-12T16:50:00.789",
  "path": "/api/v1/appointments/999/cancel"
}
```

---

## 7. Decomposição em Unidades Testáveis

O sistema adota uma arquitetura em camadas com separação estrita de responsabilidades:

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)              │
│  - Pages (Customers, Technicians, Services, Agenda)    │
│  - API Client Tipado (client.ts & resources.ts)        │
│  - Utils de Elegibilidade e Componentes Modais         │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON /api/v1
┌───────────────────────────▼────────────────────────────┐
│              Controllers / REST API DTOs               │
│  - AppointmentController, CustomerController, etc.     │
│  - GlobalExceptionHandler (Padronização JSON 4xx/5xx)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               Domain Services (Regras RN01-RN08)       │
│  - AppointmentService (Validações de Agenda e Horário) │
│  - CustomerService, TechnicianService, CatalogService  │
│  - BlockedDateService & NationalHolidayProvider        │
│  - AppointmentExportService & AppointmentCsvWriter     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             Data Layer (JPA Repositories)              │
│  - AppointmentRepository (Custom queries de conflito)  │
│  - Spring Data Specifications (Filtros combinados)     │
│  - Entidades JPA: Appointment, Customer, Service, etc. │
└────────────────────────────────────────────────────────┘
```

### Unidades de Teste Mapeadas:
1. **Modelos e Entidades**: Construtores, integridade de campos e conversão para DTOs (`AppointmentResponse`, etc.).
2. **Serviços de Domínio**: Testes unitários com `Clock` fixo e mocks (`AppointmentServiceTest`, `CustomerServiceTest`).
3. **API e Controladores Web**: Testes de integração ponta a ponta com `MockMvc` e banco em memória H2 (`AppointmentIntegrationTest`, `BlockedDateIntegrationTest`, `AppointmentExportIntegrationTest`, `HealthControllerTest`).
4. **Clientes e Componentes Web**: Testes de componentes React e funções utilitárias com `Vitest` e `@testing-library/react`.
5. **Navegação e UX (planejado, não implementado)**: testes de rotas, página inicial, agenda semanal (RN11), toasts/error boundary e verificação de acessibilidade (axe) nas telas principais.

### 7.1. Cobertura de Código Medida (v1.0.0)

| Módulo | Ferramenta | Linhas | Branches |
| --- | --- | --- | --- |
| Backend (47 testes) | JaCoCo 0.8.12 | 80,6% | 69,4% |
| Frontend (61 testes) | Vitest + V8 | 87,1% | 84,6% |

Detalhes e comandos de reprodução em [test-report.md](test-report.md).

---

## 8. Registro de Refinamentos e Evolução da Spec

O histórico completo de decisões de refinamento está versionado em [docs/spec-changelog.md](docs/spec-changelog.md).

* **v1.0 (2026-09-02)**: Definição do escopo MVP, regras de antecedência de 2h e horário comercial (08h às 18h).
* **v1.1 (2026-09-03)**: Duração obtida do catálogo de serviços, padronização de erros HTTP via `GlobalExceptionHandler`, suporte a intervalos adjacentes e endpoints PATCH de status.
* **v1.2 (2026-09-12)**: Exportação streaming de agendamentos em CSV com BOM UTF-8, bloqueio automático de feriados nacionais e filtros combinados com paginação.
* **v1.0.0 As-Built (2026-10-19)**: Consolidação do que foi entregue; itens da proposta v1.3 não implementados foram marcados como tal.
* **v1.3 (2026-10-02, proposta, parcialmente não implementada)**: Proposta de autenticação JWT e perfis de acesso (RF09, RF10, RN09, RN10; retirada do escopo na v1.0.0), página inicial, roteamento, agenda semanal e feedback ao usuário no frontend (RF11 a RF13, RN11), CI, responsividade/acessibilidade e segurança de credenciais (RNF06 a RNF08). Autenticação foi retirada do escopo da v1.0.0.

---

## 9. Fora de Escopo

Autenticação e autorização de usuários (JWT, perfis ADMIN/ATENDENTE; planejadas na proposta v1.3 e retiradas do escopo da v1.0.0), OAuth2/SSO e provedores externos de identidade, cadastro público de usuários, recuperação de senha, pagamentos online, envio de SMS/WhatsApp, geolocalização e rotas em mapa, e aplicativo mobile nativo.
