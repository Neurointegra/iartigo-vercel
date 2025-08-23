# 🚀 **Documentação Completa da API - IArtigo Backend**

Esta documentação descreve todos os endpoints disponíveis na API, incluindo exemplos de requests, responses e códigos de status.

## 📋 **Informações Gerais**

### **Base URL**
```
http://localhost:8000/api/
```

### **Autenticação**
A API utiliza **autenticação JWT**:
- **JWT Token** no header `Authorization: Bearer <token>` (para endpoints que requerem usuário logado)
- **Endpoints públicos** (como registro e login) não requerem autenticação

### **Headers Obrigatórios**
```http
Content-Type: application/json
```

### **Headers para Usuários Autenticados**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 🔐 **ENDPOINTS DE AUTENTICAÇÃO**

### **1. Registro de Usuário**
```http
POST /api/auth/register/
```

**Request:**
```json
{
    "username": "joao_silva",
    "email": "joao.silva@email.com",
    "password": "senha123",
    "password_confirm": "senha123",
    "first_name": "João",
    "last_name": "Silva",
    "ssn": "123.456.789-00",
    "institution": "Universidade de São Paulo",
    "position": "Professor"
}
```

**Nota:** Este endpoint é público e não requer autenticação.

**Response (201 Created):**
```json
{
    "id": 1,
    "username": "joao_silva",
    "email": "joao.silva@email.com",
    "first_name": "João",
    "last_name": "Silva",
    "ssn": "123.456.789-00",
    "institution": "Universidade de São Paulo",
    "position": "Professor",
    "date_joined": "2024-01-15T10:30:00Z"
}
```

---

### **2. Login de Usuário**
```http
POST /api/auth/login/
```

**Request:**
```json
{
    "email": "joao.silva@email.com",
    "password": "senha123"
}
```

**Nota:** Este endpoint é público e não requer autenticação.

**Response (200 OK):**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "username": "joao_silva",
        "email": "joao.silva@email.com",
        "first_name": "João",
        "last_name": "Silva",
        "ssn": "123.456.789-00",
        "institution": "Universidade de São Paulo",
        "position": "Professor"
    }
}
```

---

### **3. Refresh Token**
```http
POST /api/auth/refresh/
```

**Request:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

### **4. Logout**
```http
POST /api/auth/logout/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
    "message": "Successfully logged out"
}
```

---

### **5. Perfil do Usuário**
```http
GET /api/auth/profile/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
    "id": 1,
    "username": "joao_silva",
    "email": "joao.silva@email.com",
    "first_name": "João",
    "last_name": "Silva",
    "ssn": "123.456.789-00",
    "institution": "Universidade de São Paulo",
    "position": "Professor",
    "date_joined": "2024-01-15T10:30:00Z"
}
```

---

### **6. Atualizar Perfil**
```http
PUT /api/auth/update-profile/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
    "first_name": "João Pedro",
    "last_name": "Silva Santos",
    "institution": "Universidade Federal de São Paulo",
    "position": "Professor Adjunto"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "username": "joao_silva",
    "email": "joao.silva@email.com",
    "first_name": "João Pedro",
    "last_name": "Silva Santos",
    "ssn": "123.456.789-00",
    "institution": "Universidade Federal de São Paulo",
    "position": "Professor Adjunto",
    "date_joined": "2024-01-15T10:30:00Z"
}
```

---

## 👥 **ENDPOINTS DE USUÁRIOS**

### **7. Listar Usuários (Apenas Staff)**
```http
GET /api/users/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Nota:** Apenas usuários staff podem listar todos os usuários. Usuários comuns só veem seu próprio perfil.

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "username": "joao_silva",
        "email": "joao.silva@email.com",
        "first_name": "João",
        "last_name": "Silva",
        "ssn": "123.456.789-00",
        "institution": "Universidade de São Paulo",
        "position": "Professor"
    }
]
```

---

### **8. Detalhes do Usuário**
```http
GET /api/users/{id}/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Nota:** Usuários comuns só podem ver seu próprio perfil.

**Response (200 OK):**
```json
{
    "id": 1,
    "username": "joao_silva",
    "email": "joao.silva@email.com",
    "first_name": "João",
    "last_name": "Silva",
    "ssn": "123.456.789-00",
    "institution": "Universidade de São Paulo",
    "position": "Professor",
    "date_joined": "2024-01-15T10:30:00Z"
}
```

---

### **9. Meu Perfil**
```http
GET /api/users/me/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
    "id": 1,
    "username": "joao_silva",
    "email": "joao.silva@email.com",
    "first_name": "João",
    "last_name": "Silva",
    "ssn": "123.456.789-00",
    "institution": "Universidade de São Paulo",
    "position": "Professor",
    "date_joined": "2024-01-15T10:30:00Z"
}
```

---

### **10. Atualizar Meu Perfil**
```http
PUT /api/users/me/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
    "first_name": "João Pedro",
    "last_name": "Silva Santos",
    "institution": "Universidade Federal de São Paulo",
    "position": "Professor Adjunto"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "username": "joao_silva",
    "email": "joao.silva@email.com",
    "first_name": "João Pedro",
    "last_name": "Silva Santos",
    "ssn": "123.456.789-00",
    "institution": "Universidade Federal de São Paulo",
    "position": "Professor Adjunto"
}
```

---

## 📋 **ENDPOINTS DE PLANOS DE ASSINATURA**

### **11. Listar Planos**
```http
GET /api/plans/
```

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "name": "Estudante",
        "plan_type": "student",
        "description": "Plano ideal para estudantes",
        "monthly_price": "29.90",
        "articles_per_month": 5,
        "is_popular": false,
        "is_active": true,
        "features": ["Acesso básico", "Suporte por email"],
        "articles_display": "5 per month",
        "is_unlimited": false
    },
    {
        "id": 2,
        "name": "Pesquisador",
        "plan_type": "researcher",
        "description": "Plano para pesquisadores",
        "monthly_price": "59.90",
        "articles_per_month": 15,
        "is_popular": true,
        "is_active": true,
        "features": ["Acesso completo", "Suporte prioritário", "Relatórios avançados"],
        "articles_display": "15 per month",
        "is_unlimited": false
    }
]
```

---

### **12. Planos Populares**
```http
GET /api/plans/popular/
```

**Response (200 OK):**
```json
[
    {
        "id": 2,
        "name": "Pesquisador",
        "plan_type": "researcher",
        "description": "Plano para pesquisadores",
        "monthly_price": "59.90",
        "articles_per_month": 15,
        "is_popular": true,
        "is_active": true,
        "features": ["Acesso completo", "Suporte prioritário", "Relatórios avançados"]
    }
]
```

---

### **13. Planos por Tipo**
```http
GET /api/plans/by-type/?type=student
```

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "name": "Estudante",
        "plan_type": "student",
        "description": "Plano ideal para estudantes",
        "monthly_price": "29.90",
        "articles_per_month": 5,
        "is_popular": false,
        "is_active": true,
        "features": ["Acesso básico", "Suporte por email"]
    }
]
```

---

### **14. Detalhes do Plano**
```http
GET /api/plans/{id}/
```

**Response (200 OK):**
```json
{
    "id": 2,
    "name": "Pesquisador",
    "plan_type": "researcher",
    "description": "Plano para pesquisadores",
    "monthly_price": "59.90",
    "articles_per_month": 15,
    "is_popular": true,
    "is_active": true,
    "features": ["Acesso completo", "Suporte prioritário", "Relatórios avançados"]
}
```

---

## 🔗 **ENDPOINTS DE ASSINATURAS**

### **15. Criar Assinatura**
```http
POST /api/subscriptions/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
    "plan": 2,
    "auto_renew": true
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "user": 1,
    "plan": 2,
    "status": "active",
    "start_date": "2024-01-15T10:30:00Z",
    "end_date": "2024-02-15T10:30:00Z",
    "next_due_date": "2024-02-15",
    "auto_renew": true,
    "articles_used_this_month": 0,
    "asaas_customer_id": "cus_123456",
    "asaas_subscription_id": "sub_789012"
}
```

---

### **16. Minha Assinatura Ativa**
```http
GET /api/subscriptions/my-subscription/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "plan": {
        "id": 2,
        "name": "Pesquisador",
        "plan_type": "researcher",
        "monthly_price": "59.90",
        "articles_per_month": 15
    },
    "status": "active",
    "start_date": "2024-01-15T10:30:00Z",
    "end_date": "2024-02-15T10:30:00Z",
    "next_due_date": "2024-02-15",
    "auto_renew": true,
    "articles_used_this_month": 3
}
```

---

### **17. Histórico de Assinaturas**
```http
GET /api/subscriptions/history/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "plan": {
            "id": 2,
            "name": "Pesquisador"
        },
        "status": "active",
        "start_date": "2024-01-15T10:30:00Z",
        "end_date": "2024-02-15T10:30:00Z",
        "created_at": "2024-01-15T10:30:00Z"
    }
]
```

---

### **18. Cancelar Assinatura**
```http
POST /api/subscriptions/{id}/cancel/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
    "reason": "Mudança de plano",
    "immediate": false
}
```

**Response (200 OK):**
```json
{
    "message": "Subscription cancelled successfully",
    "subscription": {
        "id": 1,
        "status": "cancelled",
        "end_date": "2024-02-15T10:30:00Z"
    }
}
```

---

### **19. Trocar Plano**
```http
POST /api/subscriptions/{id}/change-plan/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
    "new_plan_id": 3
}
```

**Response (200 OK):**
```json
{
    "message": "Plan changed successfully",
    "subscription": {
        "id": 1,
        "plan": {
            "id": 3,
            "name": "Institucional"
        },
        "status": "active"
    }
}
```

---

### **20. Pausar Assinatura**
```http
POST /api/subscriptions/{id}/pause/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
    "message": "Subscription paused successfully",
    "subscription": {
        "id": 1,
        "status": "suspended"
    }
}
```

---

### **21. Retomar Assinatura**
```http
POST /api/subscriptions/{id}/resume/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
    "message": "Subscription resumed successfully",
    "subscription": {
        "id": 1,
        "status": "active"
    }
}
```

---

## 💰 **ENDPOINTS DE PAGAMENTOS**

### **22. Listar Pagamentos**
```http
GET /api/payments/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "asaas_payment_id": "pay_123456",
        "user": 1,
        "subscription": 1,
        "amount": "59.90",
        "payment_method": "credit_card",
        "status": "confirmed",
        "due_date": "2024-01-15",
        "payment_date": "2024-01-15T10:30:00Z",
        "description": "Pagamento mensal - Plano Pesquisador"
    }
]
```

---

### **23. Meus Pagamentos**
```http
GET /api/payments/my-payments/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "asaas_payment_id": "pay_123456",
        "amount": "59.90",
        "payment_method": "credit_card",
        "status": "confirmed",
        "due_date": "2024-01-15",
        "payment_date": "2024-01-15T10:30:00Z",
        "description": "Pagamento mensal - Plano Pesquisador"
    }
]
```

---

### **24. Pagamentos em Atraso**
```http
GET /api/payments/overdue/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
[
    {
        "id": 2,
        "asaas_payment_id": "pay_789012",
        "amount": "59.90",
        "payment_method": "boleto",
        "status": "overdue",
        "due_date": "2024-01-01",
        "description": "Pagamento em atraso"
    }
]
```

---

### **25. Criar Link de Pagamento**
```http
POST /api/payments/create-payment-link/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
    "amount": "59.90",
    "description": "Pagamento de assinatura",
    "payment_method": "boleto",
    "due_date": "2024-02-15"
}
```

**Response (201 Created):**
```json
{
    "message": "Payment link created successfully",
    "payment": {
        "id": 1,
        "asaas_payment_id": "pay_123456",
        "amount": "59.90",
        "payment_method": "boleto",
        "due_date": "2024-02-15",
        "description": "Pagamento de assinatura",
        "status": "pending",
        "payment_url": "https://www.asaas.com/cobranca/123456",
        "barcode": "12345678901234567890",
        "pix_code": "00020126580014br.gov.bcb.pix0136a629532e-7693-4849-8d06-b9c57f9589185204000053039865802BR5913Empresa LTDA6008Brasilia62070503***6304E2CA"
    }
}
```

---

## 📚 **ENDPOINTS DE GERAÇÃO DE ARTIGOS**

### **26. Criar Geração de Artigo**
```http
POST /api/article-generations/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
    "title": "Análise de Dados em Machine Learning",
    "objective": "Desenvolver um modelo preditivo para análise de dados",
    "resume": "Este artigo apresenta uma metodologia para análise de dados usando técnicas de machine learning",
    "keywords": "machine learning, análise de dados, predição",
    "article_type": "research",
    "methodology": "Utilizaremos algoritmos de regressão e classificação",
    "conclusion": "Esperamos demonstrar a eficácia das técnicas aplicadas"
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "request_id": 12345,
    "user": 1,
    "status": "pending",
    "title": "Análise de Dados em Machine Learning",
    "objective": "Desenvolver um modelo preditivo para análise de dados",
    "resume": "Este artigo apresenta uma metodologia para análise de dados usando técnicas de machine learning",
    "keywords": "machine learning, análise de dados, predição",
    "article_type": "research",
    "methodology": "Utilizaremos algoritmos de regressão e classificação",
    "conclusion": "Esperamos demonstrar a eficácia das técnicas aplicadas",
    "api_status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
}
```

---

### **27. Minhas Gerações**
```http
GET /api/article-generations/my_generations/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "request_id": 12345,
        "status": "generating",
        "title": "Análise de Dados em Machine Learning",
        "objective": "Desenvolver um modelo preditivo para análise de dados",
        "api_status": "Gerando",
        "created_at": "2024-01-15T10:30:00Z",
        "estimated_time": "25 minutos"
    }
]
```

---

### **28. Gerações Pendentes**
```http
GET /api/article-generations/pending/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "request_id": 12345,
        "status": "generating",
        "title": "Análise de Dados em Machine Learning",
        "api_status": "Gerando",
        "estimated_time": "25 minutos"
    }
]
```

---

### **29. Gerações Concluídas**
```http
GET /api/article-generations/completed/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
[
    {
        "id": 2,
        "request_id": 12346,
        "status": "completed",
        "title": "Revisão de Literatura em IA",
        "api_status": "Artigo gerado com sucesso",
        "download_url": "/api/article-generations/2/download/",
        "completed_at": "2024-01-15T11:30:00Z"
    }
]
```

---

### **30. Verificar Status**
```http
POST /api/article-generations/{id}/check_status/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
    "message": "Status updated",
    "generation": {
        "id": 1,
        "status": "processing",
        "api_status": "Processando"
    },
    "api_status": "Processando"
}
```

---

### **31. Cancelar Geração**
```http
POST /api/article-generations/{id}/cancel/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
    "reason": "Mudança de escopo do artigo"
}
```

**Response (200 OK):**
```json
{
    "message": "Article generation cancelled successfully",
    "generation": {
        "id": 1,
        "status": "cancelled"
    }
}
```

---

### **32. Download do Artigo**
```http
GET /api/article-generations/{id}/download/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```
[Arquivo PDF do artigo]
Content-Type: application/pdf
Content-Disposition: attachment; filename="artigo_12345.pdf"
```

---

### **33. Verificação em Lote**
```http
POST /api/article-generations/bulk_check_status/
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
    "message": "Status check completed. 2 updated, 1 completed.",
    "updated_count": 2,
    "completed_count": 1
}
```

---

## 🔄 **ENDPOINTS DE WEBHOOK**

### **34. Webhook Asaas**
```http
POST /api/webhooks/asaas/
```

**Headers:**
```http
ASAAS_ACCESS_TOKEN: <webhook_token>
```

**Request (exemplo de evento de pagamento):**
```json
{
    "event": "PAYMENT_RECEIVED",
    "payment": {
        "id": "pay_123456",
        "subscription": "sub_789012",
        "status": "RECEIVED",
        "value": 59.90,
        "dueDate": "2024-01-15"
    }
}
```

**Response (200 OK):**
```json
{
    "message": "Webhook processed successfully"
}
```

---

## 📊 **ENDPOINTS DE FILTROS E BUSCA**

### **35. Filtros por Status**
```http
GET /api/article-generations/?status=generating
```

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "status": "generating",
        "title": "Análise de Dados em Machine Learning"
    }
]
```

---

### **36. Busca por Palavras-chave**
```http
GET /api/article-generations/?search=machine learning
```

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "title": "Análise de Dados em Machine Learning",
        "keywords": "machine learning, análise de dados, predição"
    }
]
```

---

### **37. Ordenação por Data**
```http
GET /api/article-generations/?ordering=-created_at
```

**Response (200 OK):**
```json
[
    {
        "id": 2,
        "title": "Revisão de Literatura em IA",
        "created_at": "2024-01-15T11:30:00Z"
    },
    {
        "id": 1,
        "title": "Análise de Dados em Machine Learning",
        "created_at": "2024-01-15T10:30:00Z"
    }
]
```

---

## 🚨 **CÓDIGOS DE STATUS HTTP**

### **Sucesso**
- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `204 No Content` - Requisição bem-sucedida sem conteúdo

### **Erro do Cliente**
- `400 Bad Request` - Dados inválidos ou malformados
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Não autorizado
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito de dados

### **Erro do Servidor**
- `500 Internal Server Error` - Erro interno do servidor
- `502 Bad Gateway` - Erro na comunicação com serviço externo
- `503 Service Unavailable` - Serviço temporariamente indisponível

---

## 📝 **EXEMPLOS DE USO COMPLETO**

### **Fluxo Completo: Criar e Acompanhar Artigo**

#### **1. Login**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.silva@email.com",
    "password": "senha123"
  }'
```

#### **2. Criar Artigo**
```bash
curl -X POST http://localhost:8000/api/article-generations/ \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meu Artigo Científico",
    "objective": "Demonstrar uma nova metodologia",
    "keywords": "metodologia, ciência, pesquisa"
  }'
```

#### **3. Acompanhar Status**
```bash
curl -X POST http://localhost:8000/api/article-generations/1/check_status/ \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### **4. Download quando Pronto**
```bash
curl -X GET http://localhost:8000/api/article-generations/1/download/ \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  --output artigo.pdf
```

---

## 🔧 **CONFIGURAÇÕES E VARIÁVEIS**

### **Variáveis de Ambiente Necessárias**
```bash
# JWT (obrigatório)
SECRET_KEY=your_django_secret_key

# Asaas (para pagamentos)
ASAAS_ACCESS_TOKEN=your_asaas_token
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=your_webhook_token
ASAAS_SANDBOX_MODE=True

# IArtigo API (para geração de artigos)
IARTIGO_URL=https://api.iartigo.com
IARTIGO_TOKEN=your_iartigo_token

# Banco de Dados
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306

# Django
DEBUG=True
BASE_URL=http://localhost:8000
```

---

## 📚 **RECURSOS ADICIONAIS**

### **Documentação Swagger/OpenAPI**
A API inclui documentação automática através do Django REST Framework Browsable API:
```
http://localhost:8000/api/
```

### **Testes da API**
Para testar endpoints específicos, use o comando:
```bash
python manage.py test api.tests
```

### **Monitoramento**
Para verificar o status das gerações de artigos:
```bash
python manage.py check_article_status --continuous
```

---

## 🎯 **MELHORES PRÁTICAS**

1. **Use JWT tokens** para endpoints que requerem usuário autenticado
2. **Implemente retry logic** para endpoints que podem falhar
3. **Monitore rate limits** para evitar sobrecarga
4. **Valide dados** antes de enviar para a API
5. **Use HTTPS** em produção
6. **Implemente logging** para debugging
7. **Verifique permissões** adequadamente em todos os endpoints
8. **Use transações** para operações críticas

---

## 🆘 **SUPORTE**

Para dúvidas ou problemas com a API:
- **Documentação**: Consulte este arquivo
- **Logs**: Verifique os logs do Django
- **Admin**: Acesse `/admin/` para gerenciar dados
- **Comandos**: Use `python manage.py help` para ver comandos disponíveis

---

**🎉 API completamente documentada e revisada!**
