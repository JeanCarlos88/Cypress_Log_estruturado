# Rastreamento Distribuído (Distributed Tracing) com Cypress

Este repositório contém um exemplo prático de implementação de rastreamento distribuído (distributed tracing) em testes Cypress, permitindo visualizar e analisar o fluxo completo de requisições através de uma arquitetura de microsserviços.

## O que é Rastreamento Distribuído?

O rastreamento distribuído é uma técnica de observabilidade que permite acompanhar o fluxo de uma requisição à medida que ela atravessa diferentes serviços em uma arquitetura distribuída. Ele fornece uma visão unificada da jornada completa da requisição, facilitando a identificação de gargalos de performance e a causa raiz de falhas.

## Conceitos-chave

- **Trace**: Representa a jornada completa de uma única requisição através de todo o sistema distribuído.
- **Span**: Representa uma unidade de trabalho dentro de um trace (por exemplo, uma chamada HTTP, uma operação de banco de dados).
- **Contexto**: Informações que são propagadas entre serviços para garantir que os spans sejam correlacionados corretamente.

## Implementação no Cypress

O exemplo neste repositório demonstra como:

1. **Iniciar e finalizar traces** para cada teste Cypress
2. **Criar spans** para operações específicas dentro do teste
3. **Adicionar eventos e metadados** aos spans para enriquecer a telemetria
4. **Propagar o contexto do trace** para os serviços back-end
5. **Capturar exceções** e adicionar informações de falha ao trace

## Comandos Personalizados

O exemplo define quatro comandos personalizados do Cypress:

- `cy.startTrace(traceName)`: Inicia um novo trace com o nome especificado
- `cy.addEvent(eventName, attributes)`: Adiciona um evento ao span atual
- `cy.addSpan(spanName, callback)`: Cria um novo span para uma operação específica
- `cy.endTrace()`: Finaliza o trace atual

## Exemplo de Uso

```javascript
describe('Teste com Tracing', () => {
  beforeEach(() => {
    cy.startTrace('meu-teste');
  });

  it('deve realizar uma operação', () => {
    cy.addSpan('login-usuario', () => {
      cy.visit('/login');
      cy.get('#username').type('usuario');
      cy.get('#password').type('senha');
      cy.get('#login-button').click();
    });
    
    cy.addEvent('login-sucesso', { userId: '12345' });
  });

  afterEach(() => {
    cy.endTrace();
  });
});
```

## Benefícios do Rastreamento Distribuído em Testes Cypress

1. **Visualização do Caminho Completo**: Veja todos os serviços envolvidos no processamento de uma requisição.
2. **Identificação de Gargalos**: Descubra quais serviços estão demorando mais para responder.
3. **Isolamento da Causa Raiz**: Determine exatamente qual serviço e qual operação causou uma falha.
4. **Correlação com Logs**: Correlacione spans com logs gerados pelos serviços.
5. **Compreensão de Dependências**: Visualize as dependências entre diferentes serviços.

## Configuração Necessária

Para usar este exemplo, você precisará:

1. Instalar as dependências do OpenTelemetry:
```bash
npm install @opentelemetry/api @opentelemetry/sdk-trace-node @opentelemetry/exporter-jaeger @opentelemetry/instrumentation @opentelemetry/instrumentation-http @opentelemetry/resources @opentelemetry/semantic-conventions
```

2. Configurar um coletor de traces como Jaeger, Zipkin ou uma solução de APM

3. Instrumentar seus serviços back-end para participar no mesmo trace

## Visualização dos Traces

Após a execução dos testes, os traces podem ser visualizados em ferramentas como:

- Jaeger UI
- Zipkin
- Datadog APM
- New Relic
- Dynatrace

## Conclusão

O rastreamento distribuído é uma ferramenta poderosa para depuração e análise de performance em sistemas distribuídos. Ao integrá-lo aos seus testes Cypress, você obtém uma visibilidade sem precedentes do comportamento do seu sistema, facilitando a identificação e resolução de problemas.

---

Este exemplo foi criado como complemento ao artigo "A Profundidade do Rastreamento Distribuído no Contexto de Testes Cypress". 