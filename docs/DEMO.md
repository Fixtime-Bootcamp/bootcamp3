# Roteiro de Demonstração - FixTime v1.0.0

Roteiro de apoio à gravação do vídeo de demonstração (issue #94), com duração alvo de **3 a 5 minutos**. Cobre o fluxo principal do FixTime de ponta a ponta: cadastros, agendamento, conflito de agenda, cancelamento/conclusão, listagem com exportação CSV, documentação Swagger e execução da suíte de testes.

---

## 1. Preparação (antes de gravar)

1. Suba a aplicação a partir de um clone limpo:
   ```bash
   docker compose up --build
   ```
2. Confirme que os serviços respondem:
   - Frontend: `http://localhost:5173`
   - Health check: `http://localhost:8080/api/v1/health` deve retornar `"status": "UP"`
   - Swagger UI: `http://localhost:8080/swagger-ui.html`
3. Escolha a **data da demonstração**: o próximo dia útil (segunda a sexta) que não seja feriado nacional (RN04 e RN08). Neste roteiro ela aparece como `AAAA-MM-DD`.
4. Deixe abertos: uma aba do navegador no frontend, outra no Swagger e um terminal na raiz do repositório.
5. Use somente dados fictícios (RNF de privacidade / LGPD). Sugestões:

| Cadastro | Dados sugeridos |
| --- | --- |
| Cliente | Maria Exemplo, `maria@exemplo.com`, `(61) 90000-0001` |
| Técnico | Joao Tecnico, `joao@exemplo.com`, `(61) 90000-0002` |
| Serviço | Formatação de notebook, duração `90` min, preço `150.00` |

---

## 2. Sequência da demonstração

| # | Tempo | Etapa | Requisitos |
| --- | --- | --- | --- |
| 1 | 0:00 - 0:20 | Abertura | - |
| 2 | 0:20 - 1:10 | Cadastros de cliente, técnico e serviço | RF01, RF02, RF03, RN01, RN02 |
| 3 | 1:10 - 2:00 | Criação de agendamento com consulta de disponibilidade | RF04, RF05, RN03, RN04 |
| 4 | 2:00 - 2:30 | Conflito de agenda rejeitado | RN05 |
| 5 | 2:30 - 3:10 | Cancelamento e conclusão | RF06, RF07, RN06, RN07 |
| 6 | 3:10 - 3:40 | Listagem filtrada e exportação CSV | RF05, RF08 |
| 7 | 3:40 - 4:10 | Documentação da API no Swagger | RNF01, RNF03 |
| 8 | 4:10 - 5:00 | Testes automatizados em tempo real | RNF04 |

### 2.1 Abertura (0:00 - 0:20)

- Apresentar o FixTime: agendamento de visitas técnicas para assistências de pequeno e médio porte, sem conflitos de agenda.
- Mostrar a tela inicial com as abas **Agenda**, **Clientes**, **Técnicos** e **Serviços**.

> Fala sugerida: "O FixTime centraliza clientes, técnicos e serviços e garante que nenhum técnico tenha dois atendimentos no mesmo horário."

### 2.2 Cadastros (0:20 - 1:10)

1. Aba **Clientes**: cadastrar a cliente da tabela da seção 1 e mostrar o registro ativo na lista.
2. Aba **Técnicos**: cadastrar o técnico.
3. Aba **Serviços**: cadastrar o serviço com duração de 90 minutos e preço R$ 150,00.
4. *(Opcional, edge case)* Tentar salvar um serviço com duração `0` e mostrar a mensagem de validação (RN02).

> Destaque: cadastros nascem ativos; somente cadastros ativos podem ser usados em agendamentos (RN01).

### 2.3 Criação de agendamento (1:10 - 2:00)

1. Aba **Agenda** -> **Novo agendamento**.
2. Selecionar cliente, técnico e serviço. Mostrar o card com duração e preço do serviço.
3. Informar a data `AAAA-MM-DD`. Mostrar os **intervalos disponíveis** do técnico (RF04).
4. Informar o horário `10:00` e confirmar.
5. Mostrar o card do agendamento com término calculado automaticamente às `11:30` (RN02) e status **Agendado**.

> Destaque: a API só aceita dias úteis entre 08:00 e 18:00 (RN04), com pelo menos 2 horas de antecedência (RN03), e bloqueia feriados nacionais e datas bloqueadas (RN08).

### 2.4 Conflito de agenda rejeitado (2:00 - 2:30)

1. Abrir **Novo agendamento** de novo, com o **mesmo técnico** e a mesma data.
2. Informar o horário `11:00`, que se sobrepõe ao intervalo 10:00-11:30.
3. Confirmar e mostrar a mensagem de conflito retornada pela API (`409 CONFLICT`).
4. Trocar o horário para `11:30` (adjacente ao anterior) e mostrar que o agendamento é aceito.

> Destaque: intervalos adjacentes são permitidos; sobrepostos, não (RN05).

### 2.5 Cancelamento e conclusão (2:30 - 3:10)

1. No agendamento das `11:30`, clicar em **Cancelar** e mostrar o status **Cancelado** (RN06: antecedência mínima de 2 horas).
2. No agendamento das `10:00`, passar o mouse sobre **Concluir** e mostrar que o botão está desabilitado, com a explicação de que a conclusão só é permitida após o término da visita (RN07).
3. *(Opcional)* No Swagger, chamar `PATCH /api/v1/appointments/{id}/complete` para o mesmo ID e mostrar a resposta `400` com JSON padronizado: a regra também é garantida pelo backend.

> Observação: como a RN03 impede criar visitas no passado, o caminho feliz da conclusão é demonstrado pelos testes automatizados com relógio fixo (`AppointmentServiceTest`), exibidos na etapa 2.8.

### 2.6 Listagem e exportação CSV (3:10 - 3:40)

1. Na aba **Agenda**, filtrar pela data `AAAA-MM-DD` e mostrar os agendamentos do dia, com seus status.
2. Clicar em **Exportar CSV**.
3. Abrir o arquivo baixado (`appointments-<data-atual>.csv`, ex.: `appointments-2026-10-21.csv`) em um editor de planilhas e mostrar o cabeçalho e os acentos preservados (UTF-8 com BOM, RFC 4180).

### 2.7 Swagger / OpenAPI (3:40 - 4:10)

1. Abrir `http://localhost:8080/swagger-ui.html`.
2. Mostrar os grupos de endpoints sob `/api/v1`: clientes, técnicos, serviços, datas bloqueadas e agendamentos.
3. Executar `GET /api/v1/technicians/{technicianId}/availability?date=AAAA-MM-DD` e mostrar os intervalos livres, que já descontam os agendamentos criados.
4. *(Opcional)* Executar `POST /api/v1/blocked-dates` para a data da demonstração e repetir a consulta de disponibilidade, que passa a retornar lista vazia (RN08).

### 2.8 Testes em tempo real (4:10 - 5:00)

Rodar a suíte no terminal. Opção com Docker, sem dependências locais:

```bash
docker compose --profile test up --build --abort-on-container-exit backend-tests frontend-tests
```

Ou, se Java 21, Maven e Node.js estiverem instalados (mais rápido para a gravação):

```bash
cd backend && mvn test
cd ../frontend && npm run test:coverage
```

Mostrar no vídeo:

- `Tests run: ..., Failures: 0, Errors: 0` e `BUILD SUCCESS` no backend.
- `Test Files ... passed` e a tabela de cobertura no frontend.
- *(Opcional)* O relatório JaCoCo em `backend/target/site/jacoco/index.html`.

> Fechamento sugerido: "Todas as regras de negócio RN01 a RN08 têm testes automatizados rastreáveis à especificação em `docs/SPEC.md`. Os números consolidados estão em `docs/test-report.md`."

---

## 3. Checklist rápido

- [ ] Aplicação sobe com `docker compose up --build`
- [ ] Data da demonstração é dia útil e não é feriado
- [ ] Cadastro de cliente, técnico e serviço
- [ ] Agendamento criado com término calculado
- [ ] Conflito rejeitado (409) e horário adjacente aceito
- [ ] Cancelamento realizado e conclusão bloqueada antes do término
- [ ] Listagem filtrada e CSV exportado
- [ ] Swagger exibido com uma chamada executada
- [ ] Suíte de testes executada em verde
- [ ] Nenhum dado pessoal real exibido

## 4. Problemas comuns

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| Disponibilidade vazia | Data em fim de semana, feriado ou bloqueada | Escolher outro dia útil |
| Erro de antecedência ao agendar | Horário a menos de 2 horas do momento atual | Usar uma data futura |
| Cliente/técnico/serviço não aparece no formulário | Cadastro inativo | Reativar na aba correspondente |
| Porta 5432, 8080 ou 5173 ocupada | Outro serviço local usando a porta | Encerrar o serviço ou rodar `docker compose down` |
