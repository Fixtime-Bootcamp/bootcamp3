import { useState } from 'react';
import {
  createService,
  listServices,
  toggleServiceActive,
} from '../api/resources';
import { useEntityList } from '../hooks/useEntityList';
import type { ApiError, CreateServiceInput, Service } from '../types';

export function ServicesPage() {
  const { data, setData, status, error, reload } = useEntityList<Service>((signal) =>
    listServices({ signal }),
  );

  const [form, setForm] = useState<CreateServiceInput>({
    name: '',
    description: '',
    durationMinutes: 0,
    price: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nome é obrigatório.';
    if (!form.durationMinutes || form.durationMinutes <= 0)
      errors.durationMinutes = 'Duração deve ser maior que zero.';
    if (form.price < 0) errors.price = 'Preço não pode ser negativo.';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const created = await createService({
        ...form,
        description: form.description?.trim() || undefined,
      });
      setData((prev) => [created, ...prev]);
      setForm({ name: '', description: '', durationMinutes: 0, price: 0 });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) setFormErrors(apiErr.fieldErrors);
      else setSubmitError(apiErr.message || 'Erro ao cadastrar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    setTogglingId(id);
    try {
      const updated = await toggleServiceActive(id);
      setData((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      reload();
    } finally {
      setTogglingId(null);
    }
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <div className="entity-page-title">
          <div className="section-tag">GESTÃO</div>
          <h2>Serviços</h2>
          <p className="muted">Cadastre e gerencie os serviços disponíveis para agendamento.</p>
        </div>
      </div>

      <form className="entity-form" onSubmit={handleSubmit} noValidate aria-label="Formulário de novo serviço">
        <div className="entity-form-title">Novo Serviço</div>
        {submitError && (
          <div className="form-submit-error" role="alert">{submitError}</div>
        )}
        <div className="form-row">
          <div className="form-field form-field--wide">
            <label htmlFor="service-name">Nome do Serviço</label>
            <input
              id="service-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Troca de compressor"
              className={formErrors.name ? 'input-error' : ''}
              aria-describedby={formErrors.name ? 'service-name-error' : undefined}
            />
            {formErrors.name && <span id="service-name-error" className="field-error">{formErrors.name}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="service-duration">Duração (min)</label>
            <input
              id="service-duration"
              type="number"
              min={1}
              value={form.durationMinutes || ''}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
              placeholder="60"
              className={formErrors.durationMinutes ? 'input-error' : ''}
              aria-describedby={formErrors.durationMinutes ? 'service-duration-error' : undefined}
            />
            {formErrors.durationMinutes && <span id="service-duration-error" className="field-error">{formErrors.durationMinutes}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="service-price">Preço (R$)</label>
            <input
              id="service-price"
              type="number"
              min={0}
              step={0.01}
              value={form.price || ''}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              placeholder="0,00"
              className={formErrors.price ? 'input-error' : ''}
              aria-describedby={formErrors.price ? 'service-price-error' : undefined}
            />
            {formErrors.price && <span id="service-price-error" className="field-error">{formErrors.price}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-field form-field--wide">
            <label htmlFor="service-description">Descrição (opcional)</label>
            <input
              id="service-description"
              type="text"
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descrição breve do serviço"
            />
          </div>
          <button type="submit" className="btn-form-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>
      </form>

      {status === 'loading' && (
        <div className="entity-loading" aria-live="polite">
          <div className="spinner" />
          <p>Carregando serviços...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="entity-error" role="alert">
          <p>Erro ao carregar serviços: {error?.message}</p>
          <button type="button" className="btn-retry" onClick={reload}>Tentar novamente</button>
        </div>
      )}

      {status === 'success' && data.length === 0 && (
        <div className="entity-empty">
          <span className="mark">+</span>
          <p>Nenhum serviço cadastrado. Use o formulário acima para começar.</p>
        </div>
      )}

      {status === 'success' && data.length > 0 && (
        <div className="entity-grid" aria-label="Lista de serviços">
          {data.map((service) => (
            <div key={service.id} className={`entity-card ${service.active ? '' : 'entity-card--inactive'}`}>
              <div className="entity-card-header">
                <span className={`status-badge ${service.active ? 'badge-active' : 'badge-inactive'}`}>
                  {service.active ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  type="button"
                  className={`btn-toggle-status ${service.active ? 'btn-toggle-deactivate' : 'btn-toggle-activate'}`}
                  onClick={() => handleToggle(service.id)}
                  disabled={togglingId === service.id}
                  aria-label={service.active ? `Desativar ${service.name}` : `Ativar ${service.name}`}
                >
                  {togglingId === service.id ? '...' : service.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
              <div className="entity-card-body">
                <strong className="entity-card-name">{service.name}</strong>
                {service.description && (
                  <span className="entity-card-detail">{service.description}</span>
                )}
                <div className="entity-card-meta">
                  <span className="entity-card-chip">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {service.durationMinutes} min
                  </span>
                  <span className="entity-card-chip entity-card-chip--price">
                    {formatPrice(service.price)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
