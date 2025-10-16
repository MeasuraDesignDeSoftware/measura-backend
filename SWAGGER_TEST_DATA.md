# Dados de Teste - Endpoints API

---

## 1. POST /auth/register

```json
{
  "email": "joao.victor@measura.com",
  "username": "joaovictorf",
  "password": "Senha@123",
  "firstName": "João Victor",
  "lastName": "Ferreira"
}
```

---

## 2. POST /auth/login

```json
{
  "identifier": "joao.victor@measura.com",
  "password": "Senha@123"
}
```

Copiar `access_token` da resposta e usar no botão "Authorize".

---

## 3. POST /organizations

```json
{
  "name": "Measura Design Patterns",
  "description": "Organização para demonstração dos padrões GoF implementados"
}
```

Copiar `_id` da resposta.

---

## 4. POST /projects/{organizationId}

```json
{
  "name": "Sistema E-Commerce",
  "description": "Plataforma de comércio eletrônico com catálogo de produtos, carrinho de compras e checkout",
  "status": "ACTIVE"
}
```

Copiar `_id` da resposta.

---

## 5. POST /estimates/{organizationId}

```json
{
  "name": "E-Commerce MVP - Sprint 1",
  "description": "Estimativa inicial do MVP com funcionalidades core de e-commerce",
  "countType": "DEVELOPMENT_PROJECT",
  "countingScope": "Catálogo de Produtos + Carrinho + Checkout + Gestão de Pedidos",
  "applicationBoundary": "Aplicação web responsiva acessível via navegador",
  "projectId": "COLAR_ID_PROJETO",
  "teamSize": 5,
  "hourlyRateBRL": 150,
  "averageDailyWorkingHours": 8,
  "productivityFactor": 12,
  "generalSystemCharacteristics": [3, 4, 3, 5, 4, 3, 4, 3, 4, 5, 3, 4, 3, 2]
}
```

Copiar `_id` da resposta.

---

## 6. POST /estimates/{organizationId}/{estimateId}/ali

### ALI 1 - Produtos

```json
{
  "name": "Produtos",
  "description": "Arquivo lógico interno contendo informações de produtos (SKU, nome, descrição, preço, categoria, estoque)",
  "tr": 3,
  "det": 25,
  "notes": "Contém tabelas: produtos, categorias, atributos. TR=3 (produtos, categorias, preços). DET=25 campos."
}
```

### ALI 2 - Clientes

```json
{
  "name": "Clientes",
  "description": "Cadastro de clientes com dados pessoais e endereços",
  "tr": 2,
  "det": 18,
  "notes": "TR=2 (clientes, endereços). DET=18 (nome, email, CPF, telefone, 4 campos de endereço, etc)"
}
```

### ALI 3 - Pedidos

```json
{
  "name": "Pedidos",
  "description": "Histórico completo de pedidos com itens, status, pagamentos e entregas",
  "tr": 5,
  "det": 35,
  "notes": "TR=5 (pedidos, itens_pedido, status, pagamentos, entregas). DET=35 campos complexos"
}
```

---

## 7. POST /estimates/{organizationId}/{estimateId}/aie

### AIE 1 - Gateway de Pagamento

```json
{
  "name": "Interface Gateway de Pagamento",
  "description": "Interface com serviço externo de processamento de pagamentos (Stripe/PagSeguro)",
  "tr": 2,
  "det": 15,
  "notes": "TR=2 (transações, status). DET=15 (valor, moeda, método, status, etc)"
}
```

---

## 8. POST /estimates/{organizationId}/{estimateId}/ei

### EI 1 - Cadastrar Produto

```json
{
  "name": "Cadastrar Produto",
  "description": "Funcionalidade para adicionar novo produto ao catálogo com validações",
  "ftr": 2,
  "det": 12,
  "notes": "FTR=2 (produtos, categorias). DET=12 campos de entrada"
}
```

### EI 2 - Finalizar Pedido

```json
{
  "name": "Finalizar Pedido",
  "description": "Processamento completo de checkout com validação de estoque, cálculo de frete e integração com pagamento",
  "ftr": 4,
  "det": 22,
  "notes": "FTR=4 (pedidos, itens, pagamento, cliente). DET=22 (dados do pedido + endereço + pagamento)"
}
```

### EI 3 - Atualizar Estoque

```json
{
  "name": "Atualizar Estoque",
  "description": "Ajuste manual de quantidade em estoque com registro de movimentação",
  "ftr": 2,
  "det": 8,
  "notes": "FTR=2 (produtos, movimentações). DET=8 (produto_id, quantidade, motivo, data)"
}
```

---

## 9. POST /estimates/{organizationId}/{estimateId}/eo

### EO 1 - Nota Fiscal

```json
{
  "name": "Emitir Nota Fiscal",
  "description": "Geração de nota fiscal eletrônica com cálculos tributários e envio para SEFAZ",
  "ftr": 3,
  "det": 28,
  "notes": "FTR=3 (pedidos, impostos, cliente). DET=28 (dados fiscais + cálculos)"
}
```

### EO 2 - Dashboard de Vendas

```json
{
  "name": "Dashboard de Vendas",
  "description": "Painel analítico com KPIs de vendas, gráficos e métricas de desempenho",
  "ftr": 4,
  "det": 30,
  "notes": "FTR=4 (pedidos, produtos, clientes, pagamentos). DET=30 métricas calculadas"
}
```

---

## 10. POST /estimates/{organizationId}/{estimateId}/eq

### EQ 1 - Buscar Produtos

```json
{
  "name": "Buscar Produtos",
  "description": "Consulta de produtos com filtros por categoria, preço, disponibilidade",
  "ftr": 2,
  "det": 10,
  "notes": "FTR=2 (produtos, categorias). DET=10 (filtros + resultado)"
}
```

### EQ 2 - Rastrear Pedido

```json
{
  "name": "Rastrear Pedido",
  "description": "Consulta detalhada de status e histórico de movimentação do pedido",
  "ftr": 2,
  "det": 15,
  "notes": "FTR=2 (pedidos, status). DET=15 (dados do pedido + timeline)"
}
```

---

## 11. GET /estimates/{organizationId}/{estimateId}/overview

Sem body - retorna overview completo com cálculos FPA.

---

## 12. GET /estimates/{organizationId}/{estimateId}/reports/pdf

Gera relatório PDF.

---

## 13. GET /estimates/{organizationId}/{estimateId}/reports/csv

Gera relatório CSV.

---

## 14. GET /estimates/{organizationId}/{estimateId}/reports/json

Gera relatório JSON estruturado.
