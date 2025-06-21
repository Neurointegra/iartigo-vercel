# Configuração de Produtos iArtigo na Hotmart

## 📋 Estratégia de Produtos

### 🔄 Produto 1: iArtigo Pro (ASSINATURA)
\`\`\`
Tipo: Assinatura
Nome: iArtigo Pro - Geração de Artigos Científicos
Preço: R$ 79,00/mês
Descrição: Acesso completo à plataforma com 5 artigos por mês
Entrega: Acesso à área de membros online
Recorrência: Mensal
\`\`\`

### 🔄 Produto 2: iArtigo Pro Anual (ASSINATURA)
\`\`\`
Tipo: Assinatura
Nome: iArtigo Pro - Plano Anual (2 meses grátis)
Preço: R$ 790,00/ano
Descrição: 12 meses de acesso + 2 meses de bônus
Entrega: Acesso à área de membros online
Recorrência: Anual
\`\`\`

### 🛠️ Produto 3: iArtigo Avulso (SERVIÇOS ONLINE)
\`\`\`
Tipo: Serviços Online de Consultoria
Nome: iArtigo - Geração de 1 Artigo Científico
Preço: R$ 15,00
Descrição: Geração de 1 artigo científico completo
Entrega: Acesso temporário (7 dias) + arquivo final
Recorrência: Pagamento único
\`\`\`

### 🔄 Produto 4: iArtigo Institucional (ASSINATURA)
\`\`\`
Tipo: Assinatura
Nome: iArtigo Institucional - Licença Empresarial
Preço: R$ 199,00/mês
Descrição: Artigos ilimitados + 10 usuários
Entrega: Acesso à área de membros empresarial
Recorrência: Mensal
\`\`\`

## 🎨 Configuração Detalhada

### Para ASSINATURA:
1. **Área de Membros:** Sim
2. **Conteúdo:** Acesso à plataforma iArtigo
3. **Duração:** Enquanto ativo
4. **Cancelamento:** Automático pela Hotmart
5. **Reativação:** Permitida

### Para SERVIÇOS ONLINE:
1. **Entrega:** Link de acesso + instruções
2. **Prazo:** 7 dias de acesso
3. **Suporte:** Incluído
4. **Garantia:** 7 dias
5. **Recompra:** Permitida

## 🔗 Integração Técnica

### URLs de Configuração:
\`\`\`
Área de Membros: https://iartigo.com/dashboard
Página de Sucesso: https://iartigo.com/payment/success
Página de Cancelamento: https://iartigo.com/payment/cancel
Webhook: https://iartigo.com/api/hotmart/webhook
Suporte: https://iartigo.com/support
\`\`\`

### Dados para Webhook:
\`\`\`javascript
// Estrutura esperada do webhook Hotmart
{
  "event": "PURCHASE_COMPLETE",
  "data": {
    "product": {
      "id": "PRODUTO_ID",
      "name": "iArtigo Pro"
    },
    "buyer": {
      "email": "usuario@email.com",
      "name": "Nome do Usuario"
    },
    "purchase": {
      "transaction": "HP123456789",
      "status": "COMPLETE",
      "price": 79.00
    }
  }
}
