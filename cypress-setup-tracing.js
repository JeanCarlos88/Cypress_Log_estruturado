// cypress/plugins/tracing-setup.js
// Configuração do rastreamento distribuído para Cypress

const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor, BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { FetchInstrumentation } = require('@opentelemetry/instrumentation-fetch');

/**
 * Configura o rastreamento distribuído para os testes Cypress
 * @param {Object} cypressConfig - Configuração do Cypress
 * @param {Object} options - Opções de configuração do rastreamento
 * @returns {Object} - Configuração atualizada do Cypress
 */
function setupTracing(cypressConfig, options = {}) {
  // Configuração padrão
  const config = {
    serviceName: options.serviceName || 'cypress-tests',
    serviceVersion: options.serviceVersion || '1.0.0',
    environment: options.environment || process.env.NODE_ENV || 'test',
    
    // Tipo de exportador (jaeger, zipkin, otlp)
    exporterType: options.exporterType || 'jaeger',
    
    // Configuração do exportador Jaeger
    jaeger: {
      endpoint: options.jaegerEndpoint || 'http://localhost:14268/api/traces',
    },
    
    // Configuração do exportador Zipkin
    zipkin: {
      url: options.zipkinUrl || 'http://localhost:9411/api/v2/spans',
    },
    
    // Configuração do exportador OTLP (OpenTelemetry Protocol)
    otlp: {
      url: options.otlpUrl || 'http://localhost:4318/v1/traces',
    },
    
    // Uso de processador em lote ou simples
    batchProcessing: options.batchProcessing !== false,
    
    // Outros metadados para adicionar a todos os traces
    metadata: options.metadata || {},
  };
  
  console.log(`[Tracing] Configurando rastreamento distribuído para serviço '${config.serviceName}'`);
  
  // Criar recurso com metadados do serviço
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
    ...config.metadata,
  });
  
  // Criar provedor de rastreamento
  const provider = new NodeTracerProvider({
    resource: resource,
  });
  
  // Configurar o exportador com base no tipo selecionado
  let exporter;
  
  switch (config.exporterType.toLowerCase()) {
    case 'jaeger':
      console.log(`[Tracing] Usando exportador Jaeger: ${config.jaeger.endpoint}`);
      exporter = new JaegerExporter(config.jaeger);
      break;
      
    case 'zipkin':
      console.log(`[Tracing] Usando exportador Zipkin: ${config.zipkin.url}`);
      exporter = new ZipkinExporter(config.zipkin);
      break;
      
    case 'otlp':
      console.log(`[Tracing] Usando exportador OTLP: ${config.otlp.url}`);
      exporter = new OTLPTraceExporter(config.otlp);
      break;
      
    default:
      console.warn(`[Tracing] Tipo de exportador desconhecido: ${config.exporterType}. Usando Jaeger como padrão.`);
      exporter = new JaegerExporter(config.jaeger);
  }
  
  // Adicionar processador ao provedor (batch ou simples)
  if (config.batchProcessing) {
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  } else {
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  }
  
  // Registrar o provedor
  provider.register();
  
  // Registrar instrumentações automáticas
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new FetchInstrumentation(),
    ],
  });
  
  // Obter o tracer
  const tracer = provider.getTracer(config.serviceName);
  
  // Adicionar o tracer à configuração do Cypress para uso posterior
  cypressConfig._tracer = tracer;
  console.log('[Tracing] Rastreamento distribuído configurado com sucesso');
  
  return cypressConfig;
}

/**
 * Função para configurar o rastreamento no arquivo de plugins do Cypress
 */
module.exports = (on, config, options = {}) => {
  // Configurar rastreamento
  config = setupTracing(config, options);
  
  // Adicionar evento para limpar recursos ao finalizar todos os testes
  on('after:run', async (results) => {
    console.log('[Tracing] Finalizando recursos de rastreamento...');
    // Aguardar um pouco para garantir que todos os spans sejam enviados
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
  
  return config;
}; 