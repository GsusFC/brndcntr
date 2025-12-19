# BRND Monorepo

Monorepo con Turborepo para las aplicaciones BRND.

## Estructura

```
brnd-monorepo/
├── apps/
│   ├── landing/      → brnd.land
│   └── dashboard/    → dashboard.brnd.land
├── packages/         → (futuro: componentes compartidos)
├── package.json      → workspaces config
└── turbo.json        → Turborepo config
```

## Requisitos

- Node.js 18+
- npm 10+

## Variables de entorno

Cada app necesita su propio `.env`. Copiar de `.env.example` o configurar:

```bash
# Base de datos Indexer (Postgres - READ ONLY)
INDEXER_DATABASE_URL="postgresql://..."

# Base de datos MySQL (para dashboard)
MYSQL_DATABASE_URL="mysql://..."

# Auth
AUTH_SECRET="..."
AUTH_FARCASTER_CLIENT_ID="..."
AUTH_FARCASTER_CLIENT_SECRET="..."

# Neynar (Farcaster API)
NEYNAR_API_KEY="..."

# Turso (cache)
TURSO_DATABASE_URL="..."
TURSO_AUTH_TOKEN="..."
```

## Instalación

```bash
# Clonar el repo
git clone <repo-url>
cd brnd-monorepo

# Instalar dependencias (root + todas las apps)
npm install

# Instalar dependencias de cada app
cd apps/landing && npm install
cd ../dashboard && npm install
```

## Desarrollo

```bash
# Desde el root - ambas apps
npm run dev

# Solo landing (puerto 3001)
npm run dev:landing

# Solo dashboard (puerto 3000)
npm run dev:dashboard

# O desde cada app directamente
cd apps/landing && npm run dev
cd apps/dashboard && npm run dev
```

## Build

```bash
# Desde el root - ambas apps en paralelo
npm run build

# Solo landing
npm run build:landing

# Solo dashboard
npm run build:dashboard

# O desde cada app
cd apps/landing && npm run build
cd apps/dashboard && npm run build
```

## Deploy

### Landing (brnd.land)

```bash
cd apps/landing
npm run build
npm run start
```

O con Docker / PM2 / cualquier plataforma Node.js.

### Dashboard (dashboard.brnd.land)

```bash
cd apps/dashboard
npm run build
npm run start
```

## Apps

### Landing (`apps/landing`)
- **URL**: brnd.land
- **Puerto dev**: 3001
- **Descripción**: Página pública de marketing con carrusel de podiums

### Dashboard (`apps/dashboard`)
- **URL**: dashboard.brnd.land
- **Puerto dev**: 3000
- **Descripción**: Panel de administración con:
  - Gestión de marcas
  - Perfiles de usuarios
  - Intelligence/Analytics
  - Season 1 Report
  - Airdrops y Allowlist

## Comandos útiles

```bash
# Generar cliente Prisma (desde cada app)
npm run prisma:generate:all

# Lint
npm run lint

# Build con cache (Turborepo)
npx turbo build
```
