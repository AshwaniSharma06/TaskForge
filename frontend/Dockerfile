# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy configuration and source files
COPY postcss.config.js tailwind.config.js vite.config.ts tsconfig*.json index.html ./
COPY public ./public
COPY src ./src

# Set production API and Socket URL endpoints to route relatively through Nginx
ENV VITE_API_URL=/api
ENV VITE_SOCKET_URL=/

RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine

# Copy built frontend bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
