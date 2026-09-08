import { useState } from 'react';
import {
  createCustomer,
  listCustomers,
  toggleCustomerActive,
} from '../api/resources';
import { useEntityList } from '../hooks/useEntityList';
import type { ApiError, CreateCustomerInput, Customer } from '../types';

export function CustomersPage() {
  const { data, setData, status, error, reload } = useEntityList<Customer>((signal) =>
    listCustomers({ signal }),
  );

  const [form, setForm] = useState<CreateCustomerInput>({ name: '', email: '', phone: '' });
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
      const created = await createCustomer(form);
      setData((prev) => [created, ...prev]);
      setForm({ name: '', email: '', phone: '' });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) setFormErrors(apiErr.fieldErrors);
      else setSubmitError(apiErr.message || 'Erro ao cadastrar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    setTogglingId(id);
    try {
      const updated = await toggleCustomerActive(id);
      setData((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
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
          <h2>Clientes</h2>
          <p className="muted">Cadastre e gerencie os clientes da operação.</p>
        </div>
      </div>

      {/* Formulário de cadastro */}
      <form className="entity-form" onSubmit={handleSubmit} noValidate aria-label="Formulário de novo cliente">
        <div className="entity-form-title">Novo Cliente</div>
        {submitError && (
          <div className="form-submit-error" role="alert">{submitError}</div>
        )}
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="customer-name">Nome</label>
            <input
              id="customer-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome completo"
              className={formErrors.name ? 'input-error' : ''}
              aria-describedby={formErrors.name ? 'customer-name-error' : undefined}
            />
            {formErrors.name && <span id="customer-name-error" className="field-error">{formErrors.name}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="customer-email">E-mail</label>
            <input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@exemplo.com"
              className={formErrors.email ? 'input-error' : ''}
              aria-describedby={formErrors.email ? 'customer-email-error' : undefined}
            />
            {formErrors.email && <span id="customer-email-error" className="field-error">{formErrors.email}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="customer-phone">Telefone</label>
            <input
              id="customer-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
              className={formErrors.phone ? 'input-error' : ''}
              aria-describedby={formErrors.phone ? 'customer-phone-error' : undefined}
            />
            {formErrors.phone && <span id="customer-phone-error" className="field-error">{formErrors.phone}</span>}
          </div>
          <button type="submit" className="btn-form-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>
      </form>

      {/* Listagem */}
      {status === 'loading' && (
        <div className="entity-loading" aria-live="polite">
          <div className="spinner" />
          <p>Carregando clientes...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="entity-error" role="alert">
          <p>Erro ao carregar clientes: {error?.message}</p>
          <button type="button" className="btn-retry" onClick={reload}>Tentar novamente</button>
        </div>
      )}

      {status === 'success' && data.length === 0 && (
        <div className="entity-empty">
          <span className="mark">+</span>
          <p>Nenhum cliente cadastrado. Use o formulário acima para começar.</p>
        </div>
      )}

      {status === 'success' && data.length > 0 && (
        <div className="entity-grid" aria-label="Lista de clientes">
          {data.map((customer) => (
            <div key={customer.id} className={`entity-card ${customer.active ? '' : 'entity-card--inactive'}`}>
              <div className="entity-card-header">
                <span className={`status-badge ${customer.active ? 'badge-active' : 'badge-inactive'}`}>
                  {customer.active ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  type="button"
                  className={`btn-toggle-status ${customer.active ? 'btn-toggle-deactivate' : 'btn-toggle-activate'}`}
                  onClick={() => handleToggle(customer.id)}
                  disabled={togglingId === customer.id}
                  aria-label={customer.active ? `Desativar ${customer.name}` : `Ativar ${customer.name}`}
                >
                  {togglingId === customer.id ? '...' : customer.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
              <div className="entity-card-body">
                <strong className="entity-card-name">{customer.name}</strong>
                <span className="entity-card-detail">{customer.email}</span>
                <span className="entity-card-detail">{customer.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
