# Integração Hotmart - iArtigo

## 🚀 Migração do Green para Hotmart

A migração do sistema de pagamentos foi realizada com sucesso, substituindo o gateway **Green** pelo **Hotmart**. O Hotmart oferece mais recursos para produtos digitais e melhor integração com afiliados.

## 📋 Arquivos Criados/Modificados

### ✅ Novos arquivos:
- `lib/hotmart-client.ts` - Cliente da API Hotmart
- `app/api/hotmart/create-payment/route.ts` - Criar checkout
- `app/api/hotmart/check-payment/route.ts` - Verificar transação
- `app/api/hotmart/webhook/route.ts` - Processar webhooks
- `scripts/test-hotmart-integration.js` - Script de testes
- `.env.example.hotmart` - Exemplo de configuração

### 🔄 Arquivos modificados:
- `app/payment/page.tsx` - Atualizado para Hotmart

## 🛠️ Configuração

### 1. Variáveis de Ambiente
Copie o arquivo `.env.example.hotmart` para `.env.local` e configure:

```bash
# Credenciais (obtenha no painel Hotmart)
HOTMART_CLIENT_ID=seu_client_id
HOTMART_CLIENT_SECRET=seu_client_secret
HOTMART_WEBHOOK_TOKEN=seu_webhook_token

# Códigos das ofertas (crie no painel)
HOTMART_OFFER_PER_ARTICLE=IARTIGO_ARTICLE
HOTMART_OFFER_PROFESSIONAL_MONTHLY=IARTIGO_PRO_MONTHLY
HOTMART_OFFER_PROFESSIONAL_YEARLY=IARTIGO_PRO_YEARLY
HOTMART_OFFER_INSTITUTIONAL=IARTIGO_INSTITUTIONAL
```

### 2. Configurar Ofertas no Hotmart
1. Acesse o **Painel do Hotmart**
2. Vá em **Produtos > Criar Produto**
3. Configure os planos:
   - **Por Artigo**: R$ 15,00 (pagamento único)
   - **Profissional Mensal**: R$ 79,00/mês
   - **Profissional Anual**: R$ 790,00/ano
   - **Institucional**: R$ 1.999,00/ano

### 3. Configurar Webhook
1. No painel Hotmart, vá em **Desenvolvedor > Webhook**
2. Configure a URL: `https://seudominio.com/api/hotmart/webhook`
3. Marque os eventos:
   - `PURCHASE_COMPLETE`
   - `PURCHASE_CANCELED` 
   - `PURCHASE_REFUNDED`
   - `SUBSCRIPTION_CANCELLATION`

## 🧪 Testes

### Executar script de teste:
```bash
cd scripts
node test-hotmart-integration.js
```

### Testar endpoints manualmente:
```bash
# Criar pagamento
curl -X POST http://localhost:3000/api/hotmart/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "professional",
    "billing_cycle": "monthly",
    "customer": {
      "name": "João Teste",
      "email": "joao@teste.com"
    }
  }'

# Verificar transação
curl "http://localhost:3000/api/hotmart/check-payment?transaction_id=TXN123"
```

## 🔄 Fluxo de Pagamento

### 1. Frontend → API
```typescript
const response = await fetch('/api/hotmart/create-payment', {
  method: 'POST',
  body: JSON.stringify({
    plan_id: 'professional',
    billing_cycle: 'monthly',
    customer: { name, email }
  })
})
```

### 2. API → Hotmart
- Autentica via OAuth2
- Cria checkout com código da oferta
- Retorna URL de pagamento

### 3. Hotmart → Webhook
- Notifica mudanças de status
- Processa eventos automaticamente
- Ativa/desativa planos conforme necessário

## 📊 Eventos do Webhook

| Evento | Ação |
|--------|------|
| `PURCHASE_COMPLETE` | Ativar plano do usuário |
| `PURCHASE_CANCELED` | Desativar plano |
| `PURCHASE_REFUNDED` | Processar reembolso |
| `SUBSCRIPTION_CANCELLATION` | Cancelar assinatura |

## 🔒 Segurança

- **OAuth2** para autenticação
- **HMAC SHA256** para validação de webhook
- **Tokens temporários** (1 hora de duração)
- **Validação de assinatura** em todos os webhooks

## 🆚 Vantagens vs Green

### ✅ Hotmart:
- Especializado em produtos digitais
- Sistema de afiliados integrado
- Checkout otimizado
- Suporte a assinaturas nativo
- Analytics avançado
- Suporte brasileiro

### ❌ Green (anterior):
- Gateway genérico
- Sem sistema de afiliados
- Configuração mais complexa

## 🚀 Deploy

### 1. Vercel
```bash
# Configurar variáveis no painel Vercel
vercel env add HOTMART_CLIENT_ID
vercel env add HOTMART_CLIENT_SECRET
# ... outras variáveis

# Deploy
vercel --prod
```

### 2. Webhook URL
Após deploy, configure no Hotmart:
```
https://seudominio.vercel.app/api/hotmart/webhook
```

## 📝 TODO

- [ ] Implementar persistência no banco de dados
- [ ] Integrar sistema de emails
- [ ] Configurar analytics
- [ ] Testes automatizados
- [ ] Painel administrativo
- [ ] Relatórios financeiros

## 🆘 Troubleshooting

### Erro de autenticação:
- Verifique `HOTMART_CLIENT_ID` e `HOTMART_CLIENT_SECRET`
- Confirme se as credenciais estão ativas

### Webhook não funciona:
- Teste a URL manualmente
- Verifique `HOTMART_WEBHOOK_TOKEN`
- Confirme configuração no painel

### Oferta não encontrada:
- Verifique códigos das ofertas
- Confirme se estão publicadas no Hotmart

## 📞 Suporte

- **Documentação Hotmart**: https://developers.hotmart.com
- **Painel do Hotmart**: https://app.hotmart.com
- **Suporte técnico**: Abrir ticket no painel
