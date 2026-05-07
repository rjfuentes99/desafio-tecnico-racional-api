# Racional Investment API

API RESTful para gestionar inversiones, portafolios, movimientos de efectivo y órdenes de acciones.

## 🏗️ Arquitectura y Tecnologías

### Stack Tecnológico
- **Node.js** (v18+)
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **pg** - Cliente PostgreSQL para Node.js

### Estructura del Proyecto
```
racional-api/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── models/
│   │   ├── User.js              # Modelo de usuarios
│   │   ├── Portfolio.js         # Modelo de portafolios
│   │   ├── CashMovement.js      # Modelo de movimientos de efectivo
│   │   └── StockOrder.js        # Modelo de órdenes de stock
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── portfolioController.js
│   │   ├── movementController.js
│   │   └── orderController.js
│   ├── routes/
│   │   ├── users.js
│   │   ├── portfolios.js
│   │   ├── movements.js
│   │   └── orders.js
│   ├── middleware/
│   │   └── errorHandler.js      # Manejo global de errores
│   └── app.js                   # Aplicación principal
├── migrations/
│   ├── 001_init.sql             # Schema inicial
│   └── run.js                   # Script de migración
├── .env.example
├── package.json
└── README.md
```

---

## 📊 Modelo de Datos

### Diagrama ER

```
┌─────────────┐
│    users    │
├─────────────┤
│ id          │ PK, UUID
│ email       │ UNIQUE
│ name        │
│ phone       │
│ created_at  │
│ updated_at  │
└─────────────┘
       │ 1
       │
       │ N
┌─────────────┐
│ portfolios  │
├─────────────┤
│ id          │ PK, UUID
│ user_id     │ FK -> users
│ name        │
│ description │
│ created_at  │
│ updated_at  │
└─────────────┘
       │ 1
       ├──────────────┬────────────────┐
       │ N            │ N              │ N
┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐
│cash_movements│  │stock_orders  │  │portfolio_positions  │
├──────────────┤  ├──────────────┤  ├─────────────────────┤
│ id           │  │ id           │  │ id                  │
│ portfolio_id │  │ portfolio_id │  │ portfolio_id        │
│ type         │  │ type         │  │ symbol              │
│ amount       │  │ symbol       │  │ quantity            │
│ date         │  │ quantity     │  │ average_price       │
│ description  │  │ price/share  │  │ updated_at          │
│ created_at   │  │ total_amount │  └─────────────────────┘
└──────────────┘  │ date         │
                  │ created_at   │
                  └──────────────┘
```

### Decisiones de Diseño

1. **Separación de Usuarios y Portafolios**: Un usuario puede tener múltiples portafolios (estrategias de inversión distintas)

2. **Movimientos de Efectivo Separados**: Los depósitos y retiros se registran independientemente para:
   - Mantener historial completo de flujo de caja
   - Facilitar auditoría y reporting
   - Simplificar cálculos de rendimiento

3. **Órdenes vs Posiciones**: 
   - `stock_orders`: Registro histórico inmutable de todas las transacciones
   - `portfolio_positions`: Vista materializada del estado actual (optimización de consultas)

4. **Transacciones Atómicas**: Las compras/ventas actualizan posiciones en una sola transacción para mantener consistencia

5. **UUIDs como Primary Keys**: Mejor para sistemas distribuidos y evita colisiones

6. **Timestamps Automáticos**: `created_at` y `updated_at` se gestionan automáticamente con triggers

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Paso 1: Instalar dependencias

```bash
cd racional-api
npm install
```

### Paso 2: Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=racional_db
DB_USER=postgres
DB_PASSWORD=tu_password_aqui

PORT=3000
NODE_ENV=development
```

### Paso 3: Crear la base de datos

Conéctate a PostgreSQL y crea la base de datos:

```bash
psql -U postgres
```

```sql
CREATE DATABASE racional_db;
\q
```

### Paso 4: Ejecutar migraciones

```bash
npm run migrate
```

Esto creará todas las tablas e insertará datos de prueba.

### Paso 5: Iniciar el servidor

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### 🏥 Health Check

#### `GET /`
Información general de la API

**Response:**
```json
{
  "success": true,
  "message": "Racional Investment API",
  "version": "1.0.0",
  "endpoints": {
    "users": "/api/users",
    "portfolios": "/api/portfolios",
    "movements": "/api/movements",
    "orders": "/api/orders"
  }
}
```

#### `GET /api/health`
Status del servidor

---

### 👤 Usuarios

#### `GET /api/users`
Obtener todos los usuarios

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+56912345678",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### `GET /api/users/:id`
Obtener usuario por ID

#### `POST /api/users`
Crear nuevo usuario

**Request Body:**
```json
{
  "email": "jane@example.com",
  "name": "Jane Smith",
  "phone": "+56987654321"
}
```

#### `PATCH /api/users/:id`
Actualizar información del usuario

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "phone": "+56911111111"
}
```

---

### 💼 Portafolios

#### `GET /api/users/:userId/portfolios`
Obtener portafolios de un usuario

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Main Portfolio",
      "description": "My primary investment portfolio",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### `POST /api/users/:userId/portfolios`
Crear nuevo portafolio

**Request Body:**
```json
{
  "name": "Tech Stocks",
  "description": "Technology sector investments"
}
```

#### `GET /api/portfolios/:id/total`
**Obtener valor total de un portafolio**

**Response:**
```json
{
  "success": true,
  "data": {
    "portfolio_id": "uuid",
    "portfolio_name": "Main Portfolio",
    "cash_balance": 1535.00,
    "stock_value": 18035.00,
    "total_value": 19570.00,
    "positions": [
      {
        "symbol": "AAPL",
        "quantity": 7,
        "average_price": 150.00,
        "position_value": 1050.00
      },
      {
        "symbol": "GOOGL",
        "quantity": 5,
        "average_price": 2500.00,
        "position_value": 12500.00
      }
    ]
  }
}
```

#### `PATCH /api/portfolios/:id`
Actualizar portafolio

**Request Body:**
```json
{
  "name": "Updated Portfolio Name",
  "description": "New description"
}
```

---

### 💰 Movimientos de Efectivo (Depósitos/Retiros)

#### `POST /api/portfolios/:portfolioId/movements`
**Registrar depósito o retiro (REQUERIDO)**

**Request Body:**
```json
{
  "type": "deposit",
  "amount": 5000.00,
  "date": "2024-01-20T10:00:00Z",
  "description": "Monthly investment"
}
```

**Tipos válidos:**
- `deposit` - Depósito
- `withdrawal` - Retiro

**Validaciones:**
- `type`, `amount`, y `date` son obligatorios
- `amount` debe ser > 0
- Para retiros, valida que haya fondos suficientes

#### `GET /api/portfolios/:portfolioId/movements`
Obtener movimientos de un portafolio

**Query Params:**
- `limit` (opcional, default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "portfolio_id": "uuid",
      "type": "deposit",
      "amount": 10000.00,
      "date": "2024-01-15T10:00:00Z",
      "description": "Initial deposit",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### `GET /api/users/:userId/movements/recent`
**Obtener últimos movimientos de un usuario**

**Query Params:**
- `limit` (opcional, default: 20)

---

### 📈 Órdenes de Stock (Compra/Venta)

#### `POST /api/portfolios/:portfolioId/orders`
**Registrar orden de compra o venta (REQUERIDO)**

**Request Body para COMPRA:**
```json
{
  "type": "buy",
  "symbol": "AAPL",
  "quantity": 10,
  "price_per_share": 150.25,
  "date": "2024-01-20T14:30:00Z"
}
```

**Request Body para VENTA:**
```json
{
  "type": "sell",
  "symbol": "AAPL",
  "quantity": 3,
  "price_per_share": 155.00,
  "date": "2024-01-25T16:00:00Z"
}
```

**Tipos válidos:**
- `buy` - Compra
- `sell` - Venta

**Validaciones:**
- Todos los campos son obligatorios
- `quantity` y `price_per_share` deben ser > 0
- Para ventas, valida que haya suficientes acciones en el portafolio

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "portfolio_id": "uuid",
    "type": "buy",
    "symbol": "AAPL",
    "quantity": 10,
    "price_per_share": 150.25,
    "total_amount": 1502.50,
    "date": "2024-01-20T14:30:00Z",
    "created_at": "2024-01-20T14:30:00Z"
  }
}
```

#### `GET /api/portfolios/:portfolioId/orders`
Obtener órdenes de un portafolio

**Query Params:**
- `limit` (opcional, default: 50)

#### `GET /api/users/:userId/orders/recent`
**Obtener últimas órdenes de un usuario**

#### `GET /api/portfolios/:portfolioId/orders/symbol/:symbol`
Obtener historial de un símbolo específico

**Example:**
```
GET /api/portfolios/uuid/orders/symbol/AAPL
```

---

### 🔄 Actividad Combinada

#### `GET /api/users/:userId/activity`
**Obtener todos los movimientos recientes de un usuario (cash + órdenes)**

**Query Params:**
- `limit` (opcional, default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "portfolio_id": "uuid",
      "portfolio_name": "Main Portfolio",
      "activity_type": "stock_order",
      "type": "buy",
      "symbol": "AAPL",
      "quantity": 10,
      "price_per_share": 150.00,
      "total_amount": 1500.00,
      "date": "2024-01-20T14:30:00Z"
    },
    {
      "id": "uuid",
      "portfolio_id": "uuid",
      "portfolio_name": "Main Portfolio",
      "activity_type": "cash_movement",
      "type": "deposit",
      "amount": 10000.00,
      "date": "2024-01-15T10:00:00Z",
      "description": "Initial deposit"
    }
  ]
}
```

---

## 🧪 Ejemplos de Uso con cURL

### Crear un usuario
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investor@example.com",
    "name": "Maria Investor",
    "phone": "+56922334455"
  }'
```

### Crear un portafolio
```bash
curl -X POST http://localhost:3000/api/users/{userId}/portfolios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Growth Portfolio",
    "description": "High growth tech stocks"
  }'
```

### Registrar un depósito
```bash
curl -X POST http://localhost:3000/api/portfolios/{portfolioId}/movements \
  -H "Content-Type: application/json" \
  -d '{
    "type": "deposit",
    "amount": 50000,
    "date": "2024-01-20T10:00:00Z",
    "description": "Initial investment"
  }'
```

### Comprar acciones
```bash
curl -X POST http://localhost:3000/api/portfolios/{portfolioId}/orders \
  -H "Content-Type: application/json" \
  -d '{
    "type": "buy",
    "symbol": "MSFT",
    "quantity": 20,
    "price_per_share": 380.50,
    "date": "2024-01-21T14:30:00Z"
  }'
```

### Consultar valor total del portafolio
```bash
curl http://localhost:3000/api/portfolios/{portfolioId}/total
```

### Obtener actividad reciente
```bash
curl http://localhost:3000/api/users/{userId}/activity?limit=10
```

---

## 🤖 Uso de I.A. en el Desarrollo

### Herramientas Utilizadas
- **Claude (Anthropic)** - Asistente principal de desarrollo

### Integración en el Flujo de Trabajo

1. **Diseño del Modelo de Datos**
   - Consulté a Claude sobre mejores prácticas para esquemas de bases de datos financieras
   - Validé decisiones de normalización vs denormalización
   - Optimicé índices basándome en patrones de consulta

2. **Generación de Código Base**
   - Generé estructura inicial de modelos con patrones Repository
   - Creé controladores siguiendo convenciones RESTful
   - Implementé manejo robusto de errores con validaciones

3. **Optimización de Queries**
   - Refactoricé consultas SQL para mejor performance
   - Implementé transacciones para mantener consistencia
   - Agregué índices estratégicos

4. **Documentación**
   - Generé documentación completa de API
   - Creé ejemplos de uso prácticos
   - Documenté decisiones de arquitectura

### Beneficios Observados
- ✅ **Velocidad**: Desarrollo 3-4x más rápido en estructura inicial
- ✅ **Calidad**: Código más consistente y siguiendo best practices
- ✅ **Documentación**: README y comentarios generados automáticamente
- ✅ **Testing mental**: Validación de casos edge y errores potenciales

### Limitaciones
- ⚠️ Revisión manual necesaria para lógica de negocio compleja
- ⚠️ Testing real requerido para validar transacciones
- ⚠️ Personalización de reglas de validación específicas del dominio

---

## 🔒 Seguridad y Mejoras Futuras

### Actualmente NO implementado (para producción se requiere):
- ❌ Autenticación (JWT, OAuth)
- ❌ Autorización (usuarios solo pueden ver sus propios datos)
- ❌ Rate limiting
- ❌ Input sanitization avanzado
- ❌ Logging estructurado
- ❌ Monitoreo y métricas

### Roadmap de Mejoras
1. Implementar autenticación con JWT
2. Agregar validación con Joi/Zod
3. Implementar paginación en endpoints de listado
4. Agregar WebSockets para updates en tiempo real
5. Crear endpoints de reporting y analytics
6. Implementar cache con Redis
7. Agregar tests unitarios y de integración
8. Implementar CI/CD

---

## 📝 Notas Técnicas

### Cálculo del Valor Total del Portafolio

El endpoint `/api/portfolios/:id/total` calcula:

1. **Balance de Efectivo** = Depósitos - Retiros - Compras + Ventas
2. **Valor de Acciones** = Σ (Cantidad × Precio Promedio) para cada posición
3. **Valor Total** = Balance de Efectivo + Valor de Acciones

### Gestión de Posiciones

Al ejecutar una orden:
- **Compra**: Agrega a la posición existente (calcula precio promedio ponderado)
- **Venta**: Reduce la posición (mantiene precio promedio, valida cantidad suficiente)
- Las posiciones se actualizan automáticamente en la misma transacción

### Triggers de PostgreSQL

Se implementan triggers para:
- Auto-actualización de `updated_at` en tablas relevantes
- Mantener integridad referencial

---


---

**Desafío Técnico - Racional** | 2024
