# Exemplo de Logs Estruturados com Cypress

Este projeto demonstra como implementar logs estruturados e relatórios detalhados usando Cypress.

## Características

- Logs categorizados por tipo (Navegação, Formulário, Ação, Validação, etc.)
- Timestamps em cada execução de teste
- Screenshots automáticos após cada teste
- Relatórios detalhados usando Mochawesome
- Logs organizados e filtráveis

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
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