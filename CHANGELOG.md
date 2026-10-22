# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste arquivo, no formato
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto segue
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-10-22

Primeira release oficial do FixTime: plataforma de agendamento de visitas técnicas,
com backend Spring Boot, frontend React/Vite e empacotamento reprodutível via Docker
Compose.

### Added

- Contrato e criação de agendamentos com cálculo de término a partir do serviço (#1, #2, #8).
- Padronização de respostas de erro JSON via `GlobalExceptionHandler` (#3).
- CRUD de clientes, técnicos e catálogo de serviços (#5, #6, #7, #41).
- Listagem de agendamentos com paginação, filtros e busca (#9, #59).
- Bloqueio de sobreposição de horário e consulta de disponibilidade do técnico (#10, #11).
- Bloqueio de feriados nacionais e indisponibilidades operacionais (#47).
- Fluxo de criação/nomeação e agenda operacional com ações de status (#15, #16).
- Exportação de agendamentos em CSV (RFC 4180 / UTF-8 BOM) e em PDF (#28, export-pdf).
- Cliente de API tipado no frontend e telas de agenda/cadastros (#40, #41).
- Documentação OpenAPI/Swagger UI (#43).
- Empacotamento reprodutível com Docker Compose (banco, backend e frontend) e perfil
  `test` para execução da suíte completa em um único comando (#20, #89, #90).
- Relatório de testes, roteiro de demonstração (`docs/DEMO.md`) e especificação
  As-Built v1.0.0 com rastreabilidade de RF/RN (#21, #81, #100, #101, #103, #104).
- Suíte de testes automatizados do backend (JUnit 5/MockMvc) e do frontend
  (Vitest/Testing Library) com cobertura JaCoCo e V8 (#17, #18, #54, #89, #90, #104).
- `CHANGELOG.md`, healthcheck do backend, `scripts/test.sh`/`scripts/test.ps1` e job de
  `docker compose build` na CI (#82).

### Changed

- Dependências do frontend fixadas para builds determinísticos no CI (#19, #55).
- Versão do Spring Boot alinhada na documentação (3.4.5) (#4, #53).
- Higienização de código, remoção de artefatos de build versionados e revisão de
  segurança (#80).
- Autenticação JWT e perfis de usuário avaliados e retirados do escopo da v1.0.0,
  documentados como trabalho futuro (#67, #98).
- `VITE_API_URL` passou a ser relativo (`/api/v1`) para evitar chamadas cross-origin
  ao backend quando servido via Nginx/Vite (#110).

### Fixed

- Colisão de datas dos testes de integração com feriados nacionais (#85).
- Rótulos de status e exibição da agenda de agendamentos.
- Método de repositório usado na consulta de disponibilidade (#11, #37).

[1.0.0]: https://github.com/Fixtime-Bootcamp/bootcamp3/releases/tag/v1.0.0
