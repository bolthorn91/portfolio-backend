# Portfolio Backend

Backend del portfolio profesional con sistema de cotización y pagos para servicios tecnológicos.

## Stack

- NestJS 9 + Prisma + PostgreSQL (Supabase)
- Supabase Auth (Google OAuth)
- Stripe + PayPal

## Instalación

```bash
npm install
```

## Configuración

Copiar `.env.example` a `.env` y rellenar credenciales.

## Base de datos

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

## Desarrollo

```bash
npm run start:dev
```

## Producción

```bash
npm run build
npm run start:prod
```

## Documentación

- [`PRICING.md`](./PRICING.md) — Precios, features y constraints
- [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md) — Documento para integrar con el frontend
