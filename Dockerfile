# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app


COPY package*.json ./


RUN npm install

COPY . .
RUN npm run build

RUN npm prune --omit=dev


FROM node:20-alpine

WORKDIR /app


COPY package*.json ./


COPY --from=builder /app/node_modules ./node_modules


COPY --from=builder /app/dist ./dist

EXPOSE 8080  

CMD ["node", "dist/main"]
