// cypress-tracing-exemplo.js
// Exemplo de implementação de rastreamento distribuído no Cypress

// Importação da biblioteca OpenTelemetry para tracing
// Nota: Em um projeto real, você precisaria instalar essas dependências
const { context, propagation } = require('@opentelemetry/api');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { Resource } = require('@opentelemetry/resources');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Configuração do provedor de rastreamento
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'cypress-tests',
  }),
});

// Configuração do exportador Jaeger
const exporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
});

// Processador de spans em lote
provider.addSpanProcessor(new BatchSpanProcessor(exporter));

// Registro do provedor
provider.register();

// Registro de instrumentações automáticas
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});

// Obter um tracer para a aplicação
const tracer = provider.getTracer('cypress-tracer');

// Comandos personalizados do Cypress para tracing
Cypress.Commands.add('startTrace', (traceName) => {
  const currentSpan = tracer.startSpan(traceName);
  cy.wrap(currentSpan).as('currentSpan');
  
  // Adiciona headers de propagação para todas as requisições HTTP
  cy.intercept('*', (req) => {
    const carrier = {};
    propagation.inject(context.active(), carrier);
    Object.keys(carrier).forEach(key => {
      req.headers[key] = carrier[key];
    });
  });
  
  cy.log(`**[Tracing]** Iniciado trace: ${traceName}`);
});

Cypress.Commands.add('addEvent', (eventName, attributes = {}) => {
  cy.get('@currentSpan').then(span => {
    span.addEvent(eventName, attributes);
    cy.log(`**[Tracing]** Evento adicionado: ${eventName}`);
  });
});

Cypress.Commands.add('addSpan', (spanName, callback) => {
  cy.get('@currentSpan').then(parentSpan => {
    const ctx = context.active();
    const childSpan = tracer.startSpan(spanName, undefined, ctx);
    
    cy.wrap(childSpan).as('tempSpan');
    cy.log(`**[Tracing]** Iniciado span: ${spanName}`);
    
    callback();
    
    cy.get('@tempSpan').then(span => {
      span.end();
      cy.log(`**[Tracing]** Finalizado span: ${spanName}`);
    });
  });
});

Cypress.Commands.add('endTrace', () => {
  cy.get('@currentSpan').then(span => {
    span.end();
    cy.log(`**[Tracing]** Finalizado trace`);
  });
});

// Exemplo de teste com rastreamento distribuído
describe('Teste de Carrinho de Compras com Tracing Distribuído', () => {
  beforeEach(() => {
    // Inicia um trace para o teste
    cy.startTrace('teste-adicionar-ao-carrinho');
  });

  it('Deve adicionar um item ao carrinho e atualizar o inventário', () => {
    // Adiciona evento de navegação
    cy.addEvent('navegacao-iniciada', { page: 'home' });
    
    // Visita a página principal da loja
    cy.visit('/');
    
    // Adiciona evento de navegação concluída
    cy.addEvent('navegacao-concluida', { page: 'home', loadTime: performance.now() });
    
    // Cria um span para a busca de produto
    cy.addSpan('busca-produto', () => {
      cy.get('#search-input')
        .type('smartphone')
        .type('{enter}');
        
      cy.get('.product-list')
        .should('be.visible');
    });
    
    // Span para seleção de produto
    cy.addSpan('selecao-produto', () => {
      cy.get('.product-card')
        .first()
        .click();
        
      cy.get('.product-details')
        .should('be.visible');
    });
    
    // Span para adicionar ao carrinho
    cy.addSpan('adicionar-ao-carrinho', () => {
      // Intercepta a chamada ao serviço de carrinho
      cy.intercept('POST', '/api/cart').as('addToCart');
      
      // Intercepta a chamada ao serviço de inventário
      cy.intercept('PUT', '/api/inventory').as('updateInventory');
      
      // Clica no botão de adicionar ao carrinho
      cy.get('#add-to-cart-button').click();
      
      // Espera pelas respostas
      cy.wait('@addToCart').then(interception => {
        // Adiciona metadados do serviço de carrinho ao trace
        cy.addEvent('carrinho-atualizado', { 
          status: interception.response.statusCode,
          responseTime: interception.response.headers['x-response-time'],
          cartId: interception.response.body.cartId
        });
      });
      
      cy.wait('@updateInventory').then(interception => {
        // Adiciona metadados do serviço de inventário ao trace
        cy.addEvent('inventario-atualizado', { 
          status: interception.response.statusCode,
          responseTime: interception.response.headers['x-response-time'],
          newStock: interception.response.body.currentStock
        });
      });
      
      // Verifica se o item foi adicionado ao carrinho
      cy.get('.cart-notification')
        .should('contain', 'Item adicionado ao carrinho');
    });
    
    // Span para verificar o carrinho
    cy.addSpan('verificar-carrinho', () => {
      cy.get('#cart-icon').click();
      
      cy.get('.cart-items')
        .should('have.length', 1);
        
      cy.get('.cart-total')
        .should('be.visible');
    });
    
    // Adiciona evento para finalização do teste
    cy.addEvent('teste-concluido', { 
      success: true, 
      executionTime: performance.now()
    });
  });
  
  afterEach(() => {
    // Finaliza o trace
    cy.endTrace();
  });
});

// Configuração para lidar com erros e adicioná-los ao trace
Cypress.on('fail', (error, runnable) => {
  cy.get('@currentSpan').then(span => {
    span.recordException({
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    span.setStatus({
      code: 'ERROR',
      message: `Teste falhou: ${error.message}`
    });
    
    span.end();
  });
  
  throw error; // Re-lança o erro para que o Cypress o trate normalmente
}); 