# Historico de refinamento

| Data | Alteracao | Motivo |
| --- | --- | --- |
| 2026-09-02 | Dominio definido como assistencia tecnica | Regras de agenda sao objetivas e testaveis para a primeira entrega. |
| 2026-09-02 | Autenticacao removida do MVP | Reduzir escopo e concentrar a primeira sprint em regras de negocio e harness. |
| 2026-09-02 | Intervalos adjacentes permitidos | Evita bloquear a agenda quando uma visita termina exatamente no inicio da proxima. |
| 2026-09-03 | Duracao calculada a partir de `ServiceEntity` (Issue #1) | Garante integridade cadastral e evita divergencia com `durationMinutes` enviado pelo cliente. |
| 2026-09-03 | Padronizacao de erros HTTP com `GlobalExceptionHandler` (Issue #3) | Retorno uniforme de erros JSON com `status`, `error`, `message` e `fieldErrors`. |
| 2026-09-03 | Transicoes de status `CANCELLED` e `COMPLETED` (Issues #12 e #13) | Implementacao dos endpoints `PATCH` com validacao de antecedencia e horario de conclusao. |
| 2026-09-12 | Exportacao CSV de agendamentos (`GET /api/v1/appointments/export`) | Conciliacao operacional e relatorios externos com streaming UTF-8 (BOM) e filtros de periodo, tecnico e status. |
| 2026-10-02 | Autenticacao JWT e perfis ADMIN/ATENDENTE incluidos (RF09, RF10, RN09, RN10; Issues #67 e #68) | Reverte a decisao de 2026-09-02: sistema passa a ter operadores identificados e permissoes por perfil. |
| 2026-10-02 | Pagina inicial, roteamento, agenda semanal e feedback no frontend (RF11 a RF13, RN11; Issues #65, #66, #69, #70) | Frontend so possuia agenda e cadastros sem navegacao; reutiliza endpoints existentes, sem novas rotas de backend. |
| 2026-10-02 | CI, responsividade/acessibilidade e seguranca de credenciais (RNF06 a RNF08; Issues #71 e #72) | Garantir qualidade verificavel e evitar segredos no repositorio. |
