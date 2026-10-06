# Inspeção de Erros Lógicos, Loop de Re-especificação e Relato de Experiência - FixTime

**Entrega:** Entrega 2 - Publicação do Projeto, Refinamento e Análise Crítica  
**Projeto:** FixTime - Plataforma de Agendamento para Assistência Técnica  
**Equipe:**  
- Caio Boudens de Castro - RA: 22304522  
- Eduardo Frois Drumond - RA: 22303035  
- Fernando Medeiros Farias - RA: 22306100  
- Larissa Queiroz Ramos - RA: 22304308  
- Mayssa Barbosa Dias - RA: 22303603  
- Thiago Venâncio Gomides - RA: 22307398  

---

## 1. Introdução

O desenvolvimento do **FixTime** foi estruturado segundo o modelo **Spec-Driven Development (SDD)**, no qual nenhuma linha de código em produção ou nos testes é escrita sem prévia ancoragem em requisitos formais descritos em [docs/SPEC.md](SPEC.md). 

Durante o ciclo iterativo de construção da aplicação, a combinação de testes automatizados rigorosos (Backend em Spring Boot e Frontend em React) com a revisão humana entre pares revelou erros lógicos sutis, inconsistências de contrato e cenários de borda não previstos inicialmente.

Este documento registra a inspeção detalhada desses erros lógicos, as estratégias de correção adotadas, o ciclo de re-especificação técnica e o relato reflexivo sobre os desafios e aprendizados da colaboração em grupo.

---

## 2. Inspeção e Correção de Erros Lógicos

Abaixo estão descritos os principais erros lógicos detectados durante o ciclo de desenvolvimento, as falhas manifestadas no Test Harness e as soluções arquiteturais e algorítmicas aplicadas.

```
       ┌────────────────────────┐
       │   Especificação (SDD)  │
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │ Implementação + Mocks  │
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │  Execução do Harness   │◄────────────────────────┐
       └───────────┬────────────┘                         │
                   │                                      │
          [Falha de Teste /                               │ Loop de
           Erro Lógico]                                   │ Correção
                   │                                      │
                   ▼                                      │
       ┌────────────────────────┐                         │
       │ Diagnóstico + Refinamento ───────────────────────┘
       │  (Contrato / Código)   │
       └────────────────────────┘
```

---

### Caso 1: Divergência na Origem e Integridade da Duração do Serviço

* **Contexto:** Na primeira versão do DTO de criação de agendamento (`CreateAppointmentRequest`), o cliente HTTP enviava tanto `serviceId` quanto `durationMinutes`.
* **Erro Lógico Identificado:** O backend permitia que o requisitante informasse um valor arbitrário de `durationMinutes` (por exemplo, 15 minutos para uma formatação que cadastralmente exige 120 minutos). Isso causava duas falhas graves:
  1. Quebra da integridade com a tabela de catálogo de serviços (`ServiceEntity`).
  2. Burlar o bloqueio de sobreposição de agenda (`RN05`), reservando janelas menores que a real necessidade da assistência.
* **Estratégia de Correção (Issue #1 e #8):**
  - O campo `durationMinutes` foi removido do payload de entrada da requisição.
  - O backend passou a buscar a entidade `ServiceEntity` gerenciada no banco de dados, validando seu status ativo (`active = true`).
  - O horário de término (`endsAt`) passou a ser obrigatoriamente derivado no backend através da fórmula determinística:
    $$\text{endsAt} = \text{startsAt} + \text{service.getDurationMinutes()}$$
* **Testes Associados:** `AppointmentServiceTest.shouldCalculateEndsAtFromServiceDuration()` e validação com mock de `ServiceRepository`.

---

### Caso 2: Falso Positivo no Bloqueio de Horários Adjacentes (RN05)

* **Contexto:** A Regra de Negócio `RN05` estipula que técnicos não podem ter agendamentos conflitantes no mesmo horário, mas **horários adjacentes são explicitamente permitidos** (isto é, um agendamento terminando às 10:00 e outro iniciando exatamente às 10:00).
* **Erro Lógico Identificado:** A consulta inicial no banco utilizava comparações inclusivas amplas (`startsAt <= :newEnd AND endsAt >= :newStart`). Com isso, uma visita que terminava exatamente no milissegundo inicial da próxima era tratada como sobreposição, gerando uma exceção indevida `409 Conflict`.
* **Estratégia de Correção (Issue #10):**
  - Ajuste na especificação formal do predicado SQL e na validação em memória do repositório:
    $$\text{Conflito} \iff (\text{existente.startsAt} < \text{novo.endsAt}) \land (\text{existente.endsAt} > \text{novo.startsAt})$$
  - Essa definição estrita em intervalos abertos nas extremidades garantiu que:
    - Intervalo A: [09:00, 10:00) e Intervalo B: [10:00, 11:00) não colidem.
* **Testes Associados:** `AppointmentIntegrationTest.shouldAllowAdjacentAppointments()` e `AppointmentServiceTest.shouldAllowAdjacentAppointments()`.

---

### Caso 3: Flutuação Temporal e Falhas Intermitentes nos Testes de Antecedência (RN03)

* **Contexto:** A regra `RN03` exige que todo agendamento ocorra com no mínimo **2 horas de antecedência** em relação ao momento atual da solicitação.
* **Erro Lógico Identificado:** Nos testes unitários e de integração, o código utilizava chamadas diretas a `Instant.now()`. Dependendo da latência de execução da máquina local ou do pipeline de CI, o intervalo entre a montagem do payload e a asserção no controller variava em frações de milissegundo, provocando testes "flaky" (falhas intermitentes de `400 Bad Request` por antecedência marginal de 1h59m59s).
* **Estratégia de Correção (Issue #17):**
  - Substituição de chamadas estáticas `Instant.now()` por um bean gerenciado `java.time.Clock`.
  - Injeção de `Clock.fixed(instant, ZoneOffset.UTC)` nas classes de teste e nos serviços de domínio (`AppointmentService`).
  - O tempo de referência tornou-se imutável e determinístico em cada suíte de teste, eliminando 100% dos falsos negativos.
* **Testes Associados:** `AppointmentServiceTest` configurado com relógio congelado em `2026-10-05T08:00:00Z`.

---

### Caso 4: Tentativa de Conclusão Prematura de Visitas Técnicas (RN07)

* **Contexto:** A transição para o status `COMPLETED` só é legítima após o atendimento ter sido efetivamente prestado pelo técnico em campo.
* **Erro Lógico Identificado:** O endpoint inicial permitia disparar a conclusão logo após a criação do agendamento, mesmo que a visita estivesse agendada para dias futuros.
* **Estratégia de Correção (Issue #13):**
  - Inclusão de trava condicional no `AppointmentService.completeAppointment()`:
    ```java
    if (clock.instant().isBefore(appointment.getEndsAt())) {
        throw new BusinessRuleException("Agendamento só pode ser concluído após o término previsto da visita.");
    }
    ```
  - Mapeamento no `GlobalExceptionHandler` para resposta `400 Bad Request` padronizada.
* **Testes Associados:** `AppointmentServiceTest.shouldRejectCompletionBeforeEndsAt()` e `AppointmentServiceTest.shouldCompleteAfterEndsAt()`.

---

### Caso 5: Corrupção de Caracteres Acentuados no CSV em Softwares de Planilha (RF08)

* **Contexto:** O requisito `RF08` definiu a exportação dos agendamentos em formato CSV.
* **Erro Lógico Identificado:** Embora a API respondesse com `Content-Type: text/csv; charset=UTF-8`, ao abrir o arquivo no Microsoft Excel em sistemas operacionais em português (Windows), nomes como "Técnico João", "Instalação Elétrica" e "São Paulo" apareciam corrompidos com mojibake (`TÃ©cnico JoÃ£o`).
* **Estratégia de Correção (Issue #28):**
  - Implementação de streaming com inclusão explícita do **UTF-8 BOM (Byte Order Mark: `0xEF, 0xBB, 0xBF`)** no início do stream de bytes (`AppointmentCsvWriter`).
  - Escrita em conformidade estrita com a **RFC 4180** (campos com vírgulas ou aspas encapsulados por aspas duplas escapadas).
* **Testes Associados:** `AppointmentCsvWriterTest.shouldWriteUtf8Bom()` e `AppointmentExportIntegrationTest.shouldExportCsvWithAccentsAndBom()`.

---

## 3. Loop de Re-especificação (SDD Feedback Loop)

O princípio central do **Spec-Driven Development** é que o documento de especificação não é estático; ele é a "única fonte da verdade" viva do sistema. Sempre que uma inconsistência foi detectada, a equipe executou o loop formal:

```
[Detectar Inconsistência] 
       │
       ▼
[Pausar Implementação] 
       │
       ▼
[Atualizar docs/SPEC.md & docs/spec-changelog.md] 
       │
       ▼
[Criar/Atualizar Teste que Falha] 
       │
       ▼
[Implementar Correção no Código de Produção] 
       │
       ▼
[Validação pelo Test Harness (100% Green)]
```

### Principais Refinamentos Registrados no Changelog:

1. **Definição Estrita do Domínio (2026-09-02):**
   - *Decisão Original:* O escopo inicial cogitava agendamentos de consultoria geral.
   - *Refinamento:* Redirecionado para assistência técnica com catálogo fixo e técnicos alocados, tornando as regras de duração, horário comercial e conflitos 100% testáveis.
2. **Postergada Autenticação na Sprint 1 (2026-09-02):**
   - *Decisão Original:* Exigir OAuth2/JWT desde a primeira sprint.
   - *Refinamento:* Removida temporariamente para priorizar solidez do domínio, integridade relacional e harness. Re-especificada para inclusão na v1.3 (Issues #67 e #68).
3. **Formalização de Erros Uniformes (2026-09-03):**
   - *Decisão Original:* Deixar o Spring Boot responder com o payload padrão (`timestamp, status, error, path`).
   - *Refinamento:* Especificação do contrato `ErrorResponse` com campos `code`, `message` e mapa `fieldErrors` para simplificar a renderização no frontend.
4. **Exportação Operacional em CSV (2026-09-12):**
   - *Decisão Original:* Relatórios previstos apenas em endpoints JSON.
   - *Refinamento:* Necessidade operacional identificada de exportação em planilha com filtros combinados de período, técnico e status.

---

## 4. Relato de Experiência da Equipe

### 4.1. Dinâmica e Estrutura do Trabalho em Grupo
O grupo foi composto por 6 integrantes, dividindo responsabilidades entre modelagem arquitetural, implementação backend (Java 21 / Spring Boot), frontend SPA (React 19 / TypeScript) e engenharia de qualidade (Test Harness e Docker).

A governança do projeto foi ancorada no **GitHub Projects** e no fluxo estrito de **Pull Requests**:
- Commits diretos nas branches `main` e `develop` foram bloqueados.
- Cada funcionalidade teve branch dedicada originada de `develop` (`feature/issue-<num>-<nome>`).
- Nenhum PR foi mergeado sem code review de outro integrante e execução verde dos testes.

### 4.2. Desafios Enfrentados
1. **Sincronização entre Contratos Backend e Consumo Frontend:**
   - No início, pequenos desalinhamentos de nomenclatura (ex.: `technicianId` vs `technician_id`, formatos de data ISO-8601 UTC) causaram erros de parsing no frontend.
   - *Superação:* A especificação em `docs/SPEC.md` com exemplos literais de JSON e posteriormente o design tipado do cliente HTTP (`src/api/client.ts`) eliminaram qualquer ambiguidade.
2. **Complexidade de Testes Temporais e Datas:**
   - Validar horários comerciais (08:00 às 18:00), fins de semana e feriados móveis sem depender da data corrente da máquina exigiu refatoração arquitetural com injeção de relógio.
   - *Superação:* Adoção unificada de `Clock` e implementação do `NationalHolidayProvider` determinístico.
3. **Manutenção da Higiene do Repositório Git:**
   - Com dezenas de issues e sprints iterativas, o volume de branches acumuladas começou a dificultar a navegação.
   - *Superação:* Estabeleceu-se a política obrigatória de deleção automática e poda (`prune`) de feature branches pós-merge, mantendo o repositório organizado com apenas `develop` e `main`.

### 4.3. Aprendizados Consolidados
- **O valor do SDD sobre o desenvolvimento ad-hoc:** Ter uma especificação clara reduziu o retrabalho a quase zero nas etapas finais. Quando uma dúvida surgia, o time consultava o documento antes de tomar decisões arbitrárias.
- **Testes como Documentação Executável:** Os 104 testes automatizados serviram como rede de segurança contínua. Qualquer refatoração nos services foi validada em segundos.
- **Colaboração e Code Review Real:** O processo de revisão entre pares gerou aprendizado mútuo, nivelando o conhecimento técnico da equipe e garantindo que ninguém atuasse como "dono isolado" de uma parte do código.
