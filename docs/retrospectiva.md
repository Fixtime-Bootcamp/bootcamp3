# Retrospectiva de Aprendizados e Resumo Executivo de Encerramento - FixTime

**Projeto:** FixTime - Plataforma de Agendamento para Assistencia Tecnica
**Entrega Final:** Entrega 2 (Encerramento do Bootcamp 3)
**Data:** 2026-10-21
**Equipe:**
- Caio Boudens de Castro - RA: 22304522
- Eduardo Frois Drumond - RA: 22303035
- Fernando Medeiros Farias - RA: 22306100
- Larissa Queiroz Ramos - RA: 22304308
- Mayssa Barbosa Dias - RA: 22303603
- Thiago Venancio Gomides - RA: 22307398

---

## 1. Resumo Executivo de Encerramento

O projeto **FixTime** foi desenvolvido de forma completa ao longo do Bootcamp 3, partindo da concepcao e especificacao formal do dominio ate a entrega de uma plataforma REST funcional com cobertura automatizada de testes e evidencias de qualidade rastreaveis.

O sistema entrega uma solucao deterministica e escalavel para o gerenciamento de agendamentos de assistencias tecnicas, cobrindo **8 Requisitos Funcionais (RF01 a RF08)** e **8 Regras de Negocio (RN01 a RN08)**, formalizadas no documento canonico [docs/SPEC.md](SPEC.md). O desenvolvimento foi guiado pelo modelo **Spec-Driven Development (SDD)**, que provou ser essencial para eliminar ambiguidades, garantir rastreabilidade e sustentar um ciclo de correcao seguro.

### Numeros Finais do Projeto

| Indicador | Valor |
| :--- | ---: |
| Testes automatizados executados | **152 (zero falhas)** |
| Classes de teste backend | 11 |
| Testes backend (JUnit 5 / MockMvc) | 72 |
| Testes frontend (Vitest / Testing Library) | 80 |
| Cobertura de linhas - Backend (JaCoCo) | 85,5% |
| Cobertura de linhas - Frontend (V8) | 91,6% |
| Pull Requests mergeados | 25+ |
| Issues fechadas | 100+ |
| Branches de feature deletadas (higiene) | 20+ |
| Ferramentas de IA utilizadas | 4 (Antigravity, Claude Code, Cursor, Codex) |

### Artefatos Entregues

- [docs/SPEC.md](SPEC.md) - Especificacao Tecnica Canonica (SDD) v1.3
- [docs/test-report.md](test-report.md) - Relatorio do Test Harness Final (152 testes)
- [logs_testes_final.txt](../logs_testes_final.txt) - Log integro da execucao via Docker
- [docs/erros-logicos.md](erros-logicos.md) - Inspecao de erros logicos e loop de re-especificacao
- [docs/relatorio-etico-ia.md](relatorio-etico-ia.md) - Analise comparativa e etica do uso de IA
- [docs/DEMO.md](DEMO.md) - Roteiro de demonstracao do fluxo principal
- [docs/retrospectiva.md](retrospectiva.md) - Este documento

---

## 2. Eficacia dos Agentes de IA no Fluxo SDD

O uso de agentes de IA foi adotado como **acelerador do ciclo SDD**, nunca como substituto da decisao humana. A estrategia foi clara: a equipe fornecia a especificacao como contexto, o agente propunha a implementacao e os testes validavam a conformidade com o contrato.

### Ganhos de Produtividade Observados

- **Geracao de suites de testes completas:** O tempo para escrever testes de integracao com MockMvc, mocks de Clock fixo e casos de borda de datas (feriados, fins de semana, antecedencia) foi reduzido em estimativa de ~70% em comparacao ao desenvolvimento manual puro.
- **Scaffolding de codigo repetitivo:** A estrutura de controllers, DTOs, repositories e exception handlers foi gerada de forma consistente e alinhada ao padrao do projeto, eliminando divergencias de nomenclatura e estilo.
- **Diagnostico de erros logicos:** Ao compartilhar falhas do Test Harness com os agentes, a equipe obteve diagnosticos precisos sobre causa-raiz (como o falso positivo de colisao de horarios adjacentes - Caso 2 em [docs/erros-logicos.md](erros-logicos.md)).
- **Documentacao tecnica:** Geracao automatizada de changelogs, relatorios de cobertura e documentacao de API (OpenAPI) significativamente acelerada.

### Dificuldades Superadas com IA

- **Alucinacoes em contratos de borda:** Em alguns momentos, agentes propuseram implementacoes ligeiramente fora do contrato especificado em docs/SPEC.md. A mitigacao foi sistematicamente injetar o documento de especificacao no contexto de cada interacao.
- **Divergencia de versoes de dependencias:** Agentes sugeriram APIs descontinuadas de versoes antigas do Spring Boot. O tratamento foi revisar sempre contra o pom.xml atual antes de aceitar qualquer sugestao.
- **Governanca de branches:** Os agentes, por padrao, operavam na branch atual sem verificar a existencia de issues abertas ou o estado do GitHub Project. A equipe padronizou um fluxo de prompt que exigia a verificacao via gh issue list antes de qualquer implementacao (conforme AGENTS.md).

---

## 3. Licoes de Governanca

O projeto demonstrou que a **governanca do repositorio** e o **fluxo de trabalho estruturado** sao tao criticos quanto a qualidade do codigo em si.

### Praticas que Funcionaram

1. **Pull Requests como unica porta de entrada:** Nenhum codigo chegou as branches main ou develop sem revisao humana e CI verde. Isso criou uma cultura de responsabilidade compartilhada.
2. **Issues como unidade de trabalho:** Cada tarefa, por menor que fosse, tinha uma Issue associada com criterios de aceite claros. Isso permitiu que os agentes de IA operassem com contexto bem delimitado.
3. **AGENTS.md como contrato de comportamento da IA:** O arquivo [AGENTS.md](../AGENTS.md) funcionou como um manual de operacao que todos os agentes leram antes de executar qualquer tarefa, garantindo uniformidade no fluxo de governanca.
4. **Delecao de branches pos-merge:** A politica de limpar feature branches imediatamente apos o merge reduziu a complexidade de navegacao no repositorio e evitou conflitos acidentais.
5. **Especificacao viva:** O docs/SPEC.md foi tratado como um documento vivo, com revisoes registradas em [docs/spec-changelog.md](spec-changelog.md), garantindo que todos - humanos e IAs - partissem do mesmo estado de verdade.

### O Que Fariamos Diferente

- **Incluir autenticacao desde o inicio:** A postergacao do OAuth2/JWT para uma versao futura foi uma decisao pragmatica, mas gerou uma lacuna de cobertura que precisara ser enderecada na v1.3.
- **Definir alertas de cobertura no CI desde a Sprint 1:** A meta de 85% de cobertura (RNF04) teria sido atingida mais cedo se o threshold de JaCoCo estivesse configurado como gate de CI desde o inicio.

---

## 4. Contribuicoes Individuais - Reflexoes da Equipe

### Mayssa Barbosa Dias
Durante o projeto, pude perceber como a adocao do modelo SDD mudou completamente a forma como eu pensava sobre desenvolvimento de software. Antes de escrever qualquer linha de codigo, a consulta ao docs/SPEC.md virou um reflexo automatico. Participar da execucao do harness final e da geracao das evidencias de cobertura foi especialmente satisfatorio: ver 152 testes aprovados com zero falhas, depois de semanas de ciclos iterativos, mostrou concretamente que o processo funciona. A licao que levo e que disciplina de processo nao e burocracia - e o que transforma uma ideia em produto confiavel.

### Larissa Queiroz Ramos
Minha maior surpresa ao longo do bootcamp foi perceber como os testes automatizados deixaram de ser uma obrigacao e passaram a ser uma rede de seguranca que me dava confianca para refatorar e evoluir o codigo. Sempre que havia duvida sobre se uma mudanca quebraria algo, bastava rodar o harness para ter a resposta em segundos. Aprendi tambem que a revisao de codigo entre pares, alem de garantir qualidade tecnica, e uma das formas mais eficientes de nivelamento do time - cada PR que revisamos foi uma oportunidade de aprendizado bilateral.

### Caio Boudens de Castro
A experiencia de coordenar a governanca do repositorio e a rastreabilidade das issues me ensinou que um projeto bem organizado e aquele em que qualquer integrante - ou qualquer agente de IA - pode entrar em qualquer momento e entender exatamente o que esta sendo feito e por que. O AGENTS.md e o fluxo de PRs nao foram overhead: foram o que permitiu que quatro ferramentas de IA diferentes operassem no mesmo repositorio sem gerar caos. A IA amplifica a disciplina de quem a usa - para o bem ou para o mal.

### Fernando Medeiros Farias
Trabalhar com multiplos agentes de IA lado a lado foi uma experiencia unica. Cada ferramenta tinha personalidade propria: o Claude Code era mais analitico e cuidadoso com contratos, o Cursor era mais agil para refatoracoes inline, e o Antigravity se destacou na automacao de pipelines e na gestao autonoma de tarefas de build e CI. O que ficou claro e que nenhuma delas substitui o julgamento do engenheiro para validar se o resultado esta correto e seguro. A homologacao humana nao e uma etapa burocratica - e a etapa mais importante de todo o processo.

### Eduardo Frois Drumond
A parte mais desafiadora do projeto para mim foi lidar com a complexidade temporal dos testes: validar regras de negocio que dependem de horario comercial, fins de semana e feriados nacionais sem amarrar os testes a data real da maquina. A solucao com Clock injetavel e NationalHolidayProvider foi elegante e revelou que boas decisoes arquiteturais no comeco evitam dias de retrabalho no futuro. Aprendi que um teste fragil (que so passa em certos dias ou horarios) e quase tao ruim quanto a ausencia de teste.

### Thiago Venancio Gomides
A experiencia com o Docker Compose como plataforma unificada de execucao de testes foi um divisor de aguas. Poder garantir que qualquer pessoa, em qualquer maquina, com um unico comando obtem o mesmo resultado deterministico dos 152 testes e um nivel de reprodutibilidade que antes parecia distante. Isso me mostrou na pratica o valor da infraestrutura como codigo: a configuracao do docker-compose.yml com o perfil de testes e tao parte do produto quanto o codigo de producao. Entrego esse projeto com a certeza de que levei aprendizados que vao muito alem do codigo.

---

## 5. Conclusao

O **FixTime** encerra o Bootcamp 3 como um produto funcional, documentado, testado e rastreavel - construido por uma equipe que aprendeu, na pratica, a integrar rigor tecnico, governanca colaborativa e ferramentas de inteligencia artificial de forma responsavel e produtiva.

O processo SDD, combinado com a automacao de testes e a disciplina de Pull Requests, demonstrou ser um modelo replicavel para projetos futuros. A IA acelerou o desenvolvimento sem comprometer a qualidade - porque a equipe manteve o controle, a revisao e a responsabilidade sobre cada linha mergeada.

> "A IA amplifica a disciplina de quem a usa. Um processo ruim com IA gera codigo ruim mais rapido. Um processo bom com IA gera software de qualidade em velocidade surpreendente."

---

**Referencias Cruzadas:**
- [docs/SPEC.md](SPEC.md) - Especificacao Tecnica Canonica
- [docs/erros-logicos.md](erros-logicos.md) - Inspecao de Erros e Re-especificacao
- [docs/relatorio-etico-ia.md](relatorio-etico-ia.md) - Analise Etica e Comparativa de IA
- [docs/test-report.md](test-report.md) - Relatorio de Execucao do Test Harness Final
- [AGENTS.md](../AGENTS.md) - Diretrizes de Governanca para Agentes de IA
