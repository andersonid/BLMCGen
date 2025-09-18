#!/bin/bash

# BMC Markdown Generator - Local Test Script (Podman)
# This script helps test the application locally with Podman

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.podman.yml"

echo -e "${GREEN}BMC Markdown Generator - Local Test Script${NC}"
echo "================================================"

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}Podman is not installed. Please install Podman first.${NC}"
    echo "Installation guide: https://podman.io/getting-started/installation"
    exit 1
fi

# Check if Podman Compose is available
if ! command -v podman-compose &> /dev/null; then
    echo -e "${YELLOW}Installing podman-compose...${NC}"
    pip3 install podman-compose
fi

echo -e "${GREEN}Podman is available${NC}"

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p backend/node_modules

echo -e "${GREEN}Directories created${NC}"

# Stop any existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
podman-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans || true

# Build and start services
echo -e "${YELLOW}Building and starting services...${NC}"
podman-compose -f $DOCKER_COMPOSE_FILE build --no-cache
podman-compose -f $DOCKER_COMPOSE_FILE up -d

echo -e "${GREEN}Services started${NC}"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}Backend is healthy${NC}"
else
    echo -e "${RED}Backend health check failed${NC}"
    podman-compose -f $DOCKER_COMPOSE_FILE logs backend
    exit 1
fi

# Check database connection
if podman-compose -f $DOCKER_COMPOSE_FILE exec -T db pg_isready -U bmcuser -d bmcdb > /dev/null 2>&1; then
    echo -e "${GREEN}Database is ready${NC}"
else
    echo -e "${RED}Database is not ready${NC}"
    podman-compose -f $DOCKER_COMPOSE_FILE logs db
    exit 1
fi

# Check Redis
if podman-compose -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}Redis is ready${NC}"
else
    echo -e "${RED}Redis is not ready${NC}"
    podman-compose -f $DOCKER_COMPOSE_FILE logs redis
    exit 1
fi

# Show running containers
echo -e "${GREEN}Running containers:${NC}"
podman-compose -f $DOCKER_COMPOSE_FILE ps

# Show logs
echo -e "${YELLOW}Recent logs:${NC}"
podman-compose -f $DOCKER_COMPOSE_FILE logs --tail=20

echo ""
echo -e "${GREEN}Local test completed successfully!${NC}"
echo "================================================"
echo -e "${GREEN}Frontend: http://localhost${NC}"
echo -e "${GREEN}API: http://localhost/api${NC}"
echo -e "${GREEN}Health: http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs: podman-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo "  Stop services: podman-compose -f $DOCKER_COMPOSE_FILE down"
echo "  Restart services: podman-compose -f $DOCKER_COMPOSE_FILE restart"
echo "  Update services: podman-compose -f $DOCKER_COMPOSE_FILE pull && podman-compose -f $DOCKER_COMPOSE_FILE up -d"
echo ""
echo -e "${YELLOW}Testing endpoints:${NC}"
echo "  Register: curl -X POST http://localhost:3001/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"name\":\"Test User\",\"password\":\"password123\"}'"
echo "  Health: curl http://localhost:3001/health"
