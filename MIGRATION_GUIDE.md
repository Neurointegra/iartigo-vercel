# 🚀 **Guia de Migração - Frontend para Nova API Python**

Este documento descreve as mudanças realizadas no frontend para alinhar com a nova estrutura de endpoints da API Python.

## 📋 **Resumo das Mudanças**

### **1. Estrutura de Endpoints Atualizada**
- ✅ **Antes**: Endpoints antigos como `/api/external-articles/`
- ✅ **Agora**: Novos endpoints conforme documentação: `/api/article-generations/`, `/api/plans/`, `/api/subscriptions/`

### **2. Autenticação JWT Implementada**
- ✅ **Antes**: Sem autenticação ou token estático
- ✅ **Agora**: Autenticação JWT com `Authorization: Bearer <token>`

### **3. Actions Centralizadas e Tipadas**
- ✅ **Antes**: Funções espalhadas e sem tipagem
- ✅ **Agora**: Actions centralizadas em `app/actions.ts` e `app/plans-actions.ts`

### **4. Configuração Centralizada**
- ✅ **Antes**: Variáveis de ambiente espalhadas
- ✅ **Agora**: Arquivo `app/config.ts` centralizado

## 🔧 **Arquivos Modificados**

### **Arquivos Principais**
1. **`app/actions.ts`** - Actions para geração de artigos
2. **`app/plans-actions.ts`** - Actions para planos e assinaturas (NOVO)
3. **`app/config.ts`** - Configuração centralizada (NOVO)
4. **`app/generator/page.tsx`** - Página do gerador atualizada
5. **`app/plans/page.tsx`** - Página de planos atualizada

### **Arquivos de Componentes**
1. **`components/PlansButton.tsx`** - Já estava funcional
2. **`components/PaymentModal.tsx`** - Já estava funcional
3. **`components/PlanChangeModal.tsx`** - Já estava funcional

## 📝 **Detalhes das Mudanças**

### **1. Actions de Geração de Artigos (`app/actions.ts`)**

#### **Antes:**
```typescript
export async function generateArticle(data: ArticleData): Promise<string> {
  // Usava endpoint antigo e token estático
  const response = await fetch('/api/external-articles/create', {
    headers: {
      'Authorization': process.env.NEXT_PUBLIC_API_TOKEN || '',
    },
  })
}
```

#### **Agora:**
```typescript
export async function generateArticle(data: ArticleData, authToken: string): Promise<ArticleGenerationResponse> {
  // Usa nova API com autenticação JWT
  const response = await fetch(buildApiUrl('/article-generations/'), {
    headers: getAuthHeaders(authToken),
  })
}
```

#### **Novas Funções Adicionadas:**
- `checkArticleStatus()` - Verificar status da geração
- `downloadArticle()` - Download do artigo gerado
- `getMyGenerations()` - Listar minhas gerações
- `cancelGeneration()` - Cancelar geração

### **2. Actions de Planos e Assinaturas (`app/plans-actions.ts`)**

#### **Novo arquivo com funções para:**
- **Planos**: `getPlans()`, `getPopularPlans()`, `getPlansByType()`, `getPlanById()`
- **Assinaturas**: `createSubscription()`, `getMySubscription()`, `cancelSubscription()`, `changePlan()`
- **Pagamentos**: `getMyPayments()`, `createPaymentLink()`

### **3. Configuração Centralizada (`app/config.ts`)**

#### **Funções úteis:**
```typescript
// Construir URLs da API
export const buildApiUrl = (endpoint: string): string => {
  return `${config.apiBaseUrl}${endpoint}`
}

// Headers de autenticação
export const getAuthHeaders = (token: string): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}
```

### **4. Página do Gerador (`app/generator/page.tsx`)**

#### **Mudanças Principais:**
- ✅ Usa nova API `generateArticle()` em vez de endpoint antigo
- ✅ Implementa polling com `checkArticleStatus()`
- ✅ Download automático com `downloadArticle()`
- ✅ Validação de token JWT
- ✅ Tratamento de erros melhorado

#### **Antes:**
```typescript
const response = await fetch('/api/external-articles/create', {
  method: 'POST',
  body: formDataToSend,
})
```

#### **Agora:**
```typescript
const result = await generateArticle(articleData, user.token)
```

### **5. Página de Planos (`app/plans/page.tsx`)**

#### **Mudanças Principais:**
- ✅ Carrega planos dinamicamente da API
- ✅ Usa nova estrutura de dados dos planos
- ✅ Integração com `createSubscription()`
- ✅ Loading states e tratamento de erros

#### **Antes:**
```typescript
const plans: Plan[] = [
  // Planos hardcoded
]
```

#### **Agora:**
```typescript
const [plans, setPlans] = useState<Plan[]>([])
useEffect(() => {
  const loadPlans = async () => {
    const plansData = await getPlans()
    setPlans(plansData)
  }
  loadPlans()
}, [])
```

## 🔄 **Fluxo de Geração de Artigos Atualizado**

### **1. Validação e Preparação**
```typescript
// Validar token JWT
if (!user.token) {
  toast({
    title: "Token de autenticação necessário",
    description: "Faça login novamente para gerar artigos",
    variant: "destructive",
  })
  return
}
```

### **2. Geração do Artigo**
```typescript
// Preparar dados para nova API
const articleData = {
  title: formData.title,
  abstract: formData.resume || '',
  keywords: formData.keywords || '',
  // ... outros campos
}

// Chamar nova API
const result = await generateArticle(articleData, user.token)
```

### **3. Monitoramento de Status**
```typescript
// Polling com nova API
const result = await checkArticleStatus(generationId, user.token)
if (result.generation.status === 'completed') {
  // Download automático
  const blob = await downloadArticle(generationId, user.token)
}
```

## 🔐 **Autenticação JWT**

### **Headers Obrigatórios:**
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${user.token}`,
}
```

### **Validação de Token:**
```typescript
if (!user.token) {
  // Redirecionar para login ou mostrar erro
  return
}
```

## 📊 **Estrutura de Dados Atualizada**

### **Planos (Antes vs Agora):**
```typescript
// ANTES
interface Plan {
  id: string
  price: number
  articlesLimit: number | null
}

// AGORA
interface Plan {
  id: number
  monthly_price: string
  articles_per_month: number
  is_unlimited: boolean
  plan_type: string
  is_popular: boolean
}
```

### **Geração de Artigos (Antes vs Agora):**
```typescript
// ANTES
interface ArticleRequest {
  requestId: number
  localId: string
  status: string
}

// AGORA
interface ArticleRequest {
  id: number
  request_id: number
  status: string
  api_status: string
}
```

## 🚨 **Pontos de Atenção**

### **1. Variáveis de Ambiente**
Certifique-se de que estas variáveis estão configuradas:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_ASAAS_API_URL=https://sandbox.asaas.com/api/v3
NEXT_PUBLIC_ASAAS_ACCESS_TOKEN=your_token
```

### **2. Token JWT**
O usuário deve ter um token JWT válido para:
- Gerar artigos
- Acessar planos
- Gerenciar assinaturas

### **3. Endpoints da API**
Todos os endpoints agora seguem o padrão:
```
http://localhost:8000/api/{endpoint}/
```

## ✅ **Testes Recomendados**

### **1. Teste de Autenticação**
- ✅ Login e obtenção de token JWT
- ✅ Validação de token em endpoints protegidos
- ✅ Redirecionamento para login quando token inválido

### **2. Teste de Geração de Artigos**
- ✅ Criação de artigo com dados válidos
- ✅ Monitoramento de status
- ✅ Download automático quando concluído
- ✅ Tratamento de erros

### **3. Teste de Planos e Assinaturas**
- ✅ Carregamento de planos da API
- ✅ Criação de assinatura
- ✅ Validação de CPF
- ✅ Integração com pagamentos

## 🔮 **Próximos Passos**

### **1. Integração com Asaas**
- Implementar webhooks de pagamento
- Sincronização de status de pagamentos
- Criação de links de pagamento

### **2. Melhorias de UX**
- Indicadores de progresso mais detalhados
- Notificações em tempo real
- Histórico de gerações

### **3. Testes Automatizados**
- Testes unitários para actions
- Testes de integração com API
- Testes E2E para fluxos principais

## 📚 **Recursos Adicionais**

- **Documentação da API**: `API_ENDPOINTS.md`
- **Exemplo de Migração**: `API_MIGRATION_README.md`
- **Configuração**: `app/config.ts`
- **Actions**: `app/actions.ts` e `app/plans-actions.ts`

---

**🎉 Frontend migrado com sucesso para a nova API Python!**

Para dúvidas ou problemas, consulte a documentação da API ou entre em contato com a equipe de desenvolvimento.
