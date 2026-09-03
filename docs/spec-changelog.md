# Historico de refinamento

| Data | Alteracao | Motivo |
| --- | --- | --- |
| 2026-09-02 | Dominio definido como assistencia tecnica | Regras de agenda sao objetivas e testaveis para a primeira entrega. |
| 2026-09-02 | Autenticacao removida do MVP | Reduzir escopo e concentrar a primeira sprint em regras de negocio e harness. |
| 2026-09-02 | Intervalos adjacentes permitidos | Evita bloquear a agenda quando uma visita termina exatamente no inicio da proxima. |
| 2026-09-03 | Duracao calculada a partir de `ServiceEntity` (Issue #1) | Garante integridade cadastral e evita divergencia com `durationMinutes` enviado pelo cliente. |
| 2026-09-03 | Padronizacao de erros HTTP com `GlobalExceptionHandler` (Issue #3) | Retorno uniforme de erros JSON com `status`, `error`, `message` e `fieldErrors`. |
| 2026-09-03 | Transicoes de status `CANCELLED` e `COMPLETED` (Issues #12 e #13) | Implementacao dos endpoints `PATCH` com validacao de antecedencia e horario de conclusao. |
