import { useState } from 'react';
import { getAppointmentsExportUrl } from './api/resources';
import { AppointmentCard } from './components/AppointmentCard';
import { CreateAppointmentModal } from './components/CreateAppointmentModal';
import { useAppointmentResources } from './hooks/useAppointmentResources';
import { useAppointments } from './hooks/useAppointments';
import { CustomersPage } from './pages/CustomersPage';
import { ServicesPage } from './pages/ServicesPage';
import { TechniciansPage } from './pages/TechniciansPage';
import { ApiError } from './types';

type ActiveTab = 'agenda' | 'customers' | 'technicians' | 'services';

const getTodayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('agenda');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, status, error, reload, cancel, complete } = useAppointments(
    selectedDate ? { date: selectedDate } : undefined,
  );

  const {
    customersMap,
    techniciansMap,
    servicesMap,
  } = useAppointmentResources(true);

  const handlePreviousDay = () => {
    const base = selectedDate || getTodayISO();
    const current = new Date(`${base}T12:00:00`);
    current.setDate(current.getDate() - 1);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const base = selectedDate || getTodayISO();
    const current = new Date(`${base}T12:00:00`);
    current.setDate(current.getDate() + 1);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleToday = () => {
    setSelectedDate(getTodayISO());
  };

  const handleClearDate = () => {
    setSelectedDate('');
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Todas as datas';
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
        const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(dateObj);
        const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        return `${capitalizedWeekday}, ${day} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(dateObj)}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleCancelAppointment = async (id: number) => {
    setActionError(null);
    try {
      await cancel(id);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(`Erro ao cancelar agendamento #${id}: ${err.message}`);
      } else {
        setActionError(`Falha de comunicação ao cancelar o agendamento #${id}.`);
      }
    }
  };

  const handleCompleteAppointment = async (id: number) => {
    setActionError(null);
    try {
      await complete(id);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(`Erro ao concluir agendamento #${id}: ${err.message}`);
      } else {
        setActionError(`Falha de comunicação ao concluir o agendamento #${id}.`);
      }
    }
  };

  const TAB_LABELS: Record<ActiveTab, string> = {
    agenda: 'Agenda',
    customers: 'Clientes',
    technicians: 'Técnicos',
    services: 'Serviços',
  };

  return (
    <main className="shell">
      {/* Ambient decorative glow */}
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

      {/* Tab Navigation */}
      <nav className="tab-nav" aria-label="Navegação principal">
        {(Object.keys(TAB_LABELS) as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            id={`tab-${tab}`}
            role="tab"
            aria-selected={activeTab === tab}
            className={`tab-btn ${activeTab === tab ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'agenda' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )}
            {tab === 'customers' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            )}
            {tab === 'technicians' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            )}
            {tab === 'services' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            )}
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      {/* ── Agenda Tab ── */}
      {activeTab === 'agenda' && (
        <>
          <section className="workspace">
            <div className="workspace-title-area">
              <div className="section-tag">AGENDA OPERACIONAL</div>
              <h2>Agenda de hoje</h2>
              <p className="muted">{formatDateDisplay(selectedDate)}</p>
            </div>

            <div className="workspace-controls">
              <div className="date-filter-bar" aria-label="Navegação por data">
                <button
                  type="button"
                  onClick={handlePreviousDay}
                  className="btn-date-nav"
                  title="Dia anterior"
                  aria-label="Dia anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className={`btn-date-preset ${selectedDate === getTodayISO() ? 'active' : ''}`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={handleNextDay}
                  className="btn-date-nav"
                  title="Próximo dia"
                  aria-label="Próximo dia"
                >
                  ›
                </button>
                <input
                  type="date"
                  id="filter-date"
                  aria-label="Filtrar data da agenda"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-filter-date"
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={handleClearDate}
                    className="btn-date-clear"
                    title="Ver todas as datas"
                  >
                    Todas
                  </button>
                )}
              </div>

              <a
                href={getAppointmentsExportUrl(
                  selectedDate ? { startDate: selectedDate, endDate: selectedDate } : undefined,
                )}
                className="btn-export-csv"
                download
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar CSV
              </a>

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
            </div>
          </section>

          {actionError && (
            <div className="alert alert-error action-error-alert" role="alert">
              <div className="alert-content">
                <strong>Erro na operação:</strong>
                <p>{actionError}</p>
              </div>
              <button
                type="button"
                className="btn-alert-dismiss"
                onClick={() => setActionError(null)}
                aria-label="Fechar aviso de erro"
              >
                &times;
              </button>
            </div>
          )}

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
              <p>
                {selectedDate
                  ? 'Não há atendimentos agendados para esta data.'
                  : 'Crie o primeiro atendimento para começar a organizar sua operação.'}
              </p>
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
            <section className="appointments-grid" aria-label="Agendamentos">
              {data.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  customer={customersMap.get(appointment.customerId)}
                  technician={techniciansMap.get(appointment.technicianId)}
                  service={servicesMap.get(appointment.serviceId)}
                  onCancel={handleCancelAppointment}
                  onComplete={handleCompleteAppointment}
                />
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
        </>
      )}

      {/* ── Management Tabs ── */}
      {activeTab === 'customers' && <CustomersPage />}
      {activeTab === 'technicians' && <TechniciansPage />}
      {activeTab === 'services' && <ServicesPage />}
    </main>
  );
}
