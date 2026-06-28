# TaskForge – AI-Powered Project Management Platform

TaskForge is a collaborative, high-performance project management platform built with Node.js, Express, Socket.io, React, TypeScript, and Tailwind CSS. The design system aligns with premium SaaS tools like Linear and Notion, utilizing deep zinc dark canvases, custom glassmorphism, and indigo/violet accents.

## Tech Stack

- **Frontend**: React 19 (TypeScript), Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Node.js, Express.js (TypeScript)
- **Database**: PostgreSQL (managed through Prisma ORM)
- **Realtime**: Socket.io
- **File upload**: Multer (saves to local static storage, easily swappable with Cloudinary)

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Docker (optional, for running database) or local PostgreSQL instance

### 2. Database Setup

You can run a local PostgreSQL instance via Docker using the provided `docker-compose.yml` (located in the root directory):
```bash
docker compose up -d
```
This launches a PostgreSQL container on port `5432` with username `postgres`, password `postgres`, and database `taskforge`.

If you are using a custom or remote PostgreSQL (e.g. Neon DB), update the connection string inside `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@hostname:port/database_name?sslmode=require"
```

### 3. Run Backend Server
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
The server will start on `http://localhost:5000`.

### 4. Run Frontend App
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Default Seeded Accounts
You can log in to TaskForge using the following credentials:
- **Alice Vance (Owner)**: `alice@taskforge.com` / `Password123!`
- **Bob Miller (Admin)**: `bob@taskforge.com` / `Password123!`
- **Charlie Zhang (Member)**: `charlie@taskforge.com` / `Password123!`
- **Diana Prince (Viewer)**: `diana@taskforge.com` / `Password123!`
