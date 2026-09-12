import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header
        self.drawString(15 * mm, 285 * mm, "FixTime — Relatório de Entrega Oficial (SDD & Governança)")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(15 * mm, 282 * mm, 195 * mm, 282 * mm)
        
        # Footer
        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(195 * mm, 12 * mm, page_text)
        self.drawString(15 * mm, 12 * mm, "FixTime Bootcamp — Setembro / 2026")
        self.line(15 * mm, 16 * mm, 195 * mm, 16 * mm)
        self.restoreState()

def build_pdf(filename="Relatorio_Entrega_FixTime.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#1e40af")
    text_dark = colors.HexColor("#0f172a")
    text_muted = colors.HexColor("#475569")
    bg_light = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=30,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=text_muted,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=text_dark,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_dark,
        alignment=4, # Justified
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=text_dark,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    tag_style = ParagraphStyle(
        'TagStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#15803d")
    )

    story = []

    # ==========================================
    # CAPA
    # ==========================================
    story.append(Spacer(1, 15 * mm))
    story.append(Paragraph("<font color='#2563eb'><b>DOCUMENTO DE ENTREGA OFICIAL</b></font>", ParagraphStyle('Tag', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor("#2563eb"))))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("FixTime — Plataforma de Agendamento", title_style))
    story.append(Paragraph("Gestão Operacional de Visitas Técnicas com SDD (Spec-Driven Development), Governança GitHub e Test Harness Automatizado", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563eb"), spaceAfter=15))

    summary_text = (
        "<b>Status Geral da Entrega:</b> O projeto FixTime atende integralmente aos 4 pilares da avaliação: "
        "Repositório com Governança (zero commits diretos na main, PRs com revisão cruzada, board Kanban), "
        "Especificação Técnica SDD canônica em <code>docs/SPEC.md</code> (RFs, RNFs mensuráveis, RN01 a RN08, contratos JSON), "
        "Ambiente Dockerizado 100% reproduzível com copilotos de IA documentados, e "
        "Test Harness com <b>104 testes automatizados em verde</b> (44 backend + 60 frontend) com rastreabilidade formal via docstrings."
    )
    
    summary_table = Table([[Paragraph(summary_text, body_style)]], colWidths=[180 * mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#bbf7d0")),
        ('LINELEFT', (0,0), (0,-1), 4, colors.HexColor("#16a34a")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10 * mm))

    # Tabela de Integrantes
    story.append(Paragraph("<b>Integrantes da Equipe:</b>", h2_style))
    team_data = [
        [Paragraph("<b>Caio Boudens de Castro</b><br/>RA: 22304522", table_cell_style), Paragraph("<b>Eduardo Frois Drumond</b><br/>RA: 22303035", table_cell_style)],
        [Paragraph("<b>Fernando Medeiros Farias</b><br/>RA: 22306100", table_cell_style), Paragraph("<b>Larissa Queiroz Ramos</b><br/>RA: 22304308", table_cell_style)],
        [Paragraph("<b>Mayssa Barbosa Dias</b><br/>RA: 22303603", table_cell_style), Paragraph("<b>Thiago Venâncio Gomides</b><br/>RA: 22307398", table_cell_style)]
    ]
    team_table = Table(team_data, colWidths=[90 * mm, 90 * mm])
    team_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(team_table)
    story.append(Spacer(1, 10 * mm))

    # Métricas de Resumo
    metric_data = [
        [
            Paragraph("<b>104</b><br/><font size=7 color='#64748b'>TESTES APROVADOS</font>", ParagraphStyle('M1', alignment=1, fontSize=14, leading=16, textColor=primary_color)),
            Paragraph("<b>100%</b><br/><font size=7 color='#64748b'>COBERTURA REGRAS</font>", ParagraphStyle('M2', alignment=1, fontSize=14, leading=16, textColor=primary_color)),
            Paragraph("<b>0</b><br/><font size=7 color='#64748b'>COMMITS DIRETOS MAIN</font>", ParagraphStyle('M3', alignment=1, fontSize=14, leading=16, textColor=primary_color)),
            Paragraph("<b>1 CMD</b><br/><font size=7 color='#64748b'>DOCKER COMPOSE UP</font>", ParagraphStyle('M4', alignment=1, fontSize=14, leading=16, textColor=primary_color))
        ]
    ]
    metric_table = Table(metric_data, colWidths=[45 * mm, 45 * mm, 45 * mm, 45 * mm])
    metric_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(metric_table)
    story.append(Spacer(1, 15 * mm))
    story.append(Paragraph("<b>Repositório:</b> https://github.com/Fixtime-Bootcamp/bootcamp3 &nbsp;|&nbsp; <b>Data:</b> Setembro / 2026", ParagraphStyle('SubInfo', fontName='Helvetica', fontSize=8.5, textColor=text_muted, alignment=1)))

    story.append(PageBreak())

    # ==========================================
    # SEÇÃO 1: REPOSITÓRIO GITHUB COM GOVERNANÇA
    # ==========================================
    story.append(Paragraph("1. Repositório GitHub com Governança", h1_style))
    story.append(Paragraph(
        "A governança do projeto FixTime adota padrões rigorosos de engenharia de software colaborativa, rastreabilidade e proteção de branches:",
        body_style
    ))

    gov_data = [
        [Paragraph("Requisito", table_header_style), Paragraph("Status", table_header_style), Paragraph("Evidência e Implementação no Repositório", table_header_style)],
        [
            Paragraph("<b>Estratégia de Branches</b>", table_cell_style),
            Paragraph("<b>CONFORME</b>", tag_style),
            Paragraph("Estrutura composta por <code>main</code> (release estável), <code>develop</code> (integração contínua da sprint) e branches isoladas de feature nomeadas por issue (ex: <code>feature/issue-1-contrato-agendamento</code>, <code>feature/issue-28-exportacao-csv</code>).", table_cell_style)
        ],
        [
            Paragraph("<b>Proteção de Branches</b>", table_cell_style),
            Paragraph("<b>CONFORME</b>", tag_style),
            Paragraph("Regras de proteção ativas no GitHub exigindo abertura obrigatória de Pull Request, revisão com aprovação de outro membro e execução com sucesso da suíte de CI.", table_cell_style)
        ],
        [
            Paragraph("<b>Zero Commits na Main</b>", table_cell_style),
            Paragraph("<b>CONFORME</b>", tag_style),
            Paragraph("Nenhum commit direto foi realizado na branch <code>main</code>. Todo código entra exclusivamente via Pull Requests aprovados.", table_cell_style)
        ],
        [
            Paragraph("<b>GitHub Projects & Issues</b>", table_cell_style),
            Paragraph("<b>CONFORME</b>", tag_style),
            Paragraph("Quadro Kanban do projeto FixTime organizado com Issues detalhadas, critérios de aceite, labels de prioridade/épicos e responsáveis (assignees) atribuídos.", table_cell_style)
        ],
        [
            Paragraph("<b>Revisão Cruzada em PRs</b>", table_cell_style),
            Paragraph("<b>CONFORME</b>", tag_style),
            Paragraph("Histórico com dezenas de PRs (PR #24 a #60) revisados e aprovados por integrantes diferentes dos desenvolvedores que submeteram o código.", table_cell_style)
        ],
        [
            Paragraph("<b>README com ADRs</b>", table_cell_style),
            Paragraph("<b>CONFORME</b>", tag_style),
            Paragraph("README completo com visão geral, equipe, comandos de execução, guia de testes e Registro de Decisões Arquiteturais (ADR-001, ADR-002, ADR-003).", table_cell_style)
        ]
    ]

    gov_table = Table(gov_data, colWidths=[40 * mm, 25 * mm, 115 * mm])
    gov_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
    ]))
    story.append(gov_table)
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("<b>Síntese das Decisões Arquiteturais (ADRs):</b>", h2_style))
    story.append(Paragraph("• <b>ADR-001 (Spring Boot & React):</b> Spring Boot 3.4.5 para APIs REST corporativas com validação Bean Validation; React 19 com TypeScript e Vite para velocidade de renderização e tipagem no frontend.", bullet_style))
    story.append(Paragraph("• <b>ADR-002 (Regras de Negócio no Service):</b> Todas as validações de jornada, antecedência, conflitos de horário e feriados residem exclusivamente na camada de serviço (<code>AppointmentService</code>), mantendo controllers focados apenas no contrato HTTP.", bullet_style))
    story.append(Paragraph("• <b>ADR-003 (PostgreSQL no Docker e H2 nos Testes):</b> PostgreSQL 16 para o ambiente integrado de execução; banco em memória H2 nos testes para garantir rapidez, isolamento e independência de infraestrutura.", bullet_style))

    # ==========================================
    # SEÇÃO 2: ESPECIFICAÇÃO TÉCNICA (SDD)
    # ==========================================
    story.append(Paragraph("2. Especificação Técnica (SDD) — em docs/SPEC.md", h1_style))
    story.append(Paragraph(
        "A especificação canônica do sistema encontra-se no arquivo <code>docs/SPEC.md</code>, documentando o domínio e formalizando requisitos e contratos:",
        body_style
    ))

    story.append(Paragraph("<b>2.1. Problema Real e Personas:</b> Pequenas assistências técnicas enfrentam perda de receita e sobreposição de horários ao controlar atendimentos por planilhas e ligações. O FixTime atende ao <i>Operador</i> (gestão e conciliação), ao <i>Técnico</i> (jornada de campo) e ao <i>Cliente</i> (solicitação pontual).", body_style))

    story.append(Paragraph("<b>2.2. Requisitos Funcionais (RF) e Não-Funcionais Mensuráveis (RNF):</b>", h2_style))
    sdd_req_data = [
        [Paragraph("Código", table_header_style), Paragraph("Requisito", table_header_style), Paragraph("Critério de Aceite / Métrica Quantificável", table_header_style)],
        [Paragraph("<b>RF01 - RF03</b>", table_cell_style), Paragraph("CRUDs Clientes, Técnicos e Serviços", table_cell_style), Paragraph("Cadastro ativo, listagem e validação de campos obrigatórios.", table_cell_style)],
        [Paragraph("<b>RF04</b>", table_cell_style), Paragraph("Consulta de Disponibilidade", table_cell_style), Paragraph("Retorna janelas livres em dias úteis; lista vazia em feriados/bloqueios.", table_cell_style)],
        [Paragraph("<b>RF05</b>", table_cell_style), Paragraph("Criação e Listagem de Agendamentos", table_cell_style), Paragraph("Cálculo automático de <code>endsAt</code>, paginação e filtros combinados.", table_cell_style)],
        [Paragraph("<b>RF06 - RF07</b>", table_cell_style), Paragraph("Cancelamento e Conclusão de Visita", table_cell_style), Paragraph("Endpoints PATCH com validações de antecedência (>= 2h) e término.", table_cell_style)],
        [Paragraph("<b>RF08</b>", table_cell_style), Paragraph("Exportação em Streaming CSV", table_cell_style), Paragraph("Exportação RFC 4180 com codificação UTF-8 BOM para planilhas.", table_cell_style)],
        [Paragraph("<b>RNF01 - RNF02</b>", table_cell_style), Paragraph("API REST e Desempenho", table_cell_style), Paragraph("Prefixo <code>/api/v1</code> e latência transacional <b>P95 &lt; 300ms</b>.", table_cell_style)],
        [Paragraph("<b>RNF03 - RNF04</b>", table_cell_style), Paragraph("Erros Estruturados e Cobertura", table_cell_style), Paragraph("JSON padronizado <code>ErrorResponse</code>; cobertura de testes <b>&gt; 85%</b>.", table_cell_style)],
        [Paragraph("<b>RNF05</b>", table_cell_style), Paragraph("Reprodutibilidade Docker", table_cell_style), Paragraph("Inicialização fullstack com único comando <code>docker compose up</code>.", table_cell_style)],
    ]
    sdd_req_table = Table(sdd_req_data, colWidths=[25 * mm, 50 * mm, 105 * mm])
    sdd_req_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
    ]))
    story.append(sdd_req_table)
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("<b>2.3. Regras de Negócio Numeradas (RN):</b>", h2_style))
    story.append(Paragraph("• <b>RN01:</b> Cliente, técnico e serviço devem existir no banco e estar ativos (<code>active = true</code>).", bullet_style))
    story.append(Paragraph("• <b>RN02:</b> Duração do serviço positiva (> 0 min) e preço não-negativo (>= 0.00). Término (<code>endsAt</code>) calculado pelo backend.", bullet_style))
    story.append(Paragraph("• <b>RN03:</b> Início da visita deve ter pelo menos <b>2 horas de antecedência</b> em relação ao momento da requisição.", bullet_style))
    story.append(Paragraph("• <b>RN04:</b> Visitas ocorrem exclusivamente em <b>dias úteis das 08:00 às 18:00</b>, terminando no mesmo dia civil.", bullet_style))
    story.append(Paragraph("• <b>RN05:</b> Bloqueio de sobreposição de horário para o mesmo técnico (intervalos adjacentes são permitidos).", bullet_style))
    story.append(Paragraph("• <b>RN06:</b> Cancelamento permitido apenas em status <code>SCHEDULED</code> e com antecedência >= 2 horas.", bullet_style))
    story.append(Paragraph("• <b>RN07:</b> Conclusão permitida apenas em status <code>SCHEDULED</code> e estritamente após o horário de término (<code>endsAt</code>).", bullet_style))
    story.append(Paragraph("• <b>RN08:</b> Bloqueio automático de agendamentos em feriados nacionais brasileiros e datas bloqueadas cadastradas.", bullet_style))

    story.append(PageBreak())

    # ==========================================
    # SEÇÃO 3: IA + AMBIENTE PADRONIZADO
    # ==========================================
    story.append(Paragraph("3. Agente de IA + Ambiente Padronizado", h1_style))
    story.append(Paragraph(
        "O projeto padronizou o uso de copilotos de Inteligência Artificial e a infraestrutura de contêineres para máxima reprodutibilidade:",
        body_style
    ))

    story.append(Paragraph("<b>3.1. Governança e Arquivos de Contexto de IA Versionados:</b>", h2_style))
    story.append(Paragraph("• <code>AGENTS.md</code>: Diretrizes obrigatórias de governança, convenções de código Spring Boot/React e fluxo SDD.", bullet_style))
    story.append(Paragraph("• <code>.cursorrules</code>: Contexto arquitetural e regras de validação para desenvolvimento no editor Cursor.", bullet_style))
    story.append(Paragraph("• <code>.github/copilot-instructions.md</code>: Instruções de alinhamento com a especificação técnica para o GitHub Copilot.", bullet_style))
    story.append(Paragraph("• <b>Rastreabilidade em PRs:</b> Todas as contribuições com suporte de IA foram revisadas, testadas e validadas por membros humanos da equipe antes de qualquer aprovação.", bullet_style))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("<b>3.2. Reprodutibilidade 100% Docker (Zero Configuração Prévia):</b>", h2_style))
    story.append(Paragraph(
        "A aplicação é completamente reprodutível. Qualquer usuário pode clonar o repositório e executar o ecossistema fullstack com um único comando, sem necessidade de Java, Maven ou Node.js locais:",
        body_style
    ))

    cmd_box = [
        [Paragraph("<b>Comando Único de Execução do Ambiente Completo:</b><br/><code>docker compose up --build</code>", ParagraphStyle('Cmd', fontName='Courier', fontSize=8.5, leading=12, textColor=colors.HexColor("#0f172a")))]
    ]
    cmd_table = Table(cmd_box, colWidths=[180 * mm])
    cmd_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(cmd_table)
    story.append(Spacer(1, 3 * mm))

    docker_data = [
        [Paragraph("Serviço", table_header_style), Paragraph("Imagem / Base", table_header_style), Paragraph("Porta", table_header_style), Paragraph("Função no Ecossistema FixTime", table_header_style)],
        [Paragraph("<b>database</b>", table_cell_style), Paragraph("postgres:16-alpine", table_cell_style), Paragraph("5432", table_cell_style), Paragraph("Banco relacional com healthcheck ativo para integridade.", table_cell_style)],
        [Paragraph("<b>backend</b>", table_cell_style), Paragraph("Eclipse Temurin 21 JRE", table_cell_style), Paragraph("8080", table_cell_style), Paragraph("API REST Spring Boot com JPA, DTOs e validações de serviço.", table_cell_style)],
        [Paragraph("<b>frontend</b>", table_cell_style), Paragraph("Nginx Alpine (Multi-stage)", table_cell_style), Paragraph("5173 / 80", table_cell_style), Paragraph("SPA React com proxy reverso automático para <code>backend:8080</code>.", table_cell_style)]
    ]
    docker_table = Table(docker_data, colWidths=[25 * mm, 45 * mm, 25 * mm, 85 * mm])
    docker_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
    ]))
    story.append(docker_table)

    # ==========================================
    # SEÇÃO 4: TEST HARNESS AUTOMATIZADO
    # ==========================================
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("4. Test Harness (Suíte de Testes Automatizados)", h1_style))
    story.append(Paragraph(
        "A suíte automatizada do FixTime é composta por <b>104 testes em verde</b>, executáveis via comando único no Docker ou localmente:",
        body_style
    ))

    test_cmd_box = [
        [Paragraph("<b>Comando Único de Execução do Test Harness via Docker:</b><br/><code>docker compose run --rm backend mvn test</code>", ParagraphStyle('CmdTest', fontName='Courier', fontSize=8.5, leading=12, textColor=colors.HexColor("#0f172a")))]
    ]
    test_cmd_table = Table(test_cmd_box, colWidths=[180 * mm])
    test_cmd_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#bfdbfe")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(test_cmd_table)
    story.append(Spacer(1, 3 * mm))

    test_summary_data = [
        [Paragraph("Componente de Teste", table_header_style), Paragraph("Tecnologia", table_header_style), Paragraph("Testes", table_header_style), Paragraph("Status", table_header_style), Paragraph("Rastreabilidade e Regras Validadas", table_header_style)],
        [Paragraph("<b>AppointmentServiceTest</b>", table_cell_style), Paragraph("JUnit 5 / Mockito", table_cell_style), Paragraph("19", table_cell_style), Paragraph("PASS", tag_style), Paragraph("RN01 a RN08 com <code>Clock</code> fixo (criação, antecedência, feriados).", table_cell_style)],
        [Paragraph("<b>AppointmentIntegrationTest</b>", table_cell_style), Paragraph("MockMvc / H2", table_cell_style), Paragraph("11", table_cell_style), Paragraph("PASS", tag_style), Paragraph("Fluxo completo REST, paginação, filtros e resposta estruturada 400.", table_cell_style)],
        [Paragraph("<b>BlockedDateIntegrationTest</b>", table_cell_style), Paragraph("MockMvc / H2", table_cell_style), Paragraph("5", table_cell_style), Paragraph("PASS", tag_style), Paragraph("RN08: Bloqueio de datas, feriados nacionais e rejeição 409.", table_cell_style)],
        [Paragraph("<b>AppointmentExportTest</b>", table_cell_style), Paragraph("MockMvc / Unit", table_cell_style), Paragraph("5", table_cell_style), Paragraph("PASS", tag_style), Paragraph("RF08: Conformidade RFC 4180 e UTF-8 BOM para streaming CSV.", table_cell_style)],
        [Paragraph("<b>Customer & Health Tests</b>", table_cell_style), Paragraph("JUnit 5 / WebMvc", table_cell_style), Paragraph("4", table_cell_style), Paragraph("PASS", tag_style), Paragraph("RF01/RN01 (ativação cadastral) e RNF01 (endpoint <code>/api/v1/health</code>).", table_cell_style)],
        [Paragraph("<b>Frontend Test Suite</b>", table_cell_style), Paragraph("Vitest / RTL", table_cell_style), Paragraph("60", table_cell_style), Paragraph("PASS", tag_style), Paragraph("8 arquivos cobrindo páginas, modais, elegibilidade e cliente HTTP.", table_cell_style)],
        [Paragraph("<b>TOTAL CONSOLIDADO</b>", table_cell_bold), Paragraph("<b>Fullstack</b>", table_cell_bold), Paragraph("<b>104</b>", table_cell_bold), Paragraph("<b>100% OK</b>", tag_style), Paragraph("<b>Zero falhas, zero erros e zero testes ignorados.</b>", table_cell_bold)],
    ]
    test_summary_table = Table(test_summary_data, colWidths=[42 * mm, 28 * mm, 14 * mm, 20 * mm, 76 * mm])
    test_summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, bg_light]),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#e2e8f0")),
    ]))
    story.append(test_summary_table)
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("<b>4.2. Rastreabilidade Formal via Docstrings:</b> Cada método de teste no backend e frontend inclui Javadoc ou JSDoc explícito mapeando o teste à respectiva regra ou contrato (ex.: <code>/** Valida RN05 e RF05: Bloqueio de sobreposição */</code>). O relatório completo encontra-se em <code>docs/test-report.md</code>.", body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF gerado com sucesso: {filename}")

if __name__ == '__main__':
    output_pdf = sys.argv[1] if len(sys.argv) > 1 else "Relatorio_Entrega_FixTime.pdf"
    build_pdf(output_pdf)
