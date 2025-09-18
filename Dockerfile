# Frontend Dockerfile
FROM node:18-alpine as frontend-build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend (if needed)
# RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built frontend to nginx
COPY --from=frontend-build /app /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
