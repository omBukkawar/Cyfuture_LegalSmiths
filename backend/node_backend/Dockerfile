# Production Node.js Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (leverage Docker layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose default port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "server.js"]

