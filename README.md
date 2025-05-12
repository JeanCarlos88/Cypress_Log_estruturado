# Exemplo de Logs Estruturados e Rastreamento Distribuído com Cypress

Este projeto demonstra como implementar logs estruturados e rastreamento distribuído (distributed tracing) usando Cypress.

## Características

- Logs categorizados por tipo (Navegação, Formulário, Ação, Validação, etc.)
- Timestamps em cada execução de teste
- Screenshots automáticos após cada teste
- Relatórios detalhados usando Mochawesome
- Logs organizados e filtráveis
- **Rastreamento distribuído** para visualizar o fluxo completo de requisições
- **Captura de spans e eventos** para depuração avançada de microsserviços

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Para suporte ao rastreamento distribuído, instale pacotes adicionais:
```bash
npm install @opentelemetry/api @opentelemetry/sdk-trace-node @opentelemetry/exporter-jaeger @opentelemetry/instrumentation @opentelemetry/instrumentation-http @opentelemetry/resources @opentelemetry/semantic-conventions
```

## Executando os Testes

Para abrir o Cypress em modo interativo:
```bash
npm run cy:open
```

Para executar os testes em modo headless e gerar relatórios:
```bash
npm run cy:run
```

## Estrutura dos Logs

Os logs são organizados nas seguintes categorias:

- **[Navegação]**: Ações de navegação entre páginas
- **[Formulário]**: Interações com formulários
- **[Ação]**: Cliques e interações do usuário
- **[Dados]**: Dados inseridos nos campos
- **[Validação]**: Verificações e asserções
- **[Resultado]**: Resultados das validações

## Relatórios

Os relatórios são gerados na pasta `cypress/reports` e incluem:
- Screenshots de cada teste
- Logs estruturados
- Métricas de execução
- Gráficos de sucesso/falha

## Rastreamento Distribuído

O projeto agora inclui suporte avançado para rastreamento distribuído (distributed tracing), permitindo visualizar o fluxo completo de requisições através de múltiplos serviços.

### Conceitos-chave

- **Trace**: Representa a jornada completa de uma requisição através de todo o sistema distribuído.
- **Span**: Representa uma unidade de trabalho dentro de um trace (ex: uma chamada HTTP, operação de banco de dados).
- **Contexto**: Informações propagadas entre serviços para correlacionar spans corretamente.

### Comandos Personalizados

O projeto fornece comandos personalizados para rastreamento:

- `cy.startTrace(traceName)`: Inicia um novo trace
- `cy.addEvent(eventName, attributes)`: Adiciona um evento ao span atual
- `cy.addSpan(spanName, callback)`: Cria um novo span para uma operação específica
- `cy.addAttribute(key, value)`: Adiciona um atributo ao span atual
- `cy.markSpanError(message, error)`: Marca um span como contendo erro
- `cy.endTrace()`: Finaliza o trace atual

### Visualização dos Traces

Os traces podem ser visualizados em ferramentas como:
- Jaeger UI (http://localhost:16686)
- Zipkin
- Datadog APM
- New Relic
- Dynatrace

### Configuração do Coletor de Traces

Para visualizar os traces, execute um coletor como o Jaeger:

```bash
docker run -d --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 14250:14250 \
  -p 9411:9411 \
  jaegertracing/all-in-one:latest
```

### Benefícios

- Visualização do caminho completo da requisição
- Identificação de gargalos de performance
- Isolamento rápido da causa raiz de falhas
- Compreensão das dependências entre serviços
- Depuração avançada de microsserviços 