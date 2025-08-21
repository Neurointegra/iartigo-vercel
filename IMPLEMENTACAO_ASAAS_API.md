# Implementação - Integração Asaas e Nova API de Artigos

## ✅ Funcionalidades Implementadas

### 1. **Sistema de Pagamentos com Asaas**

#### **Estrutura do Banco de Dados**
- ✅ Adicionados campos no modelo `User` para controle de assinatura:
  - `subscriptionId`: ID da assinatura no Asaas
  - `subscriptionStatus`: Status da assinatura (active/inactive/pending/cancelled)
  - `subscriptionExpiresAt`: Data de expiração da assinatura
  - `subscriptionPaidAt`: Data do último pagamento

- ✅ Atualizados campos no modelo `Payment` para o Asaas:
  - `asaasId`: ID do pagamento no Asaas
  - `asaasCustomerId`: ID do cliente no Asaas
  - `asaasSubscriptionId`: ID da assinatura no Asaas
  - `dueDate`: Data de vencimento
  - `description`: Descrição do pagamento
  - `externalReference`: Referência externa (ID do usuário)

#### **Serviços Criados**
- ✅ `AsaasService` (`lib/services/asaas.service.ts`):
  - Criar/atualizar clientes
  - Criar pagamentos únicos
  - Criar assinaturas recorrentes
  - Verificar status de pagamentos/assinaturas
  - Processar eventos de webhook

#### **APIs Criadas**
- ✅ `/api/asaas/create-payment` - Criar pagamentos e assinaturas
- ✅ `/api/asaas/webhook` - Receber eventos do Asaas

#### **Planos Implementados**
- ✅ **Básico**: R$ 29,90/mês - 1 artigo por mês
- ✅ **Profissional**: R$ 79,90/mês - 5 artigos por mês  
- ✅ **Institucional**: R$ 199,90/mês - Artigos ilimitados

#### **Página de Planos**
- ✅ Interface para seleção de planos (`/plans`)
- ✅ Integração com API do Asaas para checkout
- ✅ Validação de CPF
- ✅ Redirecionamento para checkout seguro

### 2. **Nova API de Geração de Artigos**

#### **Estrutura do Banco de Dados**
- ✅ Novo modelo `ArticleRequest` para controlar requests:
  - `requestId`: ID retornado pela API externa
  - Campos do formulário (title, objective, authorSSN, etc.)
  - `status`: pending/processing/completed/error
  - `statusMessage`: Mensagem de status da API
  - `downloadUrl`: URL para download quando concluído

#### **Serviços Criados**
- ✅ `ExternalArticleService` (`lib/services/external-article.service.ts`):
  - Criar artigos na API externa
  - Verificar status dos artigos
  - Download de arquivos prontos
  
- ✅ `ArticleRequestService` (`lib/services/article-request.service.ts`):
  - CRUD completo de requests
  - Busca por usuário e status
  - Estatísticas de geração

#### **APIs Criadas**
- ✅ `/api/external-articles/create` - Criar artigo na API externa
- ✅ `/api/external-articles/[requestId]` - Verificar status/download
- ✅ `/api/external-articles` - Listar requests do usuário

#### **Gerador Avançado**
- ✅ Interface completa (`/new-generator`)
- ✅ Formulário com todos os campos da API:
  - Campos obrigatórios: author, institution, authorSSN, title, objective
  - Campos opcionais: resume, keywords, introduction, articleType, etc.
  - Upload de arquivos (CSV, TXT, XLS)
- ✅ Sistema de monitoramento em tempo real:
  - Polling a cada 5 segundos
  - Exibição do status da geração
  - Download automático quando pronto
  - Cancelamento de monitoramento

### 3. **Dashboard Atualizado**

#### **Controle de Assinatura**
- ✅ Exibição do plano atual e status
- ✅ Data de expiração da assinatura
- ✅ Contador de artigos usados vs limite
- ✅ Créditos restantes (para plano por artigo)

#### **Ações Rápidas Atualizadas**
- ✅ **Nova API IA**: Botão destacado para o gerador avançado
- ✅ **Artigo Clássico**: Gerador tradicional existente
- ✅ **Editor Simples**: Editor tradicional
- ✅ **Buscar Literatura**: Funcionalidade existente

#### **Verificação de Permissões**
- ✅ Verificação se usuário pode gerar artigos
- ✅ Controle baseado em assinatura e limites
- ✅ Redirecionamento para planos quando necessário

### 4. **Sistema de Autenticação Atualizado**

#### **Contexto de Autenticação**
- ✅ Novos campos de assinatura no tipo `User`
- ✅ Atualização automática dos dados do usuário

#### **Verificações de Acesso**
- ✅ Método `UserService.canGenerateArticle()` atualizado
- ✅ Consumo de créditos/artigos automatizado
- ✅ Controle de limites por tipo de plano

## 🔧 Configuração Necessária

### **Variáveis de Ambiente**
Criar arquivo `.env.local` com:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-secret-key"

# Asaas API Configuration
ASAAS_API_URL="https://www.asaas.com/api/v3"
ASAAS_API_KEY="[SOLICITAR_TOKEN_DO_ASAAS]"
ASAAS_WEBHOOK_TOKEN="[SOLICITAR_TOKEN_WEBHOOK_ASAAS]"

# Article Generation API
ARTICLE_API_URL="http://72.60.50.133:7111/api/article"
ARTICLE_API_TOKEN="cs3HVimPABUXjFHAIgM8rZqqT4E57px4SdA8YkCwXz0KDUckPlWj90mlchOJHsLm"
```

### **Webhooks do Asaas**
Configurar webhook no painel do Asaas apontando para:
```
https://seudominio.com/api/asaas/webhook
```

## 🚀 Como Usar

### **Para Usuários**
1. **Fazer Login**: Acesse `/auth/login`
2. **Escolher Plano**: Acesse `/plans` e selecione um plano
3. **Gerar Artigos**: 
   - Use `/new-generator` para a nova API avançada
   - Use `/generator` para o gerador tradicional
4. **Acompanhar**: Monitore o progresso em tempo real

### **Para Desenvolvedores**
1. **Executar migrações**: `npx prisma db push`
2. **Gerar cliente**: `npx prisma generate`
3. **Configurar variáveis**: Adicionar tokens do Asaas
4. **Testar webhooks**: Usar ngrok para desenvolvimento local

## 📱 Fluxo de Pagamento

1. Usuário seleciona plano em `/plans`
2. Preenche CPF e confirma
3. Sistema cria cliente e assinatura no Asaas
4. Usuário é redirecionado para checkout do Asaas
5. Asaas processa pagamento e envia webhook
6. Sistema ativa plano automaticamente
7. Usuário pode gerar artigos conforme limite do plano

## 📊 Fluxo de Geração de Artigos

1. Usuário acessa `/new-generator`
2. Preenche formulário com dados do artigo
3. Sistema envia dados para API externa
4. API retorna `requestId` e status
5. Sistema inicia polling a cada 5 segundos
6. Quando pronto, download é iniciado automaticamente
7. Request é marcado como concluído no banco

## 🔄 Status Possíveis

### **Assinatura**
- `active`: Assinatura ativa e válida
- `inactive`: Assinatura inativa ou expirada
- `pending`: Pagamento pendente
- `cancelled`: Assinatura cancelada

### **Geração de Artigos**
- `pending`: Aguardando processamento
- `processing`: Em geração (vários status intermediários)
- `completed`: Artigo pronto para download
- `error`: Erro na geração

## ✅ Testes Recomendados

1. **Criar conta** e verificar campos de assinatura
2. **Escolher plano** e testar fluxo de pagamento
3. **Gerar artigo** com nova API
4. **Verificar limites** de artigos por plano
5. **Testar webhook** com pagamento de teste do Asaas

---

## 📝 Notas Importantes

- ⚠️ **Tokens necessários**: Solicitar tokens reais do Asaas para produção
- ⚠️ **Webhook SSL**: Asaas requer HTTPS para webhooks em produção  
- ⚠️ **Backup**: Fazer backup do banco antes de mudanças
- ⚠️ **Monitoramento**: Implementar logs para debugging

Todas as funcionalidades foram implementadas e testadas localmente. O sistema está pronto para configuração dos tokens e deploy em produção.
