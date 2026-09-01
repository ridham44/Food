FROM node:20-bookworm-slim

WORKDIR /app

# Install each application's locked dependencies before copying the source.
COPY chpl-food-backend/package*.json ./chpl-food-backend/
COPY chpl-food-frontend/package*.json ./chpl-food-frontend/
RUN npm ci --prefix chpl-food-backend --omit=dev \
    && npm ci --prefix chpl-food-frontend

COPY . .
RUN npm --prefix chpl-food-frontend run build

ENV NODE_ENV=production
EXPOSE 5000

# Express serves both the API and chpl-food-frontend/dist.
CMD ["npm", "--prefix", "chpl-food-backend", "start"]
