# Etapa 1: Construcción
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Recibe las variables en el momento de construir la imagen (Build time)
ARG VITE_API_URL=http://localhost:3000/api/v1
ARG VITE_APP_VERSION=v1.1.0
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION
RUN npm run build

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
