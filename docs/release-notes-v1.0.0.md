# FixTime v1.0.0

Primeira release oficial do FixTime — plataforma de agendamento de visitas técnicas
para pequenas e médias assistências técnicas, com backend Spring Boot, frontend
React/Vite e empacotamento totalmente reprodutível via Docker Compose.

## Como rodar

```bash
git clone https://github.com/Fixtime-Bootcamp/bootcamp3.git
cd bootcamp3
cp .env.example .env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8080/api/v1
- Swagger UI: http://localhost:8080/swagger-ui.html
- Health check: http://localhost:8080/api/v1/health

Testes (backend + frontend, comando único):

```bash
./scripts/test.sh        # Linux/macOS/Git Bash
./scripts/test.ps1       # Windows PowerShell
```

## Added

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
- Empacotamento reprodutível com Docker Compose e perfil `test` para a suíte completa
  em um único comando (#20, #89, #90).
- Relatório de testes, roteiro de demonstração e especificação As-Built v1.0.0 com
  rastreabilidade de RF/RN (#21, #81, #100, #101, #103, #104).
- Suíte de testes automatizados do backend (JUnit 5/MockMvc) e do frontend
  (Vitest/Testing Library) com cobertura JaCoCo e V8 (#17, #18, #54, #89, #90, #104).
- `CHANGELOG.md`, healthcheck do backend, scripts de teste e job de `docker compose
  build` na CI (#82).

## Changed

- Dependências do frontend fixadas para builds determinísticos no CI (#19, #55).
- Versão do Spring Boot alinhada na documentação (3.4.5) (#4, #53).
- Higienização de código e revisão de segurança (#80).
- Autenticação JWT e perfis de usuário retirados do escopo da v1.0.0 (#67, #98).
- `VITE_API_URL` passou a ser relativo para evitar chamadas cross-origin (#110).

## Fixed

- Colisão de datas dos testes de integração com feriados nacionais (#85).
- Rótulos de status e exibição da agenda de agendamentos.
- Método de repositório usado na consulta de disponibilidade (#11, #37).

Changelog completo: [CHANGELOG.md](../CHANGELOG.md).

---

**Comando `gh` para publicar (alternativa à interface do GitHub):**

```bash
gh release create v1.0.0 --title "v1.0.0" --notes-file docs/release-notes-v1.0.0.md
```
