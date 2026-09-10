FROM node:20-bookworm-slim

WORKDIR /app

# Install each application's locked dependencies before copying the source.
COPY orbitfood-backend/package*.json ./orbitfood-backend/
COPY orbitfood-frontend/package*.json ./orbitfood-frontend/
RUN npm ci --prefix orbitfood-backend --omit=dev \
    && npm ci --prefix orbitfood-frontend

COPY . .
RUN npm --prefix orbitfood-frontend run build

ENV NODE_ENV=production
EXPOSE 5000

# Express serves both the API and orbitfood-frontend/dist.
CMD ["npm", "--prefix", "orbitfood-backend", "start"]
