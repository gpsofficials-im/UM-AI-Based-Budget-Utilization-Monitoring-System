# Cloud & Production Deployment Guide

This document provides complete instructions for deploying the **AI-Based Budget Utilization Monitoring System** on cloud platforms such as **Render**, **AWS (EC2 / ECS / S3)**, and **Azure (App Service)**.

---

## 1. Environment Variables Configuration

Create a `.env` file in the `backend/` directory configured for production:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai_budget_monitoring?retryWrites=true&w=majority
JWT_SECRET=your_ultra_secure_jwt_random_secret_string_here_min_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.com
UPLOAD_DIR=uploads
```

---

## 2. Deploying on Render (Unified Full-Stack Deployment)

### Backend Web Service
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the Environment Variables (`MONGODB_URI`, `JWT_SECRET`, etc.).
5. Render will automatically deploy the API at `https://your-api.onrender.com`.

### Frontend Static Site
1. In `frontend/src/app/core/services/api.service.ts` and `auth.service.ts`, set the production API base URL or proxy.
2. Create a new **Static Site** on Render.
3. Configure settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist/ai-budget-monitoring-frontend/browser`
4. Configure Rewrite Rule for Single-Page Application (SPA):
   - **Source**: `/*`
   - **Destination**: `/index.html`

---

## 3. Containerized Deployment with Docker

### Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/ai-budget-monitoring-frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. Database Setup: MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User with read/write privileges.
3. In Network Access, whitelist IP `0.0.0.0/0` or your cloud server IP.
4. Copy the connection string and paste it into `MONGODB_URI`.
5. Run the seed script to populate realistic demonstration data:
   ```bash
   npm run seed
   ```
