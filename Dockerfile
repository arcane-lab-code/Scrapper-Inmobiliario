# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install ALL dependencies (including devDependencies for building)
WORKDIR /app/backend
RUN npm install

# Copy backend source
COPY backend/ ./

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-slim

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copy package files and install ONLY production dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy built code from builder stage
COPY --from=builder /app/backend/dist ./dist

# Copy frontend to serve static files
COPY frontend/ /app/frontend/

# Create data directory
RUN mkdir -p /app/data /app/config

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Start application
CMD ["npm", "start"]
