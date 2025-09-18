#!/bin/bash

# BMC Markdown Generator - Deploy Script
# This script helps deploy the application to a cloud server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

echo -e "${GREEN}BMC Markdown Generator - Deploy Script${NC}"
echo "================================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo -e "${RED}Please don't run this script as root${NC}"
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Environment file $ENV_FILE not found.${NC}"
    echo "Please copy .env.production.example to $ENV_FILE and configure it:"
    echo "cp .env.production.example $ENV_FILE"
    echo "nano $ENV_FILE"
    exit 1
fi

# Load environment variables
source $ENV_FILE

echo -e "${GREEN}Environment file loaded${NC}"

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p backups
mkdir -p ssl
mkdir -p logs

# Set proper permissions
chmod 755 backups
chmod 755 ssl
chmod 755 logs

echo -e "${GREEN}Directories created${NC}"

# Build and start services
echo -e "${YELLOW}Building and starting services...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
docker-compose -f $DOCKER_COMPOSE_FILE up -d

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
    docker-compose -f $DOCKER_COMPOSE_FILE logs backend
    exit 1
fi

# Check database connection
if docker-compose -f $DOCKER_COMPOSE_FILE exec -T db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; then
    echo -e "${GREEN}Database is ready${NC}"
else
    echo -e "${RED}Database is not ready${NC}"
    docker-compose -f $DOCKER_COMPOSE_FILE logs db
    exit 1
fi

# Check Redis
if docker-compose -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}Redis is ready${NC}"
else
    echo -e "${RED}Redis is not ready${NC}"
    docker-compose -f $DOCKER_COMPOSE_FILE logs redis
    exit 1
fi

# Show running containers
echo -e "${GREEN}Running containers:${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE ps

# Show logs
echo -e "${YELLOW}Recent logs:${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=20

echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "================================================"
echo -e "${GREEN}Frontend: http://localhost${NC}"
echo -e "${GREEN}API: http://localhost/api${NC}"
echo -e "${GREEN}Health: http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo "  Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
echo "  Restart services: docker-compose -f $DOCKER_COMPOSE_FILE restart"
echo "  Update services: docker-compose -f $DOCKER_COMPOSE_FILE pull && docker-compose -f $DOCKER_COMPOSE_FILE up -d"
echo ""
echo -e "${YELLOW}Security reminders:${NC}"
echo "  - Change default passwords in $ENV_FILE"
echo "  - Configure SSL certificates in ./ssl/"
echo "  - Set up firewall rules"
echo "  - Configure backup strategy"
echo "  - Monitor logs regularly"
