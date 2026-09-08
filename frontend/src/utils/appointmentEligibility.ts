import type { Appointment } from '../types';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Regra #6 da Especificação FixTime:
 * Cancelamento só ocorre em status SCHEDULED e com pelo menos duas horas de antecedência ao início da visita.
 */
export function isCancelEligible(appointment: Appointment, now: Date = new Date()): boolean {
  if (appointment.status !== 'SCHEDULED') return false;

  const startsAtDate = new Date(appointment.startsAt);
  if (isNaN(startsAtDate.getTime())) return false;

  return startsAtDate.getTime() - now.getTime() >= TWO_HOURS_MS;
}

/**
 * Regra #7 da Especificação FixTime:
 * Conclusão só ocorre em status SCHEDULED e após o encerramento do horário final da visita.
 */
export function isCompleteEligible(appointment: Appointment, now: Date = new Date()): boolean {
  if (appointment.status !== 'SCHEDULED') return false;

  const endsAtDate = new Date(appointment.endsAt);
  if (isNaN(endsAtDate.getTime())) return false;

  return now.getTime() >= endsAtDate.getTime();
}

/**
 * Retorna o motivo pelo qual a ação de cancelamento está desabilitada.
 */
export function getCancelTooltip(appointment: Appointment, now: Date = new Date()): string {
  if (appointment.status === 'CANCELLED') return 'Agendamento já cancelado.';
  if (appointment.status === 'COMPLETED') return 'Agendamento já concluído e não pode ser cancelado.';
  if (!isCancelEligible(appointment, now)) {
    return 'Cancelamento permitido apenas com no mínimo 2 horas de antecedência.';
  }
  return 'Cancelar agendamento';
}

/**
 * Retorna o motivo pelo qual a ação de conclusão está desabilitada.
 */
export function getCompleteTooltip(appointment: Appointment, now: Date = new Date()): string {
  if (appointment.status === 'COMPLETED') return 'Agendamento já concluído.';
  if (appointment.status === 'CANCELLED') return 'Agendamento cancelado não pode ser concluído.';
  if (!isCompleteEligible(appointment, now)) {
    return 'Conclusão permitida somente após o término do horário da visita.';
  }
  return 'Concluir agendamento';
}
