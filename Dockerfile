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

# Start application
CMD ["npm", "start"]
