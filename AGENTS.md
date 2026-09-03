# Diretrizes de agentes

## Fluxo obrigatório de Governança e Tarefas (GitHub Issues & Projects)

Todo agente (GitHub Copilot, Cursor, Claude Code, Antigravity) deve seguir estritamente o fluxo de governança do projeto:

1. **Identificar ou Registrar a Tarefa**:
   - Antes de iniciar qualquer implementação, verifique se já existe uma Issue aberta correspondente (`gh issue list`).
   - Se for uma nova demanda, refatoração ou sub-tarefa, crie a Issue no repositório com as labels apropriadas (`epic:*`, `priority:*`, etc.) e associe-a ao projeto **FixTime** (Project `1`).
   - Mova o status da tarefa no Project para `In progress`.
2. **Trabalhar em Branch Isolada**:
   - Crie uma branch a partir de `develop` seguindo o padrão: `feature/issue-<numero>-<descricao-curta>` (ex: `feature/issue-1-contrato-agendamento`).
   - **Nunca faça commits diretos na `main` ou `develop`**.
3. **Desenvolvimento Guiado por Especificação (SDD)**:
   - Leia `docs/specification.md` antes de alterar qualquer comportamento.
   - Implemente unidades pequenas e testáveis.
   - Regras de negócio ficam exclusivamente na camada de **service**, nunca em controllers.
4. **Validação Automatizada Obrigatória**:
   - Execute a suíte de testes antes de submeter (`cd backend && mvn test` e/ou `cd frontend && npm test`).
5. **Finalização e Transição para Done**:
   - Abra um Pull Request apontando para `develop` contendo a descrição das mudanças e referenciando `Closes #<numero-da-issue>`.
   - Atualize o status da task no GitHub Project para `In review`.
   - Após a aprovação e merge do PR, garanta que a task no GitHub Project passe para **`Done`** e a issue seja fechada.

## Comandos Úteis para Agentes (GitHub CLI)

- **Listar tarefas do repositório / projeto:**
  ```bash
  gh issue list
  gh project item-list 1 --owner Fixtime-Bootcamp
  ```
- **Criar nova issue e vincular ao Projeto:**
  ```bash
  gh issue create --title "<titulo>" --body "<descricao e criterios>" --label "epic:backend,priority:P0,backend"
  gh project item-add 1 --owner Fixtime-Bootcamp --url <issue-url>
  ```
- **Fechar issue manualmente (caso não fechada via PR):**
  ```bash
  gh issue close <numero> --comment "Concluído conforme critérios de aceite."
  ```

## Regras técnicas

- Backend em Java 21 e Spring Boot.
- Regras de negócio ficam em services, nunca em controllers.
- Endpoints usam `/api/v1`.
- Erros devem ter resposta JSON consistente.
- Não adicionar dependências sem justificar no PR.
- Testes devem cobrir o caminho feliz e edge cases.
- Nunca incluir segredos ou dados pessoais reais.

## Papel da IA

O uso de agentes de IA (Copilot, Cursor, Antigravity, Claude Code) é encorajado para exploração, implementação iterativa e criação de testes seguindo o fluxo SDD. A equipe humana permanece responsável pelos requisitos, revisão de código (code review), segurança, qualidade e aprovação final de merges.
