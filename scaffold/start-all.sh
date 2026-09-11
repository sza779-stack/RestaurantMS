#!/bin/bash

# Restaurant Platform - Start All Services
# This script starts all infrastructure and applications

echo "🍕 Restaurant Platform - Starting All Services..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start infrastructure
cd docker
echo "🚀 Starting infrastructure (PostgreSQL, Redis, MinIO)..."
docker-compose up -d postgres redis minio

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure to be ready..."
sleep 10

# Check if API dependencies are installed
cd ../api
if [ ! -d "node_modules" ]; then
    echo "📦 Installing API dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start API
cd ../docker
echo "🚀 Starting API server..."
docker-compose up -d api

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 5

# Apply migrations and seed data
echo "🔧 Applying database migrations..."
docker-compose exec -T api npx prisma migrate deploy

echo "🗄️ Syncing database schema..."
docker-compose exec -T api npx prisma db push

echo "🌱 Seeding database (safe to re-run)..."
docker-compose exec -T api npx prisma db seed

# Start all web applications
echo "🚀 Starting web applications..."
docker-compose up -d web-admin web-online web-kds web-packing web-osdu web-driver

echo ""
echo "✅ All services started!"
echo ""
echo "📱 Available Applications:"
echo "  • API Docs:      http://localhost:3000/api/docs"
echo "  • Admin/POS:     http://localhost:3001"
echo "  - Online:        http://localhost:3002"
echo "  - Walk-in 1:     http://localhost:3002/menu?channel=walkin&station=front-1"
echo "  - Walk-in 2:     http://localhost:3002/menu?channel=walkin&station=front-2"
echo "  - Walk-in 3:     http://localhost:3002/menu?channel=walkin&station=front-3"
echo "  - KDS:           http://localhost:3003"
echo "  - Packing:       http://localhost:3004"
echo "  - OSDU:          http://localhost:3005"
echo "  - Driver:        http://localhost:3006"
echo "  • MinIO Console: http://localhost:9001"
echo ""
echo "📧 Default Login:"
echo "  Email:    owner@pizzapalace.com"
echo "  Password: password123"
echo ""
echo "🛑 To stop all services, run: cd docker && docker-compose down"
