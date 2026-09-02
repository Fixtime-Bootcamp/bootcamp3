# Especificacao tecnica: FixTime

## Problema

Assistencias tecnicas pequenas controlam visitas por telefone e planilhas, causando conflitos de agenda, perda de historico e pouca visibilidade para clientes.

## Personas

- Cliente: solicita um servico e acompanha sua visita.
- Tecnico: possui uma jornada de trabalho e executa visitas.
- Operador: cadastra servicos e gerencia agendamentos.

## Requisitos funcionais

- RF01: cadastrar e listar clientes.
- RF02: cadastrar e listar tecnicos.
- RF03: cadastrar e listar servicos.
- RF04: consultar disponibilidade de tecnico por data.
- RF05: criar e listar agendamentos.
- RF06: cancelar um agendamento elegivel.
- RF07: concluir um agendamento apos seu horario final.

## Requisitos nao funcionais

- RNF01: API REST JSON versionada em `/api/v1`.
- RNF02: erros de validacao retornam status e mensagem consistentes.
- RNF03: regras de negocio devem ser cobertas por testes automatizados.
- RNF04: ambiente local deve ser reproduzivel com Docker Compose.
- RNF05: CI deve executar testes do backend e frontend.

## Regras de negocio

1. Cliente, tecnico e servico precisam existir e estar ativos.
2. Duracao e positiva e preco nao e negativo.
3. A visita deve iniciar com pelo menos duas horas de antecedencia.
4. A visita ocorre em dia util, entre 08:00 e 18:00, e termina no mesmo dia.
5. Agendamentos do mesmo tecnico nao podem se sobrepor. Intervalos adjacentes sao permitidos.
6. Cancelamento so ocorre em `SCHEDULED` e com duas horas de antecedencia.
7. Conclusao so ocorre em `SCHEDULED` e depois do fim da visita.

## Contrato de criacao de agendamento

`POST /api/v1/appointments`

```json
{
  "customerId": 1,
  "technicianId": 2,
  "serviceId": 3,
  "startsAt": "2026-09-03T10:00:00"
}
```

Resposta `201 Created`:

```json
{
  "id": 10,
  "customerId": 1,
  "technicianId": 2,
  "serviceId": 3,
  "startsAt": "2026-09-03T10:00:00",
  "endsAt": "2026-09-03T11:30:00",
  "status": "SCHEDULED"
}
```

## Componentes

- `AppointmentService`: orquestra criacao e transicoes.
- `AppointmentRepository`: consulta conflitos e persistencia.
- `AppointmentController`: contrato HTTP.
- `GlobalExceptionHandler`: erros previsiveis.
- Frontend: cliente HTTP, formularios e agenda operacional.

## Fora de escopo

Autenticacao, pagamentos, notificacoes, mapas, calendario externo e aplicativo mobile.
