import { useState } from 'react';
import { CreateAppointmentModal } from './components/CreateAppointmentModal';
import { useAppointments } from './hooks/useAppointments';

export function App() {
  const { data, status, error, reload } = useAppointments();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDateTime = (isoString: string) => {
    try {
      const dateObj = new Date(isoString);
      if (isNaN(dateObj.getTime())) {
        return isoString.replace('T', ' ');
      }
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch {
      return isoString.replace('T', ' ');
    }
  };

  const getStatusLabel = (apptStatus: string) => {
    switch (apptStatus) {
      case 'SCHEDULED':
        return 'Agendado';
      case 'COMPLETED':
        return 'Concluído';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return apptStatus;
    }
  };

  return (
    <main className="shell">
      {/* Background ambient decorative shapes */}
      <div className="ambient-glow glow-1" aria-hidden="true" />
      <div className="ambient-glow glow-2" aria-hidden="true" />

      <header className="topbar">
        <div className="brand-group">
          <div className="brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <strong>FixTime</strong>
            <span className="brand-tag">PRO</span>
          </div>
        </div>
        <div className="topbar-meta">
          <span className="live-indicator">
            <span className="pulse-dot"></span>
            Operação de visitas
          </span>
        </div>
      </header>

      <section className="intro">
        <div className="intro-badge">
          <span className="sparkle">✦</span>
          <p className="eyebrow">ASSISTÊNCIA TÉCNICA INTELIGENTE</p>
        </div>
        <h1>Agenda sem atrito.</h1>
        <p className="intro-description">
          Organize técnicos, serviços e visitas em um único lugar com alocação inteligente de horários.
        </p>

        {/* Quick metrics banner */}
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Visitas na Agenda</span>
            <strong className="metric-value">{status === 'success' ? data.length : '—'}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Disponibilidade</span>
            <strong className="metric-value">08:00 - 18:00</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Status da Operação</span>
            <strong className="metric-value text-accent">Ativa e Monitorada</strong>
          </div>
        </div>
      </section>

      <section className="workspace">
        <div className="workspace-title-area">
          <div className="section-tag">VISITAS AGENDADAS</div>
          <h2>Agenda de hoje</h2>
          <p className="muted">Quarta-feira, 02 de setembro</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-create-appointment"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo agendamento
        </button>
      </section>

      {status === 'loading' && (
        <section className="empty" aria-live="polite">
          <div className="spinner"></div>
          <p>Carregando agendamentos...</p>
        </section>
      )}

      {status === 'error' && (
        <section className="empty error" role="alert">
          <div className="error-icon-box">!</div>
          <h2>Não foi possível carregar a agenda</h2>
          <p>{error?.message}</p>
        </section>
      )}

      {status === 'success' && data.length === 0 && (
        <section className="empty">
          <span className="mark">+</span>
          <h2>Nenhuma visita agendada</h2>
          <p>Crie o primeiro atendimento para começar a organizar sua operação.</p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-empty-cta"
          >
            Agendar primeira visita
          </button>
        </section>
      )}

      {status === 'success' && data.length > 0 && (
        <section className="appointments" aria-label="Agendamentos">
          {data.map((appointment) => (
            <article className="appointment" key={appointment.id}>
              <div className="appointment-time-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <strong>{appointment.startsAt.replace('T', ' ')}</strong>
                <span className="time-formatted">{formatDateTime(appointment.startsAt)}</span>
              </div>

              <div className="appointment-info">
                <span className="appointment-id">Agendamento #{appointment.id}</span>
                <div className="appointment-meta">
                  <span>Cliente #{appointment.customerId}</span>
                  <span>•</span>
                  <span>Técnico #{appointment.technicianId}</span>
                  <span>•</span>
                  <span>Serviço #{appointment.serviceId}</span>
                </div>
              </div>

              <div className="appointment-status-col">
                <small className={`status-pill status-${appointment.status.toLowerCase()}`}>
                  <span className="status-dot"></span>
                  {appointment.status}
                </small>
                <span className="status-subtext">{getStatusLabel(appointment.status)}</span>
              </div>
            </article>
          ))}
        </section>
      )}

      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          reload();
        }}
      />
    </main>
  );
}
