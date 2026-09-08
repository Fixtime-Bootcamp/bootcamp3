import { useState } from 'react';
import type { Appointment, Customer, Service, Technician } from '../types';
import {
  getCancelTooltip,
  getCompleteTooltip,
  isCancelEligible,
  isCompleteEligible,
} from '../utils/appointmentEligibility';

export type AppointmentCardProps = {
  appointment: Appointment;
  customer?: Customer;
  technician?: Technician;
  service?: Service;
  now?: Date;
  onCancel: (id: number) => Promise<void>;
  onComplete: (id: number) => Promise<void>;
};

export function AppointmentCard({
  appointment,
  customer,
  technician,
  service,
  now = new Date(),
  onCancel,
  onComplete,
}: AppointmentCardProps) {
  const [actionLoading, setActionLoading] = useState<'cancel' | 'complete' | null>(null);

  const canCancel = isCancelEligible(appointment, now);
  const canComplete = isCompleteEligible(appointment, now);

  const cancelTooltip = getCancelTooltip(appointment, now);
  const completeTooltip = getCompleteTooltip(appointment, now);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const parts = isoString.split('T');
    if (parts.length > 1) {
      return parts[1].slice(0, 5);
    }
    return isoString.slice(0, 5);
  };

  const formatDate = (isoString: string) => {
    try {
      const datePart = isoString.split('T')[0];
      const [year, month, day] = datePart.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return datePart;
    } catch {
      return isoString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Agendado', className: 'status-scheduled' };
      case 'COMPLETED':
        return { label: 'Concluído', className: 'status-completed' };
      case 'CANCELLED':
        return { label: 'Cancelado', className: 'status-cancelled' };
      default:
        return { label: status, className: 'status-default' };
    }
  };

  const handleCancelClick = async () => {
    if (!canCancel || actionLoading) return;
    setActionLoading('cancel');
    try {
      await onCancel(appointment.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteClick = async () => {
    if (!canComplete || actionLoading) return;
    setActionLoading('complete');
    try {
      await onComplete(appointment.id);
    } finally {
      setActionLoading(null);
    }
  };

  const statusInfo = getStatusDisplay(appointment.status);

  return (
    <article className="appointment-card" data-testid={`appointment-${appointment.id}`}>
      <div className="card-header">
        <div className="card-time-slot">
          <div className="time-range">
            <strong>{formatTime(appointment.startsAt)}</strong>
            <span className="time-separator">às</span>
            <strong>{formatTime(appointment.endsAt)}</strong>
          </div>
          <span className="date-tag">{formatDate(appointment.startsAt)}</span>
        </div>

        <div className="card-status-box">
          <span className={`status-pill ${statusInfo.className}`}>
            <span className="status-dot"></span>
            {appointment.status}
          </span>
          <span className="status-subtitle">{statusInfo.label}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="info-label">Cliente:</span>
          <strong className="info-value">{customer ? customer.name : `Cliente #${appointment.customerId}`}</strong>
          {customer?.phone && <span className="info-phone">({customer.phone})</span>}
        </div>

        <div className="info-row">
          <span className="info-label">Técnico:</span>
          <span className="info-value technician-value">
            {technician ? technician.name : `Técnico #${appointment.technicianId}`}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Serviço:</span>
          <span className="info-value">
            {service ? service.name : `Serviço #${appointment.serviceId}`}
          </span>
          {service && (
            <span className="service-badge">
              {service.durationMinutes} min • {formatPrice(service.price)}
            </span>
          )}
        </div>
      </div>

      <div className="card-footer">
        <span className="appointment-ref">ID #{appointment.id}</span>

        <div className="card-actions">
          {appointment.status === 'SCHEDULED' && (
            <>
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={!canCancel || !!actionLoading}
                title={cancelTooltip}
                className="btn-action btn-action-cancel"
                aria-label={`Cancelar agendamento #${appointment.id}`}
              >
                {actionLoading === 'cancel' ? (
                  'Cancelando...'
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Cancelar
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCompleteClick}
                disabled={!canComplete || !!actionLoading}
                title={completeTooltip}
                className="btn-action btn-action-complete"
                aria-label={`Concluir agendamento #${appointment.id}`}
              >
                {actionLoading === 'complete' ? (
                  'Concluindo...'
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Concluir
                  </>
                )}
              </button>
            </>
          )}

          {appointment.status === 'COMPLETED' && (
            <span className="finalized-label finalized-completed">
              ✓ Visita Concluída
            </span>
          )}

          {appointment.status === 'CANCELLED' && (
            <span className="finalized-label finalized-cancelled">
              ✕ Visita Cancelada
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
