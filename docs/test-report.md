# Relatório de Execução do Test Harness - FixTime

**Data da Execução:** 2026-09-03  
**Status Geral:** ✅ **PASS (100% de sucesso)**

---

## 1. Backend (Spring Boot 3.4.5 & Java 21/26)

### Comandos executados:
```bash
cd backend
mvn clean test
```

### Resultados da Suíte:
* **Testes Executados:** 16
* **Falhas (Failures):** 0
* **Erros (Errors):** 0
* **Ignorados (Skipped):** 0
* **Tempo Total de Execução:** ~7.7 segundos
* **Status:** **BUILD SUCCESS**

### Cobertura do Test Harness:
1. **`AppointmentIntegrationTest` (Testes de Integração Ponta a Ponta com H2 e MockMvc):**
   * Cadastro completo de Cliente, Técnico e Serviço via API REST.
   * Criação de agendamento em horário comercial futuro com cálculo automático de `endsAt` a partir da duração do serviço.
   * Validação de bloqueio de conflito/sobreposição (`409 Conflict`) para o mesmo técnico.
   * Permissão de agendamentos adjacentes (sem sobreposição).
   * Cancelamento de agendamento com antecedência de 2 horas.
   * Listagem ordenada de agendamentos.
   * Validação de payload inválido com resposta estruturada (`400 Bad Request` e mapa de `fieldErrors`).
2. **`AppointmentServiceTest` (Testes Unitários com Mocks e `Clock` Fixo):**
   * Criação dentro do horário comercial e cálculo de término.
   * Rejeição por antecedência insuficiente (< 2 horas).
   * Rejeição de agendamento em finais de semana (Sábado/Domingo).
   * Rejeição de agendamento fora da janela de atendimento (08:00 às 18:00).
   * Rejeição de sobreposição para o mesmo técnico.
   * Cancelamento com antecedência válida (`SCHEDULED` -> `CANCELLED`).
   * Rejeição de cancelamento com menos de 2 horas de antecedência.
   * Conclusão com sucesso estritamente após o término da visita (`SCHEDULED` -> `COMPLETED`).
   * Rejeição de conclusão antes do término da visita.
   * Lançamento de `ResourceNotFoundException` para IDs inexistentes.
3. **`CustomerServiceTest` (Testes Unitários do Domínio de Clientes):**
   * Cadastro com persistência ativa.
   * Busca por cliente inexistente (`ResourceNotFoundException`).
   * Validação de cliente inativo.
4. **`HealthControllerTest` (Teste de Contrato Web MVC):**
   * Verificação de saúde da aplicação (`/api/v1/health` -> `200 OK` e status `UP`).

---

## 2. Frontend (React 19, TypeScript & Vitest)

### Comandos executados:
```bash
cd frontend
npm install
npm test -- --run
```

### Resultados:
* **Test Files:** 1 passed (1)
* **Tests:** 1 passed (1)
* **Tempo Total:** ~1.1 segundos
* **Status:** **PASS**

---

## 3. Evidência Resumida do Log de Execução (Backend)

```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.fixtime.AppointmentIntegrationTest
2026-09-03T10:29:31.481-03:00  INFO com.fixtime.AppointmentIntegrationTest : Starting AppointmentIntegrationTest
2026-09-03T10:29:32.787-03:00  INFO com.zaxxer.hikari.pool.HikariPool      : Added connection conn0: url=jdbc:h2:mem:fixtime
2026-09-03T10:29:34.491-03:00  INFO com.fixtime.AppointmentIntegrationTest : Started AppointmentIntegrationTest in 3.239 seconds
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.155 s -- in com.fixtime.AppointmentIntegrationTest
[INFO] Running com.fixtime.AppointmentServiceTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.320 s -- in com.fixtime.AppointmentServiceTest
[INFO] Running com.fixtime.CustomerServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.004 s -- in com.fixtime.CustomerServiceTest
[INFO] Running com.fixtime.HealthControllerTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.171 s -- in com.fixtime.HealthControllerTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```
