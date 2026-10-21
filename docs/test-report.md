# Relatório Consolidado de Execução do Test Harness - FixTime

**Data da Execução Final:** 2026-10-21  
**Status Geral:** ✅ **PASS (100% de Sucesso / Zero Falhas)**  
**Total de Testes Automatizados:** 152 testes aprovados (72 backend + 80 frontend)  
**Log Consolidado do Harness:** [logs_testes_final.txt](../logs_testes_final.txt)  
**Rastreabilidade:** 100% dos testes referenciam as Regras de Negócio (`RN01` a `RN08`) e Requisitos Funcionais (`RF01` a `RF08`) via docstrings.

---

## 1. Backend (Java 21 & Spring Boot 3.4.5)

### Comandos de Execução:
```bash
# Execução nativa local:
cd backend
mvn clean test

# Ou execução via Docker (comando único para backend e frontend, com cobertura):
docker compose --profile test up --build --abort-on-container-exit backend-tests frontend-tests
```

### Resumo da Suíte Backend:
* **Classes de Teste:** 10
* **Testes Executados:** 72
* **Falhas (Failures):** 0
* **Erros (Errors):** 0
* **Ignorados (Skipped):** 0
* **Tempo Total:** ~40 segundos
* **Status:** **BUILD SUCCESS**

```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 72, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Mapeamento de Cobertura das Regras de Negócio e Contratos:
1. **`AppointmentServiceTest` (Testes Unitários de Domínio com Mocks e `Clock` Fixo):**
   * `RN01` & `RF05`: Criação de agendamento em horário comercial futuro com cálculo automático de término (`endsAt`).
   * `RN03`: Rejeição de agendamento com antecedência menor que 2 horas.
   * `RN04`: Rejeição de agendamentos em fins de semana (Sábado/Domingo).
   * `RN04`: Rejeição de agendamentos fora do horário de atendimento (08:00 às 18:00).
   * `RN05`: Bloqueio de sobreposição de horário para o mesmo técnico (`ConflictException`).
   * `RN06` & `RF06`: Cancelamento com sucesso com antecedência mínima de 2 horas.
   * `RN06`: Rejeição de cancelamento com menos de 2 horas de antecedência.
   * `RN07` & `RF07`: Conclusão bem-sucedida estritamente após o término da visita (`endsAt`).
   * `RN07`: Rejeição de conclusão antes do término da visita (`IllegalStateException`).
   * `RN08` & `RF04`: Zeramento de disponibilidade em feriados/datas bloqueadas.
   * `RN08`: Rejeição de agendamento em datas bloqueadas ou feriados.
   * `RF08`: Mapeamento de período e validação de `startDate <= endDate` para exportação CSV.
2. **`AppointmentIntegrationTest` (Testes de Integração Ponta a Ponta com MockMvc e H2):**
   * `RF01, RF02, RF03, RF05, RF06`: Fluxo completo de cadastro, agendamento, bloqueio de conflito (409 Conflict), horários adjacentes permitidos e cancelamento.
   * `RF05`: Paginação padrão (`page=0, size=20, sort=startsAt,asc`) e navegação além dos dados.
   * `RF05`: Filtros combinados por `technicianId`, `customerId`, `status` e intervalo `startDate..endDate`.
   * `RNF02 & RNF03`: Resposta estruturada `400 Bad Request` com mapa de `fieldErrors` para validação Bean Validation.
3. **`BlockedDateIntegrationTest` (Testes de Integração de Feriados e Datas Bloqueadas):**
   * `RN08`: Cadastro de bloqueio e listagem REST.
   * `RN08`: Rejeição de bloqueio duplicado para o mesmo dia (`409 Conflict`).
   * `RN08 & RF05`: Rejeição de agendamento em data bloqueada com `400 Bad Request`.
   * `RN08 & RF04`: Consulta de disponibilidade retorna lista vazia em data bloqueada.
   * `RN08`: Bloqueio automático em feriados nacionais brasileiros fixos (ex.: Natal 25/12).
4. **`AppointmentExportIntegrationTest` & `AppointmentCsvWriterTest` (Exportação CSV):**
   * `RF08`: Exportação streaming em formato CSV com UTF-8 BOM (`0xEF, 0xBB, 0xBF`), cabeçalho RFC 4180 e caracteres acentuados.
   * `RF08`: Exportação de cabeçalho quando o filtro não encontra registros.
   * `RF08 & RNF03`: Retorno de `400 Bad Request` padronizado quando `startDate > endDate`.
5. **`CustomerServiceTest`, `TechnicianServiceTest` e `ServiceCatalogServiceTest` (Serviços de Cadastro):**
   * `RF01, RF02 & RF03`: Criação de cliente, técnico e serviço sempre ativos; listagem com e sem registros.
   * `RN01`: Alternância de status (ativar/inativar), busca de cadastro ativo e rejeição de cadastro inativo.
   * `RN02`: Serviço preserva duração e preço informados; descrição opcional.
   * `RNF03`: `ResourceNotFoundException` para ID inexistente na busca e na alternância de status, sem persistir alterações.
6. **`HealthControllerTest`:**
   * `RNF01`: Verificação de integridade do serviço em `/api/v1/health` retornando `200 OK` e status `UP`.

---

## 2. Frontend (React 19, TypeScript & Vitest)

### Comandos de Execução:
```bash
cd frontend
npm run test:coverage
npm run build
```

### Resultados da Suíte Frontend:
```text
 ✓ src/utils/appointmentEligibility.test.ts (7 tests)
 ✓ src/api/client.test.ts (23 tests)
 ✓ src/components/AppointmentCard.test.tsx (7 tests)
 ✓ src/pages/TechniciansPage.test.tsx (7 tests)
 ✓ src/pages/CustomersPage.test.tsx (10 tests)
 ✓ src/pages/ServicesPage.test.tsx (8 tests)
 ✓ src/components/CreateAppointmentModal.test.tsx (8 tests)
 ✓ src/App.test.tsx (10 tests)

 Test Files  8 passed (8)
      Tests  80 passed (80)
   Duration  ~6.05s
```

* **Test Files:** 8 aprovados (100%)
* **Testes Executados:** 80 aprovados (100%)
* **Build de Produção:** Concluído com sucesso via Vite e TypeScript (`tsc -b`).

---

## 3. Cobertura de Código

Relatórios HTML: `backend/target/site/jacoco/index.html` e `frontend/coverage/index.html`.

| Módulo | Linhas | Instruções/Stmts | Branches |
| --- | --- | --- | --- |
| Backend (JaCoCo) | 85,5% | 89,0% | 73,9% |
| Frontend (Vitest/V8) | 91,6% | 88,9% | 87,3% |

Classes críticas do backend (linhas / branches): `AppointmentService` 86,0% / 63,8%; `AppointmentController` 93,8% / 100%; `AppointmentCsvWriter` 87,2% / 59,1%; `BlockedDateService` 71,4% / 57,1%; `GlobalExceptionHandler` 57,7% / 100%; `CustomerService` 100% / 100%; `ServiceCatalogService` 100% / 100%; `TechnicianService` 100% / 100%. No frontend, `client.ts` passou a 100% de linhas e branches (antes 45,7% das linhas), cobrindo mapeamento de erros por status HTTP, falha de rede, corpo não-JSON, download de CSV e leitura do `Content-Disposition` (issue #104).

Limitações conhecidas: `GlobalExceptionHandler` (57,7%) e `BlockedDateService` (71,4%) seguem abaixo da meta de 85% da RNF04 por classe, embora a cobertura total de linhas do backend (85,5%) e do frontend (91,6%) já atinja a meta. Autenticação e perfis de acesso estão fora de escopo na v1.0.0 (SPEC seção 0), portanto não há testes desse tipo.

### Evidências Visuais e Artefatos Capturados:
* **Resumo Geral dos Testes:** [evidencia_resumo_testes.png](evidencia_resumo_testes.png)
* **Relatório JaCoCo (Backend):** [evidencia_jacoco.png](evidencia_jacoco.png)
* **Relatório Vitest (Frontend):** [evidencia_vitest.png](evidencia_vitest.png)
* **Log Completo de Execução:** [logs_testes_final.txt](../logs_testes_final.txt)

## 4. Conclusão da Validação

O Test Harness executa de maneira determinística com 152 testes automatizados em verde, cobrindo todas as regras de negócio especificadas em [docs/SPEC.md](SPEC.md) e proporcionando rastreabilidade direta entre especificação, implementação e testes automatizados.
