#!/bin/bash
# Reset Database and Seed with Sample Data
# This script resets the PostgreSQL database and runs Prisma seed

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Database Reset & Seed Tool${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check for force flag
FORCE=false
while getopts "f" opt; do
  case $opt in
    f) FORCE=true ;;
  esac
done

if [ "$FORCE" = false ]; then
    echo -n "⚠️  This will DELETE ALL DATA and reseed. Continue? (y/N) "
    read confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo -e "${YELLOW}Cancelled.${NC}"
        exit 0
    fi
fi

cd docker

echo -e "${YELLOW}📦 Step 1: Stopping API container...${NC}"
docker compose stop api >/dev/null 2>&1
echo -e "${GREEN}   ✓ API stopped${NC}"

echo ""
echo -e "${YELLOW}🗄️  Step 2: Resetting PostgreSQL database...${NC}"

# Drop and recreate the database
docker compose exec -T postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS restaurant_platform WITH (FORCE);" >/dev/null 2>&1 || true
docker compose exec -T postgres psql -U postgres -d postgres -c "CREATE DATABASE restaurant_platform;" >/dev/null 2>&1
echo -e "${GREEN}   ✓ Database reset${NC}"

echo ""
echo -e "${YELLOW}🚀 Step 3: Starting API container for migration...${NC}"
docker compose up -d api

echo -e "${GRAY}   ⏳ Waiting for API to be ready...${NC}"
max_attempts=30
attempt=0
ready=false

while [ $attempt -lt $max_attempts ] && [ "$ready" = false ]; do
    sleep 2
    attempt=$((attempt + 1))
    if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
        ready=true
    else
        echo -e "${GRAY}     Attempt $attempt/$max_attempts...${NC}"
    fi
done

if [ "$ready" = false ]; then
    echo -e "${RED}❌ API failed to start within expected time${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ API is ready${NC}"

echo ""
echo -e "${YELLOW}🌱 Step 4: Running database seed...${NC}"
docker compose exec api npx prisma db seed 2>&1 | while read line; do
    if echo "$line" | grep -qE "Created|seed|✅"; then
        echo -e "${GREEN}   $line${NC}"
    else
        echo -e "${GRAY}   $line${NC}"
    fi
done
echo -e "${GREEN}   ✓ Seed completed${NC}"

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  ✅ Database Reset & Seed Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${CYAN}📊 Login Credentials:${NC}"
echo -e "${WHITE}   Email:    owner@pizzapalace.com${NC}"
echo -e "${WHITE}   Password: password123${NC}"
echo ""
echo -e "${CYAN}🌐 Applications:${NC}"
echo -e "${WHITE}   POS/Admin: http://localhost:3001${NC}"
echo -e "${WHITE}   Online:    http://localhost:3002${NC}"
echo -e "${WHITE}   Walk-in 1: http://localhost:3002/menu?channel=walkin&station=front-1${NC}"
echo -e "${WHITE}   Walk-in 2: http://localhost:3002/menu?channel=walkin&station=front-2${NC}"
echo -e "${WHITE}   Walk-in 3: http://localhost:3002/menu?channel=walkin&station=front-3${NC}"
echo -e "${WHITE}   KDS:       http://localhost:3003${NC}"
echo -e "${WHITE}   Packing:   http://localhost:3004${NC}"
echo -e "${WHITE}   OSDU:      http://localhost:3005${NC}"
echo -e "${WHITE}   Driver:    http://localhost:3006${NC}"
echo ""
