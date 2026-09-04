# Contexto do FixTime para Agentes e Copilot

## Fonte de Verdade e Arquitetura
1. Considere `docs/specification.md` como fonte de verdade (SDD - Spec-Driven Development).
2. Preserve a arquitetura Controller -> Service -> Repository. Regras de negócio ficam exclusivamente na camada de Service.
3. Endpoints REST padronizados em `/api/v1` com DTOs para contratos e respostas de erro consistentes.
4. Escreva testes automatizados para toda regra de negócio alterada (caminho feliz e edge cases).
5. Não implemente autenticação, pagamentos ou notificações nesta fase (fora de escopo).

## Governança de Tarefas e Git
1. Toda tarefa deve estar mapeada em uma GitHub Issue vinculada ao GitHub Project `FixTime` (`1`).
2. Trabalhe em branch dedicada no formato `feature/issue-<numero>-<descricao-curta>`.
3. Ao concluir a implementação e testes, submeta Pull Request apontando para `develop` com `Closes #<numero-da-issue>`.
4. Garanta que a tarefa no GitHub Project transite para `In progress` no início e `Done` na conclusão.
