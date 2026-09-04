import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="shell">
      <header className="topbar"><strong>FixTime</strong><span>Operacao de visitas</span></header>
      <section className="intro"><p className="eyebrow">ASSISTENCIA TECNICA</p><h1>Agenda sem atrito.</h1><p>Organize tecnicos, servicos e visitas em um unico lugar.</p></section>
      <section className="workspace">
        <div><h2>Agenda de hoje</h2><p className="muted">Quarta-feira, 02 de setembro</p></div>
        <button type="button">+ Novo agendamento</button>
      </section>
      <section className="empty"><span className="mark">+</span><h2>Nenhuma visita agendada</h2><p>Crie o primeiro atendimento para comecar a organizar sua operacao.</p></section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
