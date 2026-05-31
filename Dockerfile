FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p uploads
EXPOSE 3000
CMD ["sh", "-c", "node scripts/init-db.js && node scripts/seed-marketplace.js && node server/index.js"]
