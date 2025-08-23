# 🚀 Migração para API Python - IArtigo

Este documento descreve as mudanças necessárias para migrar do sistema de API local para o novo servidor Python.

## 📋 **O que foi alterado**

### 1. **Configuração Centralizada**
- Criado `lib/api-config.ts` com todos os endpoints da nova API
- Configuração centralizada de URLs e headers
- Funções helper para autenticação e requisições

### 2. **Sistema de Autenticação**
- **Antes**: Cookies HTTP e sessões locais
- **Agora**: JWT tokens armazenados no localStorage
- **Simplificado**: Apenas JWT Token (sem API_TOKEN)

### 3. **Banco de Dados**
- **Antes**: Prisma + MySQL local
- **Agora**: Apenas API Python (sem banco local)

### 4. **Endpoints Atualizados**
- Todas as chamadas `/api/*` agora apontam para o servidor Python
- Formato de dados adaptado para a nova API
- Headers de autenticação simplificados

## 🔧 **Configuração Necessária**

### **Variáveis de Ambiente**
Crie um arquivo `.env.local` na raiz do projeto:

```bash
# URL do servidor Python
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Outras configurações (se necessário)
NEXT_PUBLIC_ASAAS_API_URL=https://sandbox.asaas.com/api/v3
NEXT_PUBLIC_ASAAS_ACCESS_TOKEN=your_asaas_token_here
```

### **Servidor Python**
Certifique-se de que o servidor Python está rodando e acessível na URL configurada.

## 📝 **Arquivos Modificados**

### **Principais Mudanças**
1. **`lib/auth-context.tsx`** - Sistema de autenticação JWT
2. **`lib/api-config.ts`** - Configuração centralizada da API
3. **`app/actions.ts`** - Endpoints de geração de artigos
4. **`app/actions-new.ts`** - Endpoints de geração de artigos (versão nova)

### **Arquivos Removidos**
- **`prisma/`** - Schema e migrações do banco
- **`lib/services/`** - Serviços locais de banco de dados
- **`lib/database.ts`** - Configuração do Prisma

### **Arquivos que precisam ser atualizados**
- `app/admin/page.tsx` - Endpoints de usuários e artigos
- `app/generator/page.tsx` - Geração de artigos externos
- `app/plans/page.tsx` - Criação de pagamentos
- `app/dashboard/page.tsx` - Artigos externos
- `app/article/[id]/page.tsx` - CRUD de artigos
- `app/plans/manage/page.tsx` - Gerenciamento de assinaturas

## 🔐 **Sistema de Autenticação**

### **Login**
```typescript
// Antes (cookies)
const response = await fetch('/api/auth/login', {
  credentials: 'include',
  // ...
})

// Agora (JWT)
const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
  method: 'POST',
  body: JSON.stringify({ email, password }),
})
localStorage.setItem('jwt_token', data.access)
```

### **Verificação de Autenticação**
```typescript
// Antes
const response = await fetch('/api/auth/me', {
  credentials: 'include',
})

// Agora
const token = localStorage.getItem('jwt_token')
if (token) {
  const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.PROFILE, {}, token)
}
```

### **Headers de Autenticação**
```typescript
// Endpoints públicos (sem autenticação)
headers: {
  'Content-Type': 'application/json'
}

// Endpoints privados (com JWT)
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`
}
```

## 📊 **Endpoints Principais**

### **Autenticação (Públicos)**
- `POST /api/auth/login/` - Login de usuário
- `POST /api/auth/register/` - Registro de usuário

### **Autenticação (Privados)**
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/profile/` - Perfil do usuário

### **Geração de Artigos (Privados)**
- `POST /api/article-generations/` - Criar geração
- `GET /api/article-generations/my_generations/` - Minhas gerações
- `POST /api/article-generations/{id}/check_status/` - Verificar status
- `GET /api/article-generations/{id}/download/` - Download do artigo

### **Usuários e Planos (Privados)**
- `GET /api/users/me/` - Meu perfil
- `GET /api/plans/` - Listar planos
- `POST /api/subscriptions/` - Criar assinatura

## ⚠️ **Pontos de Atenção**

### **1. Endpoints não implementados**
- Processamento de gráficos (`/api/process-chart`)
- Listagem de imagens (`/api/list-images`)

### **2. Formato de dados**
- A API Python espera campos específicos (ex: `ssn` em vez de `cpf`)
- **Campo de confirmação**: `password_confirm` (não `password_confirmation`)
- Alguns campos podem ter nomes diferentes
- Verificar a documentação da API para cada endpoint

### **3. Tratamento de erros**
- A nova API retorna erros em formato diferente
- Implementar tratamento de erros adequado
- Verificar códigos de status HTTP

### **4. URLs dos endpoints**
- **Corrigido**: Endpoints agora usam `/api` na função `apiRequest`
- **Antes**: Duplicação de `/api/api/` causava erro 401
- **Agora**: URLs corretas como `http://localhost:8000/api/auth/register/`

### **5. Autenticação simplificada**
- **Removido**: API_TOKEN (não é mais necessário)
- **Mantido**: Apenas JWT Token para endpoints privados
- **Endpoints públicos**: Não requerem autenticação

## 🚀 **Próximos Passos**

### **1. Configurar variáveis de ambiente**
```bash
cp env.example .env.local
# Editar .env.local com suas configurações
```

### **2. Testar autenticação**
- Verificar se o login está funcionando
- Testar registro de usuários
- Verificar se os tokens JWT estão sendo armazenados

### **3. Atualizar endpoints restantes**
- Seguir o padrão estabelecido em `api-config.ts`
- Usar as funções helper `apiRequest` e `createAuthHeaders`
- Adaptar formatos de dados conforme necessário

### **4. Testar funcionalidades principais**
- Geração de artigos
- Gerenciamento de usuários
- Sistema de pagamentos
- Dashboard e relatórios

### **5. Limpeza final**
- Remover dependências do Prisma do package.json
- Executar `npm install` para limpar dependências
- Verificar se não há imports de serviços locais

## 📞 **Suporte**

Para dúvidas ou problemas:
1. Verificar logs do servidor Python
2. Confirmar configuração das variáveis de ambiente
3. Verificar se o servidor está rodando e acessível
4. Consultar a documentação da API em `API_ENDPOINTS.md`

---

**🎯 Objetivo**: Migrar completamente para a nova API Python mantendo todas as funcionalidades existentes.
