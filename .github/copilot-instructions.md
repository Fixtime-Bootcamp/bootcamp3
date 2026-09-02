# Contexto do FixTime

Considere `docs/specification.md` como fonte de verdade. Preserve a arquitetura Controller -> Service -> Repository e escreva testes para toda regra de negocio alterada.

Antes de implementar, identifique o requisito atendido. Depois, execute a menor validacao relevante. Prefira alteracoes pequenas, DTOs para contratos HTTP, validacao Bean Validation e respostas de erro padronizadas. Nao implemente autenticacao, pagamentos ou notificacoes nesta fase.
