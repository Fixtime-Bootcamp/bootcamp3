# Especificação Técnica (SDD): FixTime

**Versão da Especificação:** 1.3  
**Status:** Em revisão (v1.3 pendente de aprovação da equipe; v1.2 aprovada)  
**Documento Base:** Spec-Driven Development (SDD)  

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
* **RF09 - Autenticação (Issue #67)**: Operador autentica-se com e-mail e senha e recebe um token JWT; todas as demais rotas `/api/v1` exigem token válido. Frontend oferece tela de login, rota protegida e logout.
* **RF10 - Perfis de Acesso (Issue #68)**: Usuários possuem perfil `ADMIN` ou `ATENDENTE`, que define quais operações são permitidas (ver RN10).
* **RF11 - Página Inicial e Navegação (Issues #65 e #66)**: Frontend possui página inicial (`/`) com apresentação, atalhos e resumo dos agendamentos do dia, além de roteamento com menu de navegação e página 404.
* **RF12 - Agenda Visual Semanal (Issue #69)**: Visualização em calendário semanal (segunda a sexta) dos agendamentos por técnico, com navegação entre semanas e criação de agendamento a partir de um horário livre.
* **RF13 - Feedback ao Usuário (Issue #70)**: Frontend exibe estados de carregamento, notificações (toasts) de sucesso/erro e captura erros inesperados com *error boundary*, usando o `ErrorResponse` da API.

---

## 4. Requisitos Não-Funcionais (RNF) - Mensuráveis

* **RNF01 - Arquitetura e Versionamento de API**: Todos os endpoints HTTP devem expor formato RESTful JSON sob o prefixo `/api/v1`, respondendo com `Content-Type: application/json;charset=UTF-8` (exceto exportações binárias/CSV).
* **RNF02 - Desempenho e Latência**: Operações transacionais de leitura e escrita devem responder em menos de **300ms** no percentil 95 (P95) em condições normais de carga local.
* **RNF03 - Consistência Estruturada de Erros**: Toda falha de validação ou de regra de negócio deve retornar payloads com formato JSON padronizado (`ErrorResponse`), contendo `status` (código HTTP numérico), `error` (descrição padrão), `message` (mensagem orientativa em PT-BR) e `fieldErrors` (mapa de campos quando aplicável), sem expor stack traces em produção.
* **RNF04 - Cobertura do Test Harness**: A suíte de testes automatizados deve cobrir **100% das Regras de Negócio (RN01 a RN11)** e alcançar no mínimo **85% de cobertura de linhas** nas classes de serviço de domínio.
* **RNF05 - Reprodutibilidade Total do Ambiente**: O ambiente completo (PostgreSQL, Backend Spring Boot e Frontend React) deve ser inicializável a partir de um único comando (`docker compose up --build`), sem necessidade de instalação prévia de Java, Maven ou Node.js na máquina host.
* **RNF06 - Integração Contínua (Issue #72)**: Todo Pull Request para `develop` deve executar automaticamente `mvn test`, `npm test` e `npm run build`; o merge só é válido com o pipeline verde. O relatório de cobertura é publicado como artefato do workflow.
* **RNF07 - Responsividade e Acessibilidade (Issue #71)**: Telas utilizáveis a partir de **360px** de largura, sem rolagem horizontal da página; formulários e modais com *labels* associados, foco visível, navegação por teclado, contraste mínimo **WCAG 2.1 AA** e pontuação de acessibilidade **>= 90** no Lighthouse nas telas principais.
* **RNF08 - Segurança de Credenciais (Issue #67)**: Senhas armazenadas apenas como hash BCrypt; segredo de assinatura do JWT e credenciais do usuário inicial fornecidos por variáveis de ambiente (`FIXTIME_JWT_SECRET`, `FIXTIME_ADMIN_EMAIL`, `FIXTIME_ADMIN_PASSWORD`), nunca versionados no repositório. Respostas 401/403 não revelam se o e-mail existe.

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
* **RN09 - Autenticação e Token (Issue #67)**: O login valida e-mail e senha (hash BCrypt) de um usuário ativo. Credenciais inválidas retornam `401` com mensagem genérica. O token JWT expira em **60 minutos** e carrega e-mail e perfil. Rotas públicas: `POST /api/v1/auth/login` e `GET /api/v1/health`; qualquer outra rota sem token válido retorna `401`.
* **RN10 - Autorização por Perfil (Issue #68)**: Aplicada na camada de service/segurança, nunca nos controllers. `ADMIN`: acesso total. `ATENDENTE`: pode listar/cadastrar clientes, listar técnicos e serviços, consultar disponibilidade e criar, listar, cancelar, concluir e exportar agendamentos. Cadastro de técnicos e serviços e criação de bloqueios de data são exclusivos de `ADMIN`; operação negada retorna `403`.
* **RN11 - Agenda Semanal (Issue #69)**: A visão semanal exibe apenas dias úteis, faixa 08:00-18:00, agendamentos `SCHEDULED`/`COMPLETED` do técnico selecionado e destaca feriados e datas bloqueadas (RN08). Horários passados ou com menos de 2h de antecedência (RN03) não permitem criar agendamento.

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

### 6.7. Autenticação (Issues #67 e #68)

#### Login
* **Método/URL:** `POST /api/v1/auth/login` (público)
* **Request Payload:**
```json
{
  "email": "admin@fixtime.local",
  "password": "senha-informada-pelo-usuario"
}
```
* **Response Payload (200 OK):**
```json
{
  "token": "<jwt>",
  "tokenType": "Bearer",
  "expiresInSeconds": 3600,
  "email": "admin@fixtime.local",
  "role": "ADMIN"
}
```
* **Uso do token:** header `Authorization: Bearer <jwt>` nas demais rotas.
* **Erros:** `400` (campos ausentes/inválidos, com `fieldErrors`), `401` (credenciais inválidas ou token ausente/expirado), `403` (perfil sem permissão).
```json
{
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Credenciais invalidas",
  "timestamp": "2026-10-02T10:00:00.000",
  "path": "/api/v1/auth/login"
}
```
```json
{
  "status": 403,
  "error": "FORBIDDEN",
  "message": "Acesso negado para o perfil informado",
  "timestamp": "2026-10-02T10:00:00.000",
  "path": "/api/v1/technicians"
}
```

---

### 6.8. Rotas do Frontend (Issues #65, #66, #69 e #70)

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/login` | Login | Público |
| `/` | Página inicial: descrição, atalhos e resumo do dia | Autenticado |
| `/agenda` | Agenda em lista (atual) e visão semanal por técnico | Autenticado |
| `/customers`, `/technicians`, `/services` | Cadastros | Autenticado (escrita em técnicos/serviços só `ADMIN`) |
| `*` | Página 404 | Qualquer |

* **Resumo do dia (sem novo endpoint):** `GET /api/v1/appointments?startDate=<hoje>&endDate=<hoje>&status=SCHEDULED&size=1`, usando `totalElements`.
* **Agenda semanal (sem novo endpoint):** `GET /api/v1/appointments?technicianId=<id>&startDate=<segunda>&endDate=<sexta>&size=100&sort=startsAt,asc` combinado com `GET /api/v1/technicians/{id}/availability`.
* **Erros e feedback:** respostas `ErrorResponse` são exibidas em toast com o campo `message`; `401` redireciona para `/login` e limpa o token.

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
5. **Segurança (v1.3)**: `AuthService` (login válido, senha incorreta, usuário inativo, expiração do token) e `AuthIntegrationTest` com `MockMvc` (401 sem token, 403 por perfil, rotas públicas) para RN09 e RN10.
6. **Navegação e UX (v1.3)**: testes de rotas protegidas e redirecionamento ao login, página inicial, agenda semanal (RN11), toasts/error boundary e verificação de acessibilidade (axe) nas telas principais.

---

## 8. Registro de Refinamentos e Evolução da Spec

O histórico completo de decisões de refinamento está versionado em [docs/spec-changelog.md](docs/spec-changelog.md).

* **v1.0 (2026-09-02)**: Definição do escopo MVP, regras de antecedência de 2h e horário comercial (08h às 18h).
* **v1.1 (2026-09-03)**: Duração obtida do catálogo de serviços, padronização de erros HTTP via `GlobalExceptionHandler`, suporte a intervalos adjacentes e endpoints PATCH de status.
* **v1.2 (2026-09-12)**: Exportação streaming de agendamentos em CSV com BOM UTF-8, bloqueio automático de feriados nacionais e filtros combinados com paginação.
* **v1.3 (2026-10-02, proposta)**: Autenticação JWT e perfis de acesso (RF09, RF10, RN09, RN10), página inicial, roteamento, agenda semanal e feedback ao usuário no frontend (RF11 a RF13, RN11), CI, responsividade/acessibilidade e segurança de credenciais (RNF06 a RNF08). Autenticação deixa de ser fora de escopo.

---

## 9. Fora de Escopo

OAuth2/SSO e provedores externos de identidade, cadastro público de usuários, recuperação de senha, pagamentos online, envio de SMS/WhatsApp, geolocalização e rotas em mapa, e aplicativo mobile nativo.
