FROM node:24-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY public/ ./public/
RUN mkdir -p public/images && chown node:node public/images

USER node
EXPOSE 8080
CMD ["npm", "start"]
