describe('Exemplo de Logs Estruturados', () => {
  beforeEach(() => {
    // Log do início do teste com timestamp
    cy.log(`**Iniciando teste em: ${new Date().toLocaleString('pt-BR')}**`)
  })

  it('Deve fazer login com sucesso', () => {
    // Log de categoria: Navegação
    cy.log('**[Navegação]** Acessando página de login')
    cy.visit('/login')

    // Log de categoria: Formulário
    cy.log('**[Formulário]** Preenchendo campos de login')
    cy.get('[data-cy=username]')
      .type('testuser@example.com')
      .then(() => {
        cy.log('**[Dados]** Username inserido: testuser@example.com')
      })

    cy.get('[data-cy=password]')
      .type('password123')
      .then(() => {
        cy.log('**[Dados]** Senha inserida: ********')
      })

    // Log de categoria: Ação
    cy.log('**[Ação]** Clicando no botão de login')
    cy.get('[data-cy=login-button]').click()

    // Log de categoria: Validação
    cy.log('**[Validação]** Verificando login bem-sucedido')
    cy.get('[data-cy=success-message]')
      .should('be.visible')
      .then(($el) => {
        const texto = $el.text()
        cy.log(`**[Resultado]** Mensagem de sucesso encontrada: "${texto}"`)
      })
  })

  it('Deve validar campos obrigatórios', () => {
    // Log de categoria: Navegação
    cy.log('**[Navegação]** Acessando página de login')
    cy.visit('/login')

    // Log de categoria: Ação
    cy.log('**[Ação]** Tentando login sem preencher campos')
    cy.get('[data-cy=login-button]').click()

    // Log de categoria: Validação
    cy.log('**[Validação]** Verificando mensagens de erro')
    cy.get('[data-cy=error-message]')
      .should('have.length.gt', 0)
      .then(($errors) => {
        const erros = []
        $errors.each((i, el) => {
          erros.push(el.innerText)
        })
        cy.log(`**[Resultado]** Erros encontrados:\n${erros.join('\n')}`)
      })
  })

  afterEach(() => {
    // Capturando screenshots após cada teste
    cy.screenshot()
    
    // Log do fim do teste com timestamp
    cy.log(`**Finalizando teste em: ${new Date().toLocaleString('pt-BR')}**`)
  })
}) 