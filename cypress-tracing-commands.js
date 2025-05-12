// cypress/support/commands/tracing-commands.js
// Comandos personalizados para rastreamento distribuído no Cypress

// Importações necessárias
const { context, propagation, trace } = require('@opentelemetry/api');

/**
 * Inicializa um novo trace para um teste
 * @param {string} traceName - Nome do trace
 * @param {Object} attributes - Atributos adicionais para o trace
 */
Cypress.Commands.add('startTrace', (traceName, attributes = {}) => {
  // Obter o tracer da configuração global
  const tracer = Cypress.config('_tracer');
  
  if (!tracer) {
    cy.log('**[Aviso]** Tracer não configurado. Configure-o em cypress/plugins/index.js');
    return;
  }
  
  // Atributos padrão para todos os traces
  const defaultAttributes = {
    'cypress.test.title': Cypress.currentTest.title,
    'cypress.test.fullTitle': Cypress.currentTest.titlePath.join(' > '),
    'cypress.browser': Cypress.browser.name,
    'cypress.viewport': `${Cypress.config('viewportWidth')}x${Cypress.config('viewportHeight')}`,
    'cypress.timestamp': new Date().toISOString(),
    ...attributes
  };
  
  // Criar um novo span para o trace
  const currentSpan = tracer.startSpan(traceName, {
    attributes: defaultAttributes
  });
  
  // Armazenar o span atual para uso futuro
  cy.wrap(currentSpan).as('currentSpan');
  
  // Configurar interceptação para todas as requisições HTTP
  cy.intercept('**', (req) => {
    // Injetar cabeçalhos de trace nas requisições HTTP
    const carrier = {};
    propagation.inject(trace.setSpan(context.active(), currentSpan), carrier);
    
    // Adicionar cabeçalhos à requisição
    Object.keys(carrier).forEach(key => {
      req.headers[key] = carrier[key];
    });
    
    // Registrar a requisição no trace
    currentSpan.addEvent('http.request', {
      'http.url': req.url,
      'http.method': req.method,
      'http.headers': JSON.stringify(req.headers)
    });
  });
  
  cy.log(`**[Tracing]** Trace iniciado: ${traceName}`);
});

/**
 * Adiciona um evento ao span atual
 * @param {string} eventName - Nome do evento
 * @param {Object} attributes - Atributos do evento
 */
Cypress.Commands.add('addEvent', (eventName, attributes = {}) => {
  cy.get('@currentSpan').then(span => {
    // Adicionar timestamp ao evento
    const eventAttributes = {
      'timestamp': new Date().toISOString(),
      ...attributes
    };
    
    span.addEvent(eventName, eventAttributes);
    cy.log(`**[Tracing]** Evento adicionado: ${eventName}`);
  });
});

/**
 * Cria um novo span para uma operação específica
 * @param {string} spanName - Nome do span
 * @param {Function} callback - Função contendo as operações do span
 * @param {Object} attributes - Atributos adicionais para o span
 */
Cypress.Commands.add('addSpan', (spanName, callback, attributes = {}) => {
  cy.get('@currentSpan').then(parentSpan => {
    const tracer = Cypress.config('_tracer');
    
    // Criar um novo span filho do span atual
    const ctx = trace.setSpan(context.active(), parentSpan);
    const childSpan = tracer.startSpan(spanName, {
      attributes: attributes
    }, ctx);
    
    // Armazenar o span filho temporariamente
    cy.wrap(childSpan).as('tempSpan');
    
    cy.log(`**[Tracing]** Span iniciado: ${spanName}`);
    
    try {
      // Executar as operações do span
      callback();
      
      // Finalizar o span após a conclusão das operações
      cy.get('@tempSpan').then(span => {
        span.end();
        cy.log(`**[Tracing]** Span finalizado: ${spanName}`);
      });
    } catch (error) {
      // Registrar o erro no span em caso de falha
      cy.get('@tempSpan').then(span => {
        span.recordException({
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        span.setStatus({
          code: 'ERROR',
          message: error.message
        });
        
        span.end();
        cy.log(`**[Tracing]** Span finalizado com erro: ${spanName}`);
      });
      
      throw error;
    }
  });
});

/**
 * Adiciona um atributo ao span atual
 * @param {string} key - Chave do atributo
 * @param {any} value - Valor do atributo
 */
Cypress.Commands.add('addAttribute', (key, value) => {
  cy.get('@currentSpan').then(span => {
    span.setAttribute(key, value);
    cy.log(`**[Tracing]** Atributo adicionado: ${key}=${value}`);
  });
});

/**
 * Marca o span atual com um status de erro
 * @param {string} message - Mensagem de erro
 * @param {Error} error - Objeto de erro opcional
 */
Cypress.Commands.add('markSpanError', (message, error = null) => {
  cy.get('@currentSpan').then(span => {
    if (error) {
      span.recordException({
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    span.setStatus({
      code: 'ERROR',
      message: message
    });
    
    cy.log(`**[Tracing]** Span marcado com erro: ${message}`);
  });
});

/**
 * Finaliza o trace atual
 */
Cypress.Commands.add('endTrace', () => {
  cy.get('@currentSpan').then(span => {
    // Adicionar evento de finalização
    span.addEvent('trace.end', {
      'timestamp': new Date().toISOString()
    });
    
    // Finalizar o span
    span.end();
    cy.log(`**[Tracing]** Trace finalizado`);
  });
}); 