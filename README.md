# Core E-Commerce — Checkout con Descuentos Acumulativos

MVP de un módulo de checkout de e-commerce con un motor de descuentos acumulativos en cascada (categoría → volumen → cupón, con tope absoluto del 35%). Monorepo con backend en Spring Boot y frontend en Angular.

Ver también:
- [`docs/arquitectura.md`](docs/arquitectura.md) — justificación de arquitectura, trade-offs y patrones de diseño aplicados.
- [`docs/ia.md`](docs/ia.md) — gobernanza y bitácora de co-creación con IA.

## Estructura del monorepo

```
examen-ecommerce/
├── apps/
│   ├── backend/     # API REST (Spring Boot 4 / Java 17)
│   └── frontend/    # Aplicación web (Angular 22)
├── packages/        # (sin uso en este entregable)
├── docs/
│   ├── arquitectura.md
│   └── ia.md
├── docker-compose.yml
├── .env.example
└── README.md
```

## Requisitos previos

- **Java 17+** (el backend incluye el wrapper `mvnw`, no hace falta tener Maven instalado aparte).
- **Node.js 20.19+ o 22.12+** y **npm** (para Angular 22).
- **Docker** y **Docker Compose** (para levantar PostgreSQL).

## 1. Configuración inicial

Cloná el repo y copiá el archivo de variables de entorno:

```bash
git clone https://github.com/cristianar1008/examen-ecommerce.git
cd examen-ecommerce
cp .env.example .env
```

`.env` trae valores por defecto que funcionan tal cual para desarrollo local (no requiere edición):

```
POSTGRES_DB=ecommerce
POSTGRES_USER=ecommerce_user
POSTGRES_PASSWORD=change_me
POSTGRES_PORT=5432
```

## 2. Levantar la base de datos

```bash
docker compose up -d
```

Esto levanta un PostgreSQL 16 en el puerto `5432` (o el que hayas configurado en `POSTGRES_PORT`). Al arrancar el backend por primera vez, Hibernate crea el esquema (`ddl-auto: update`) y `data.sql` precarga automáticamente:

- **Categorías**: `Tecnologia` (con 10% de descuento activo), `Hogar`.
- **Cupones**: `WELCOME2026` (15%, activo — el que pide el enunciado) y `PROMO2020` (30%, activo — suficiente para superar el tope del 35% en un carrito 100% Tecnología por encima de $100).
- **6 productos de catálogo** (4 de Tecnología, 2 de Hogar) con stock inicial.

La carga es idempotente: podés reiniciar el backend las veces que quieras sin duplicar filas.

## 3. Correr el backend

```bash
cd apps/backend
./mvnw spring-boot:run
```

Queda escuchando en **`http://localhost:8080`**.

Documentación interactiva de la API (Swagger UI): `http://localhost:8080/swagger-ui/index.html`

### Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/products` | Lista el catálogo de productos con stock actual. |
| `POST` | `/api/checkout/simulate` | Recalcula el desglose de descuentos SIN decrementar stock ni persistir nada (previsualización antes de pagar). |
| `POST` | `/api/checkout` | Confirma la compra: valida stock, aplica el motor de descuentos, decrementa stock, marca el cupón como usado (si aplica) y persiste la orden. |
| `GET` | `/api/coupons/{code}` | Valida si un código de cupón existe y está activo (siempre responde 200, con `valid: true/false`). |

## 4. Correr el frontend

En otra terminal:

```bash
cd apps/frontend
npm install
npm start
```

Queda disponible en **`http://localhost:4200`**. El proxy de desarrollo (`proxy.conf.json`, ya conectado por defecto en `npm start`) reenvía todas las llamadas a `/api/*` hacia el backend en `http://localhost:8080`, así que no hace falta configurar CORS ni URLs base a mano.

## 5. Flujo de prueba rápido (demo)

1. Agregá uno o más productos al carrito desde el catálogo.
2. Abrí el carrito con el ícono en la esquina superior derecha — ahí se ve el subtotal **sin** descuentos, actualizándose en tiempo real.
3. Click en **"Ir a pagar"**: te lleva a la vista de checkout, que calcula el desglose **con** descuentos (categoría, volumen, cupón, tope del 35%) contra el backend.
4. (Opcional) Ingresá el cupón `WELCOME2026` en el recuadro de la derecha y click en **"Validar"** — la validación es explícita, no se dispara sola mientras escribís.
5. Click en **"Pagar"** para confirmar la compra real: decrementa el stock y persiste la orden. Si volvés a intentar pagar con el mismo cupón, el backend ya lo rechaza porque quedó marcado como usado.
6. Para mostrar la alerta del tope del 35% (HU4): armá un carrito solo con productos de Tecnología por encima de $100 (por ejemplo, varias unidades de Laptop X1) y aplicá el cupón `PROMO2020` en vez de `WELCOME2026` — con `WELCOME2026` solo (15%) el descuento máximo posible es ~27.3%, nunca alcanza el tope.

## 6. Correr las pruebas y ver la cobertura

### Backend

```bash
cd apps/backend
./mvnw verify
```

`verify` corre todos los tests unitarios y, además, aplica el gate de cobertura configurado con JaCoCo (mínimo 80% de líneas sobre las capas de dominio y lógica de aplicación — la build falla si no se cumple). El reporte HTML queda en:

```
apps/backend/target/site/jacoco/index.html
```

### Frontend

```bash
cd apps/frontend
npx ng test --watch=false --coverage
```

Corre los 56 tests unitarios (Vitest) y muestra en la terminal el resumen de cobertura por archivo, acotada a las capas lógicas esenciales (`core/` y `shared/`, configurado en `angular.json`).

Para build de producción (verificación de compilación limpia):

```bash
npx ng build
```

## Notas

- El backend usa `ddl-auto: update`, pensado para desarrollo local — no está pensado para producción.
- Si cambiás el puerto de Postgres en `.env`, no hace falta tocar nada más: `application.yml` lo lee de la misma variable `POSTGRES_PORT`.
