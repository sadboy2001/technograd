# техноград — Курс по тестированию ПО

Next.js 14 · NextAuth · Prisma · Neon PostgreSQL

---

## Деплой на Vercel + Neon (пошаговая инструкция)

### 1. Создать базу данных в Neon

1. Зайди на [console.neon.tech](https://console.neon.tech) → **New Project**
2. Выбери регион ближе к Vercel (обычно `us-east-1`)
3. В разделе **Connection Details** выбери из выпадающего списка **Prisma**
4. Скопируй оба URL:
   - **DATABASE_URL** — pooled (содержит `-pooler` и `pgbouncer=true`)
   - **DIRECT_URL** — прямой (без `-pooler`)

### 2. Задеплоить на Vercel

1. Загрузи проект в GitHub репозиторий
2. Зайди на [vercel.com](https://vercel.com) → **Add New Project** → выбери репозиторий
3. В разделе **Environment Variables** добавь:

| Переменная | Значение |
|---|---|
| `DATABASE_URL` | pooled URL из Neon (с `-pooler` и `pgbouncer=true`) |
| `DIRECT_URL` | прямой URL из Neon (без `-pooler`) |
| `NEXTAUTH_SECRET` | `d6d30a04c9ebb3f007f1e67297db0a741e2bef757f007cfccd69162a9eb095f5` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` (твой домен после деплоя) |

4. Нажми **Deploy** — Vercel автоматически запустит `prisma generate && next build`

### 3. Применить миграции к Neon

После первого деплоя запусти один раз локально (с `.env` заполненным реальными URL):

```bash
npm install
npx prisma migrate deploy
# или если нет migrations/:
npx prisma db push
```

---

## Локальная разработка

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env (скопировать из .env.example и вставить реальные Neon URL)
cp .env.example .env

# 3. Применить схему к базе
npx prisma db push

# 4. Запустить
npm run dev  # → http://localhost:3000
```

---

## Структура переменных окружения

```env
# Neon pooled — для runtime (Vercel serverless functions)
DATABASE_URL="postgresql://...@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Neon direct — для prisma migrate/db push
DIRECT_URL="postgresql://...@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="d6d30a04c9ebb3f007f1e67297db0a741e2bef757f007cfccd69162a9eb095f5"
NEXTAUTH_URL="https://your-app.vercel.app"
```
