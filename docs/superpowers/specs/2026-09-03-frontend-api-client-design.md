# Design: cliente frontend para a API do FixTime

## Contexto

O frontend atual renderiza apenas o estado visual inicial da agenda e ainda não possui tipos de domínio, cliente HTTP ou integração com os endpoints do backend. Esta demanda atende às Issues 1 e 3, que definem os contratos de domínio e o formato padronizado de erros.

## Requisitos atendidos

- RF01, RF02 e RF03: representar clientes, técnicos e serviços no cliente.
- RF05: consultar e representar agendamentos.
- RNF01: consumir endpoints versionados em `/api/v1`.
- RNF02: interpretar respostas JSON de erro padronizadas.
- RNF03 e RNF05: adicionar testes automatizados do cliente e dos estados da interface.

## Decisão de arquitetura

Será criado um módulo HTTP centralizado em `frontend/src/api/`. Ele será responsável por:

1. Resolver a URL base pela variável `VITE_API_URL`, com fallback para `/api/v1`.
2. Executar requisições com `fetch`.
3. Serializar o corpo das requisições.
4. Converter respostas não bem-sucedidas em um erro de aplicação tipado.
5. Expor funções orientadas aos recursos, sem espalhar URLs ou detalhes de transporte pelos componentes.

Os tipos públicos ficarão em `frontend/src/types/`, separados dos componentes. O hook `useAppointments` ficará responsável pelo estado de consulta da agenda (`loading`, `success`, `error` e `data`), enquanto a camada API permanecerá independente de React e será testável isoladamente.

O frontend não validará regras de negócio como antecedência mínima, horário comercial ou sobreposição. Ele apenas valida a forma mínima necessária para montar uma requisição e apresenta a decisão retornada pela API.

## Tipos e contratos

Serão definidos os seguintes tipos:

- `Customer`: identificador, nome, contato e estado ativo, conforme o DTO disponibilizado pela API.
- `Technician`: identificador, nome e estado ativo.
- `Service`: identificador, nome, duração, preço e estado ativo.
- `Appointment`: identificador, referências de cliente/técnico/serviço, início, fim e status.
- `CreateAppointmentInput`: referências e início da visita; incluirá `durationMinutes` porque o backend atual exige esse campo no payload.
- `ApiErrorResponse`: `timestamp`, `status`, `error`, `message` e `fieldErrors` opcional.
- `ApiError`: erro normalizado com código, mensagem e erros por campo opcionais.

Datas serão transportadas como strings ISO-8601. A conversão para `Date` não será feita na camada HTTP, evitando efeitos de fuso horário e mantendo o contrato transparente.

## Endpoints consumidos

O cliente usará os seguintes caminhos relativos à URL base:

- `GET /customers`
- `GET /technicians`
- `GET /services`
- `GET /appointments`
- `POST /appointments`

O módulo de recursos não conhecerá a origem completa da API; essa responsabilidade ficará no cliente HTTP comum.

## Estados da interface

O hook de agenda iniciará com `loading: true`, `data: []` e `error: null`. Em caso de sucesso, deverá expor os agendamentos e `loading: false`. Em caso de falha, deverá expor `loading: false`, preservar uma lista segura e disponibilizar uma mensagem derivada de `ApiError`.

O shell atual será adaptado para renderizar explicitamente:

- estado de carregamento;
- estado de erro para validação, conflito e demais erros conhecidos;
- estado de sucesso vazio;
- estado de sucesso com dados.

O componente não decidirá se uma visita é válida ou conflitante; apenas exibirá a mensagem e, quando disponível, os erros dos campos.

## Mapeamento de erros

O cliente HTTP considerará qualquer status fora de `2xx` como erro e mapeará os códigos do backend:

| Código da API | Tratamento no frontend |
| --- | --- |
| `VALIDATION_FAILED` | mensagem geral e `fieldErrors` para os campos |
| `CONFLICT` | mensagem de conflito de agenda |
| `BUSINESS_RULE_VIOLATION` | mensagem de regra de negócio |
| `BAD_REQUEST` | mensagem de requisição inválida |
| `NOT_FOUND` | recurso não encontrado |
| `MALFORMED_JSON` | corpo inválido |
| desconhecido ou sem JSON | erro genérico baseado no status |

Falhas de rede e respostas sem corpo JSON serão normalizadas sem expor stack trace ou detalhes internos.

## Testes

Serão adicionados testes com `fetch` mockado, cobrindo:

1. resposta de sucesso ao listar agendamentos;
2. resposta `400` com `VALIDATION_FAILED` e erros de campos;
3. resposta `409` com `CONFLICT`;
4. estado de loading enquanto a requisição está pendente;
5. transição para sucesso após a resolução;
6. transição para erro após rejeição ou resposta não bem-sucedida;
7. uso da variável `VITE_API_URL` pelo cliente HTTP.

Os testes da API serão independentes dos componentes. O teste do hook/componente verificará somente a transição de estados e a apresentação, não regras do domínio.

## Configuração e operação

Será incluído `VITE_API_URL` no `.env.example`, com valor local compatível com o backend. A configuração será lida em tempo de build pelo Vite. Nenhum segredo será adicionado ao repositório.

## Fora de escopo

- Implementar ou alterar endpoints backend.
- Reproduzir no frontend regras de agenda, preço, disponibilidade ou transição de status.
- Autenticação, pagamentos, notificações ou persistência local.
- Criar uma biblioteca global de estado para além do hook necessário à agenda.

## Critérios de conclusão

- Tipos de todos os recursos definidos e usados nos contratos da API.
- Nenhum componente contém URL ou chamada HTTP direta.
- URL configurável por `VITE_API_URL`.
- Loading, sucesso e erro visíveis e testados.
- Erros padronizados convertidos para um formato único.
- Testes de sucesso, validação, conflito e loading aprovados.
- Build do frontend aprovado.
