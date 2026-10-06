# Relatório Técnico-Ético: Análise Comparativa e Avaliação Crítica do Uso de Agentes de IA

**Entrega:** Entrega 2 - Publicação do Projeto, Refinamento e Análise Crítica  
**Projeto:** FixTime - Plataforma de Agendamento para Assistência Técnica  
**Equipe:**  
- Caio Boudens de Castro - RA: 22304522  
- Eduardo Frois Drumond - RA: 22303035  
- Fernando Medeiros Farias - RA: 22306100  
- Larissa Queiroz Ramos - RA: 22304308  
- Mayssa Barbosa Dias - RA: 22303603  
- Thiago Venâncio Gomides - RA: 22307398  

---

## 1. Introdução

No desenvolvimento do **FixTime**, a equipe adotou ferramentas de Inteligência Artificial generativa como copilotos ativos em todas as fases do ciclo de vida de software: da elicitação e refinamento da especificação técnica (SDD) à codificação em Spring Boot e React, passando pela escrita de suítes de testes unitários e de integração.

O uso dessas tecnologias não foi encarado como mero autocompletar de código, mas sim como uma **orquestração de agentes autônomos e assistidos**. Essa experiência prática proporcionou à equipe uma visão aprofundada e crítica sobre os ganhos de produtividade proporcionados pelas ferramentas, bem como sobre os severos riscos éticos, jurídicos e de segurança intrínsecos à automação do desenvolvimento.

Este relatório apresenta a **análise comparativa entre quatro das principais soluções do mercado** (Claude Code, OpenAI Codex/CLI, Cursor e Antigravity) e aprofunda a reflexão sobre os **quatro pilares éticos e operacionais** indispensáveis à engenharia de software contemporânea.

---

## 2. Análise Comparativa de Ferramentas de IA

A equipe avaliou e utilizou diferentes ferramentas durante o projeto, categorizando-as em duas vertentes principais: **Agentes Integrados à IDE** (Cursor e Antigravity) e **Agentes Autônomos de Terminal / CLI** (Claude Code e OpenAI Codex).

```
                      ┌───────────────────────────────────────┐
                      │    Ferramentas de IA no FixTime       │
                      └──────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │      IDE-Centric      │                       │      CLI-Centric      │
     │  (Cursor, Antigravity)│                       │  (Claude Code, Codex) │
     ├───────────────────────┤                       ├───────────────────────┤
     │ • Edição inline       │                       │ • Tarefas em lote     │
     │ • Contexto visual     │                       │ • Scripts e pipelines │
     │ • Refatoração pontual │                       │ • Diagnóstico headless│
     └───────────────────────┘                       └───────────────────────┘
```

---

### 2.1. Matriz Comparativa Objetiva

| Critério de Avaliação | Claude Code (CLI) | OpenAI Codex / CLI | Cursor (IDE) | Antigravity (Google / IDE) |
| :--- | :---: | :---: | :---: | :---: |
| **Interface de Operação** | CLI de Terminal | CLI / Scripts API | IDE (Fork do VS Code) | IDE Integrada / Agente Autônomo |
| **Capacidade de Contexto do Repositório** | Alta (Leitura e busca ativa de arquivos) | Média (Limitado por janela de prompt) | Muito Alta (Indexação local via embeddings) | Muito Alta (Indexação profunda + Knowledge Items) |
| **Aderência ao Fluxo SDD (Spec-Driven)** | Alta (Excelente raciocínio analítico) | Média (Foco em geração bruta de código) | Alta (Com uso de regras `@docs/SPEC.md`) | Excelente (Instrução nativa de regras e workflow) |
| **Geração de Testes Automatizados** | Excelente (Cobre edge cases complexos) | Boa (Foco no caminho feliz) | Muito Boa (Facilidade para gerar mocks) | Excelente (Suporte a docstrings e rastreabilidade) |
| **Execução Autônoma de Comandos e Testes** | Alta (Executa comandos no shell diretamente) | Baixa (Requer orquestração externa) | Média (Terminal integrado interativo) | Total (Executa builds, testes e gerencia tasks) |
| **Propensão a Alucinações de Sintaxe** | Baixa | Média | Baixa a Média | Muito Baixa (Valida com ferramentas de inspeção) |
| **Governança e Cumprimento de Regras** | Alta | Baixa | Alta (via `.cursorrules`) | Muito Alta (Injeção estrita de user rules e AGENTS.md) |

---

### 2.2. Avaliação Detalhada das Ferramentas

#### 1. Claude Code (Anthropic)
* **Pontos Fortes:** Raciocínio lógico e capacidade de decomposição de problemas de alta complexidade. Excelente para refatorações que exigem análise semântica de múltiplas classes simultaneamente (ex.: refatorar `AppointmentService` preservando contratos de erro). Muito disciplinado ao seguir instruções explícitas de especificação.
* **Limitações:** Por operar exclusivamente via CLI, a visualização imediata de diffs lado a lado é menos intuitiva que em um editor gráfico. O consumo de tokens pode ser acelerado em tarefas exploratórias que varrem muitos arquivos desnecessariamente.
* **Impacto no FixTime:** Foi fundamental na análise de conformidade das regras de negócio temporais e no desenho inicial dos testes parametrizados do backend.

#### 2. OpenAI Codex / CLI
* **Pontos Fortes:** Respostas rápidas e alta proficiência na sintaxe canônica de linguagens estabelecidas (Java e TypeScript padrão). Eficiente na geração rápida de boilerplate, DTOs e entidades com anotações JPA.
* **Limitações:** Apresenta maior propensão a sugerir padrões de versões obsoletas (ex.: sugerir sintaxe do Spring Boot 2.x ou JUnit 4 em um projeto que exige estritamente Java 21 e Spring Boot 3.4.5). Dificuldade em manter coerência com regras de negócio customizadas que dependem de leitura de múltiplos arquivos complementares.
* **Impacto no FixTime:** Agilizou a prototipação de classes de modelo e DTOs, mas exigiu forte revisão humana para adequar as anotações aos padrões mais modernos da stack.

#### 3. Cursor
* **Pontos Fortes:** Experiência de desenvolvimento integrada (DX) fantástica. O recurso de indexar todo o repositório com embeddings permitiu fazer perguntas contextuais com referências precisas a arquivos (ex.: `@docs/SPEC.md` e `@AppointmentRepository.java`). O controle por meio do `.cursorrules` manteve as convenções do time ativas durante a digitação.
* **Limitações:** A geração inline de código ocasionalmente introduz pequenas redundâncias ou sobrescreve comentários importantes de classes adjacentes se o escopo de seleção não for cirúrgico.
* **Impacto no FixTime:** Aceleração drástica na construção da interface React e dos componentes de formulário e cartões de agendamento (`AppointmentCard`, `CreateAppointmentModal`).

#### 4. Antigravity (Google DeepMind)
* **Pontos Fortes:** Capacidade de orquestração autônoma de ponta a ponta. Diferencia-se pela habilidade de inspecionar o workspace, propor planos estruturados, executar comandos de verificação (`mvn test`, `npm test`), analisar saídas de erro do compilador e aplicar correções de forma iterativa sem necessidade de comandos manuais repetitivos. Suporte impecável ao cumprimento de regras de governança (`AGENTS.md`) e ferramentas de pesquisa semântica.
* **Limitações:** Requer definição clara e granular de limites operacionais para evitar modificações colaterais em arquivos fora do escopo da issue.
* **Impacto no FixTime:** Pilar central para governança automatizada do projeto: criação de branches isoladas, validação do test harness de 104 testes e elaboração de relatórios de conformidade.

---

## 3. Ética, Limites e Segurança do Uso de IA

O avanço vertiginoso dos modelos de linguagem na geração de código impõe uma discussão ética profunda. No FixTime, adotamos o princípio de que **a IA é uma ferramenta de aceleração cognitiva, mas a responsabilidade técnica e moral pelo software permanece integralmente da equipe humana**.

Abaixo fundamentamos essa postura crítica em quatro pilares obrigatórios:

---

### Pilar 1: Riscos de Alucinação de Código e Geração de Código Inseguro ou Destrutivo

#### A Natureza da Alucinação em Código
Modelos de IA operam por previsão estatística do próximo token e não por compreensão determinística de máquinas de execução. Consequentemente, o fenômeno da alucinação manifesta-se de maneiras críticas:
1. **Alucinação de Pacotes e Dependências ("Package Hallucination"):** A IA pode sugerir importar bibliotecas externas inexistentes ou deprecated. Em cenários reais, invasores praticam *typosquatting*, registrando bibliotecas maliciosas com os mesmos nomes inventados por LLMs em gerenciadores públicos (Maven Central ou npm).
2. **Métodos e Assinaturas Fictícias:** Sugestão de métodos utilitários que não existem no framework configurado (ex.: inventar métodos estáticos em `Instant` ou classes do Spring Boot).
3. **Falhas Críticas de Segurança (OWASP):** Modelos treinados em corpora abertos frequentemente reproduzem códigos vulneráveis que foram comuns no passado, como concatenação direta de strings em SQL (SQL Injection), falta de sanitização de inputs em páginas HTML (Cross-Site Scripting - XSS) ou supressão silenciosa de exceções (`catch (Exception e) {}`).

#### Salvaguardas Adotadas no FixTime
- **Proibição de Novas Dependências sem Justificativa:** Regra expressa em [AGENTS.md](file:///c:/Users/thiag/Documents/BootCamp/bootcamp3/AGENTS.md) impedindo os agentes de adicionar itens no `pom.xml` ou `package.json`.
- **Validação Automatizada por Compiladores:** Toda sugestão de código gerada foi obrigatoriamente compilada com tipagem estrita (Java 21 e TypeScript com `noImplicitAny`).
- **Testes de Segurança e Borda:** Escrita deliberada de testes unitários que testam injeção de parâmetros maliciosos, intervalos negativos e datas inválidas.

---

### Pilar 2: Vazamento de Dados, Privacidade e Riscos de Confidencialidade

#### O Perigo da Exposição de Contexto
A maioria dos modelos comerciais (Claude, OpenAI, Gemini) processa requisições em servidores em nuvem de fornecedores terceirizados. Se um desenvolvedor alimentar um prompt com dados reais de clientes, chaves de API, senhas de banco de dados ou segredos de infraestrutura, esses dados transitam para fora do perímetro corporativo e podem:
- Ser interceptados ou armazenados em logs de terceiros.
- Ser inadvertidamente utilizados no retreinamento futuro de modelos, criando o risco de vazamento involuntário para outros usuários do modelo.

#### Medidas de Conformidade Implementadas no Projeto
- **Isolamento de Segredos via `.env`:** Nenhuma credencial real é versionada. O repositório contém apenas `.env.example`.
- **Mascaramento e Dados Sintéticos:** Todos os testes e dados de semente utilizam nomes fictícios ("Carlos Silva", "Maria Oliveira"), telefones no padrão de documentação e e-mails de domínio reservado `@example.com` (RFC 2606), em estrita conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/2018).
- **Diretriz nos Arquivos de Governança:** O arquivo `AGENTS.md` contém a regra explícita: *"Nunca incluir segredos ou dados pessoais reais"*.

---

### Pilar 3: Propriedade Intelectual (IP) e Direitos Autorais do Código Gerado

#### A Zona Cinzenta Jurídica dos Modelos Generativos
Os conjuntos de dados utilizados no treinamento de grandes modelos de linguagem (LLMs) incluem bilhões de linhas de código de repositórios públicos na internet, muitos deles sob licenças restritivas (como GPLv2, GPLv3, AGPL) ou com restrições expressas de autoria. Isso levanta questões éticas e jurídicas severas:
1. **Contaminação por Copyleft:** Se um modelo reproduzir um trecho substancial de código licenciado sob GPL sem a devida atribuição, a inclusão desse trecho em um produto proprietário pode teoricamente obrigar a empresa a abrir o código-fonte de toda a solução.
2. **Titularidade da Criação:** Em diversas jurisdições internacionais, códigos ou obras criadas exclusivamente por sistemas autônomos de IA não são passíveis de registro de direito autoral em nome da IA, pertencendo à esfera de domínio público ou exigindo autoria humana comprovada.

#### Diretriz Adotada pela Equipe
- No FixTime, os agentes foram orientados a **nunca gerar blocos complexos de código sem fundamentação em bibliotecas padrão**.
- A propriedade intelectual das decisões de design, da arquitetura em camadas e da especificação técnica formal (SDD) pertence aos membros humanos da equipe. O código gerado pela IA foi tratado como rascunho de implementação de algoritmos de domínio público (verificação de intervalos de tempo, CRUDs relacionais e componentes visuais).

---

### Pilar 4: A Centralidade e Obrigatoriedade da Homologação e Revisão Humana no Fluxo SDD

#### O Risco do "Viés de Automação" (Automation Bias)
O maior perigo no uso de ferramentas como Copilot, Cursor ou Antigravity é a complacência cognitiva do desenvolvedor humano: a tendência psicológica de presumir que, porque um código foi gerado por um modelo de última geração com sintaxe fluida e elegante, ele está necessariamente correto e seguro.

Em software crítico — como sistemas de agendamento operacional com regras de antecedência mínima, jornadas comerciais e prevenção de sobreposição de técnicos — **um erro lógico sutil pode paralisar a operação de uma empresa inteira**.

```
                ┌──────────────────────────────────────────────┐
                │        O Paradoxo da IA no Software          │
                └──────────────────────┬───────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌──────────────────────────────┐             ┌──────────────────────────────┐
│  O que a IA Faz com Maestria │             │ Onde a IA Falha Silenciosamente│
├──────────────────────────────┤             ├──────────────────────────────┤
│ • Gera sintaxe limpa         │             │ • Compreensão de contexto real│
│ • Escreve código repetitivo  │             │ • Julgamento ético de negócio │
│ • Converte DTOs e entidades  │             │ • Implicações de segurança   │
│ • Sugere estruturas de teste │             │ • Trade-offs de longo prazo  │
└──────────────────────────────┘             └──────────────────────────────┘
                                       │
                                       ▼
                       ┌────────────────────────────────┐
                       │ Exigência Inegociável:         │
                       │ HOMOLOGAÇÃO HUMANA OBRIGATÓRIA │
                       │    (Code Review + Testes)      │
                       └────────────────────────────────┘
```

#### O Fluxo SDD como Garantia de Qualidade Humana
A metodologia **Spec-Driven Development** adotada no FixTime inverte a relação convencional:
1. **O Humano Especifica:** O grupo definiu as personas, as regras `RN01` a `RN08` e os contratos JSON antes de qualquer comando de IA.
2. **A IA Auxilia na Implementação:** O agente atua dentro da caixa delimitada pela especificação, gerando código e testes rastreáveis.
3. **O Humano Audita e Homologa:**
   - Todo código passou por `mvn test` e `npm test`.
   - Todo PR foi inspecionado linha por linha por ao menos um membro da equipe em revisão por pares.
   - Nenhuma issue foi movida para `Done` sem aprovação humana formal.

---

## 4. Conclusão e Diretrizes Éticas Consolidadas

A experiência da Entrega 2 demonstrou que agentes de IA representam um salto de produtividade sem precedentes na história do desenvolvimento de software, reduzindo tarefas repetitivas de dias para horas. No entanto, sua eficácia depende diretamente do rigor metodológico da equipe.

Como diretrizes éticas definitivas para projetos de software colaborativos, consolidamos:

1. **A Especificação é Soberana:** A IA nunca deve tomar decisões sobre o comportamento de negócio sem instrução prévia no documento de especificação.
2. **Zero Confiança Cega:** Nenhum código gerado é mergeado sem validação automatizada em ambiente padronizado (Docker/Test Harness) e aprovação em Code Review humano.
3. **Privacidade por Padrão:** Proteção irrestrita de dados e segredos contra envio a modelos de terceiros.
4. **Transparência de Autoria:** Reconhecimento claro do papel da IA no desenvolvimento, assumindo com responsabilidade humana a entrega e a integridade final do produto.
