import React, { useEffect, useState } from 'react';
import { createAppointment, getTechnicianAvailability } from '../api/resources';
import { useAppointmentResources } from '../hooks/useAppointmentResources';
import { ApiError, type Appointment, type AvailabilitySlot } from '../types';

export type CreateAppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
};

export function CreateAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAppointmentModalProps) {
  const {
    customers,
    technicians,
    services,
    status: resourcesStatus,
    error: resourcesError,
  } = useAppointmentResources(isOpen);

  const [customerId, setCustomerId] = useState<string>('');
  const [technicianId, setTechnicianId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');

  const [availability, setAvailability] = useState<AvailabilitySlot[] | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const selectedService = services.find((s) => s.id === Number(serviceId));

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerId('');
      setTechnicianId('');
      setServiceId('');
      setDate('');
      setTime('');
      setAvailability(null);
      setAvailabilityStatus('idle');
      setAvailabilityError(null);
      setClientErrors({});
      setApiError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Load availability when technician and date change
  useEffect(() => {
    if (!technicianId || !date) {
      setAvailability(null);
      setAvailabilityStatus('idle');
      setAvailabilityError(null);
      return;
    }

    const controller = new AbortController();
    setAvailabilityStatus('loading');
    setAvailabilityError(null);

    getTechnicianAvailability(Number(technicianId), date, { signal: controller.signal })
      .then((slots) => {
        if (Array.isArray(slots)) {
          setAvailability(slots);
        } else {
          setAvailability([]);
        }
        setAvailabilityStatus('success');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setAvailabilityStatus('error');
        setAvailabilityError('Não foi possível carregar a disponibilidade do técnico.');
      });

    return () => controller.abort();
  }, [technicianId, date]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerId) errors.customerId = 'Selecione um cliente.';
    if (!technicianId) errors.technicianId = 'Selecione um técnico.';
    if (!serviceId) errors.serviceId = 'Selecione um serviço.';
    if (!date) errors.date = 'Informe a data da visita.';
    if (!time) {
      errors.time = 'Informe o horário de início.';
    } else {
      // Validate format HH:mm
      const [hours, minutes] = time.split(':').map(Number);
      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 8 ||
        hours > 18 ||
        (hours === 18 && minutes > 0)
      ) {
        errors.time = 'O horário de início deve estar entre 08:00 e 18:00.';
      }
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    // Form startsAt as YYYY-MM-DDTHH:mm:ss
    const startsAt = `${date}T${time.length === 5 ? `${time}:00` : time}`;

    setSubmitting(true);
    try {
      const created = await createAppointment({
        customerId: Number(customerId),
        technicianId: Number(technicianId),
        serviceId: Number(serviceId),
        startsAt,
        durationMinutes: selectedService?.durationMinutes,
      });

      onSuccess(created);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApiError(err);
      } else {
        setApiError(
          new ApiError('UNKNOWN_ERROR', 'Ocorreu um erro ao salvar o agendamento.'),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatTimeSlot = (isoString?: string) => {
    if (!isoString || typeof isoString !== 'string') return '';
    const parts = isoString.split('T');
    if (parts.length > 1) {
      return parts[1].slice(0, 5);
    }
    return isoString.slice(0, 5);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">NOVO AGENDAMENTO</span>
            <h2 id="modal-title">Agendar Visita Técnica</h2>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </header>

        {resourcesStatus === 'loading' && (
          <div className="modal-loading" aria-live="polite">
            <p>Carregando dados necessários...</p>
          </div>
        )}

        {resourcesStatus === 'error' && (
          <div className="alert alert-error" role="alert">
            <strong>Erro ao carregar dados:</strong>
            <p>{resourcesError?.message}</p>
          </div>
        )}

        {resourcesStatus === 'success' && (
          <form onSubmit={handleSubmit} className="appointment-form" noValidate>
            {customers.length === 0 || technicians.length === 0 || services.length === 0 ? (
              <div className="alert alert-warning" role="note">
                <strong>Banco de dados inicializado sem registros:</strong>
                <p>
                  Para criar um agendamento, é necessário ter pelo menos um cliente, técnico e serviço cadastrados no sistema.
                </p>
              </div>
            ) : null}

            {apiError && (
              <div
                className={`alert ${apiError.code === 'CONFLICT' ? 'alert-warning' : 'alert-error'}`}
                role="alert"
              >
                <strong>
                  {apiError.code === 'CONFLICT'
                    ? 'Conflito de agendamento:'
                    : 'Erro ao criar agendamento:'}
                </strong>
                <p>{apiError.message}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="customer-select">Cliente *</label>
              <select
                id="customer-select"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setClientErrors((prev) => ({ ...prev, customerId: '' }));
                }}
                className={clientErrors.customerId || apiError?.fieldErrors?.customerId ? 'input-error' : ''}
              >
                <option value="">
                  {customers.length === 0 ? 'Nenhum cliente cadastrado no sistema' : 'Selecione um cliente'}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.active ? '' : '(Inativo)'}
                  </option>
                ))}
              </select>
              {(clientErrors.customerId || apiError?.fieldErrors?.customerId) && (
                <span className="field-error">
                  {clientErrors.customerId || apiError?.fieldErrors?.customerId}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="technician-select">Técnico *</label>
              <select
                id="technician-select"
                value={technicianId}
                onChange={(e) => {
                  setTechnicianId(e.target.value);
                  setClientErrors((prev) => ({ ...prev, technicianId: '' }));
                }}
                className={clientErrors.technicianId || apiError?.fieldErrors?.technicianId ? 'input-error' : ''}
              >
                <option value="">
                  {technicians.length === 0 ? 'Nenhum técnico cadastrado no sistema' : 'Selecione um técnico'}
                </option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.active ? '' : '(Inativo)'}
                  </option>
                ))}
              </select>
              {(clientErrors.technicianId || apiError?.fieldErrors?.technicianId) && (
                <span className="field-error">
                  {clientErrors.technicianId || apiError?.fieldErrors?.technicianId}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="service-select">Serviço *</label>
              <select
                id="service-select"
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setClientErrors((prev) => ({ ...prev, serviceId: '' }));
                }}
                className={clientErrors.serviceId || apiError?.fieldErrors?.serviceId ? 'input-error' : ''}
              >
                <option value="">
                  {services.length === 0 ? 'Nenhum serviço cadastrado no sistema' : 'Selecione um serviço'}
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} min - {formatPrice(s.price)})
                  </option>
                ))}
              </select>
              {(clientErrors.serviceId || apiError?.fieldErrors?.serviceId) && (
                <span className="field-error">
                  {clientErrors.serviceId || apiError?.fieldErrors?.serviceId}
                </span>
              )}
            </div>

            {selectedService && (
              <div className="service-details-card" aria-label="Detalhes do serviço selecionado">
                <div className="service-detail-item">
                  <span className="detail-label">Duração estimada</span>
                  <strong className="detail-value">{selectedService.durationMinutes} minutos</strong>
                </div>
                <div className="service-detail-item">
                  <span className="detail-label">Preço do serviço</span>
                  <strong className="detail-value">{formatPrice(selectedService.price)}</strong>
                </div>
                {selectedService.description && (
                  <p className="service-description">{selectedService.description}</p>
                )}
              </div>
            )}

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="appointment-date">Data da visita *</label>
                <input
                  type="date"
                  id="appointment-date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setClientErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  className={clientErrors.date || apiError?.fieldErrors?.date ? 'input-error' : ''}
                />
                {(clientErrors.date || apiError?.fieldErrors?.date) && (
                  <span className="field-error">
                    {clientErrors.date || apiError?.fieldErrors?.date}
                  </span>
                )}
              </div>

              <div className="form-group flex-1">
                <label htmlFor="appointment-time">Horário de início *</label>
                <input
                  type="time"
                  id="appointment-time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setClientErrors((prev) => ({ ...prev, time: '' }));
                  }}
                  className={clientErrors.time || apiError?.fieldErrors?.startsAt ? 'input-error' : ''}
                />
                {(clientErrors.time || apiError?.fieldErrors?.startsAt) && (
                  <span className="field-error">
                    {clientErrors.time || apiError?.fieldErrors?.startsAt}
                  </span>
                )}
              </div>
            </div>

            {technicianId && date && (
              <div className="availability-section" aria-label="Disponibilidade do técnico">
                <div className="availability-header">
                  <strong>Horários livres do técnico nesta data:</strong>
                  {availabilityStatus === 'loading' && <span className="availability-status">Consultando...</span>}
                </div>

                {availabilityStatus === 'error' && (
                  <p className="availability-error">{availabilityError}</p>
                )}

                {availabilityStatus === 'success' && (
                  <>
                    {availability && availability.length > 0 ? (
                      <div className="availability-slots">
                        {availability.map((slot, index) => (
                          <span
                            key={index}
                            className="availability-badge"
                            title="Intervalo disponível"
                          >
                            {formatTimeSlot(slot.startsAt)} às {formatTimeSlot(slot.endsAt)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="availability-empty">
                        Nenhum horário livre encontrado nesta data para este técnico.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
