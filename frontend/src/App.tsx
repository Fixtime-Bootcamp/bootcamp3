import { useAppointments } from './hooks/useAppointments';

export function App() {
  const { data, status, error } = useAppointments();

  return (
    <main className="shell">
      <header className="topbar"><strong>FixTime</strong><span>Operação de visitas</span></header>
      <section className="intro"><p className="eyebrow">ASSISTÊNCIA TÉCNICA</p><h1>Agenda sem atrito.</h1><p>Organize técnicos, serviços e visitas em um único lugar.</p></section>
      <section className="workspace">
        <div><h2>Agenda de hoje</h2><p className="muted">Quarta-feira, 02 de setembro</p></div>
        <button type="button">+ Novo agendamento</button>
      </section>
      {status === 'loading' && <section className="empty" aria-live="polite"><p>Carregando agendamentos...</p></section>}
      {status === 'error' && <section className="empty error" role="alert"><h2>Não foi possível carregar a agenda</h2><p>{error?.message}</p></section>}
      {status === 'success' && data.length === 0 && <section className="empty"><span className="mark">+</span><h2>Nenhuma visita agendada</h2><p>Crie o primeiro atendimento para começar a organizar sua operação.</p></section>}
      {status === 'success' && data.length > 0 && <section className="appointments" aria-label="Agendamentos">
        {data.map((appointment) => <article className="appointment" key={appointment.id}>
          <strong>{appointment.startsAt.replace('T', ' ')}</strong>
          <span>Agendamento #{appointment.id}</span>
          <small>{appointment.status}</small>
        </article>)}
      </section>}
    </main>
  );
}
