import { useState } from 'react';
import {
  createTechnician,
  listTechnicians,
  toggleTechnicianActive,
} from '../api/resources';
import { useEntityList } from '../hooks/useEntityList';
import type { ApiError, CreateTechnicianInput, Technician } from '../types';

export function TechniciansPage() {
  const { data, setData, status, error, reload } = useEntityList<Technician>((signal) =>
    listTechnicians({ signal }),
  );

  const [form, setForm] = useState<CreateTechnicianInput>({ name: '', email: '', phone: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nome é obrigatório.';
    if (!form.email.trim()) errors.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'E-mail inválido.';
    if (!form.phone.trim()) errors.phone = 'Telefone é obrigatório.';
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
      const created = await createTechnician(form);
      setData((prev) => [created, ...prev]);
      setForm({ name: '', email: '', phone: '' });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) setFormErrors(apiErr.fieldErrors);
      else setSubmitError(apiErr.message || 'Erro ao cadastrar técnico.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    setTogglingId(id);
    try {
      const updated = await toggleTechnicianActive(id);
      setData((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      reload();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <div className="entity-page-title">
          <div className="section-tag">GESTÃO</div>
          <h2>Técnicos</h2>
          <p className="muted">Cadastre e gerencie os técnicos disponíveis para atendimento.</p>
        </div>
      </div>

      <form className="entity-form" onSubmit={handleSubmit} noValidate aria-label="Formulário de novo técnico">
        <div className="entity-form-title">Novo Técnico</div>
        {submitError && (
          <div className="form-submit-error" role="alert">{submitError}</div>
        )}
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="tech-name">Nome</label>
            <input
              id="tech-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome completo"
              className={formErrors.name ? 'input-error' : ''}
              aria-describedby={formErrors.name ? 'tech-name-error' : undefined}
            />
            {formErrors.name && <span id="tech-name-error" className="field-error">{formErrors.name}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="tech-email">E-mail</label>
            <input
              id="tech-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@exemplo.com"
              className={formErrors.email ? 'input-error' : ''}
              aria-describedby={formErrors.email ? 'tech-email-error' : undefined}
            />
            {formErrors.email && <span id="tech-email-error" className="field-error">{formErrors.email}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="tech-phone">Telefone</label>
            <input
              id="tech-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
              className={formErrors.phone ? 'input-error' : ''}
              aria-describedby={formErrors.phone ? 'tech-phone-error' : undefined}
            />
            {formErrors.phone && <span id="tech-phone-error" className="field-error">{formErrors.phone}</span>}
          </div>
          <button type="submit" className="btn-form-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>
      </form>

      {status === 'loading' && (
        <div className="entity-loading" aria-live="polite">
          <div className="spinner" />
          <p>Carregando técnicos...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="entity-error" role="alert">
          <p>Erro ao carregar técnicos: {error?.message}</p>
          <button type="button" className="btn-retry" onClick={reload}>Tentar novamente</button>
        </div>
      )}

      {status === 'success' && data.length === 0 && (
        <div className="entity-empty">
          <span className="mark">+</span>
          <p>Nenhum técnico cadastrado. Use o formulário acima para começar.</p>
        </div>
      )}

      {status === 'success' && data.length > 0 && (
        <div className="entity-grid" aria-label="Lista de técnicos">
          {data.map((technician) => (
            <div key={technician.id} className={`entity-card ${technician.active ? '' : 'entity-card--inactive'}`}>
              <div className="entity-card-header">
                <span className={`status-badge ${technician.active ? 'badge-active' : 'badge-inactive'}`}>
                  {technician.active ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  type="button"
                  className={`btn-toggle-status ${technician.active ? 'btn-toggle-deactivate' : 'btn-toggle-activate'}`}
                  onClick={() => handleToggle(technician.id)}
                  disabled={togglingId === technician.id}
                  aria-label={technician.active ? `Desativar ${technician.name}` : `Ativar ${technician.name}`}
                >
                  {togglingId === technician.id ? '...' : technician.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
              <div className="entity-card-body">
                <strong className="entity-card-name">{technician.name}</strong>
                <span className="entity-card-detail">{technician.email}</span>
                <span className="entity-card-detail">{technician.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
