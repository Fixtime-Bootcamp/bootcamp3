# Diretrizes de agentes

## Fluxo obrigatorio

1. Ler `docs/specification.md` antes de alterar comportamento.
2. Propor um plano curto e obter revisao no Pull Request.
3. Implementar uma unidade pequena e testavel.
4. Executar testes automatizados.
5. Registrar mudancas da especificacao quando necessario.
6. Submeter PR para revisao humana.

## Regras tecnicas

- Backend em Java 21 e Spring Boot.
- Regras de negocio ficam em services, nunca em controllers.
- Endpoints usam `/api/v1`.
- Erros devem ter resposta JSON consistente.
- Nao adicionar dependencias sem justificar no PR.
- Testes devem cobrir o caminho feliz e edge cases.
- Nunca incluir segredos ou dados pessoais reais.

## Papel da IA

O GitHub Copilot pode auxiliar na exploracao, implementacao e criacao de testes. A equipe continua responsavel por requisitos, revisao, seguranca, qualidade e aprovacao do merge.
