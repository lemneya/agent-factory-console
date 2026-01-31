#!/bin/bash
# ============================================================================
# DEPLOY-0: Production Deployment Script
# ============================================================================
# Usage: ./scripts/deploy.sh [staging|production] [--with-db]
#
# Arguments:
#   staging|production  - Environment to deploy (default: production)
#   --with-db           - Use local PostgreSQL container instead of external DB
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - .env.production (or .env.staging) file configured
#   - Database accessible (external or use --with-db for local)
#
# Examples:
#   ./scripts/deploy.sh production           # External database
#   ./scripts/deploy.sh production --with-db # Local PostgreSQL container
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
ENVIRONMENT="${1:-production}"
USE_LOCAL_DB=false

# Check for --with-db flag
for arg in "$@"; do
    case $arg in
        --with-db)
            USE_LOCAL_DB=true
            shift
            ;;
    esac
done

ENV_FILE=".env.${ENVIRONMENT}"
DB_PROFILES=""
if [ "$USE_LOCAL_DB" = true ]; then
    DB_PROFILES="--profile with-db"
    log_info "Local database mode enabled (--with-db)"
fi

log_info "Starting deployment for: ${ENVIRONMENT}"

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================
log_info "Running pre-flight checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Check env file exists
if [ ! -f "$ENV_FILE" ]; then
    log_error "Environment file not found: $ENV_FILE"
    log_info "Copy .env.production.example to $ENV_FILE and configure it"
    exit 1
fi

# Load environment
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Validate required variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "GITHUB_CLIENT_ID"
    "GITHUB_CLIENT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Required variable not set: $var"
        exit 1
    fi
done

# SECURITY CHECK: Verify dev bypass is disabled
if [ "${NEXT_PUBLIC_DEV_AUTH_BYPASS}" = "true" ]; then
    log_error "SECURITY: NEXT_PUBLIC_DEV_AUTH_BYPASS is enabled!"
    log_error "This MUST be 'false' or unset in production."
    exit 1
fi

log_info "Pre-flight checks passed"

# ============================================================================
# BUILD
# ============================================================================
log_info "Building production images..."

docker compose -f docker-compose.production.yml --env-file "$ENV_FILE" $DB_PROFILES build

log_info "Build complete"

# ============================================================================
# DATABASE (if using local db)
# ============================================================================
if [ "$USE_LOCAL_DB" = true ]; then
    log_info "Starting local database..."
    docker compose -f docker-compose.production.yml --env-file "$ENV_FILE" $DB_PROFILES up -d db

    # Wait for database to be healthy
    log_info "Waiting for database to be ready..."
    RETRY_COUNT=0
    MAX_DB_RETRIES=30
    while [ $RETRY_COUNT -lt $MAX_DB_RETRIES ]; do
        if docker compose -f docker-compose.production.yml --env-file "$ENV_FILE" $DB_PROFILES exec -T db pg_isready -U postgres > /dev/null 2>&1; then
            log_info "Database is ready!"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log_warn "Waiting for database... attempt $RETRY_COUNT/$MAX_DB_RETRIES"
        sleep 2
    done

    if [ $RETRY_COUNT -eq $MAX_DB_RETRIES ]; then
        log_error "Database failed to start"
        exit 1
    fi
fi

# ============================================================================
# DATABASE MIGRATION
# ============================================================================
log_info "Running database migrations..."

# Run migrations (uses migrator target with prisma CLI)
docker compose -f docker-compose.production.yml --env-file "$ENV_FILE" $DB_PROFILES --profile migrate run --rm migrate

log_info "Migrations complete"

# ============================================================================
# DEPLOY
# ============================================================================
log_info "Starting services..."

# Stop existing services (except db if using local)
docker compose -f docker-compose.production.yml --env-file "$ENV_FILE" down --remove-orphans 2>/dev/null || true

# Start services
if [ "$USE_LOCAL_DB" = true ]; then
    docker compose -f docker-compose.production.yml --env-file "$ENV_FILE" $DB_PROFILES up -d db web
else
    docker compose -f docker-compose.production.yml --env-file "$ENV_FILE" up -d web
fi

# Wait for health check
log_info "Waiting for health check..."
HEALTH_CHECK_URL="${NEXTAUTH_URL}/api/health"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" | grep -q "200"; then
        log_info "Health check passed!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log_warn "Health check attempt $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "Health check failed after $MAX_RETRIES attempts"
    log_error "Check logs: docker compose -f docker-compose.production.yml logs web"
    exit 1
fi

# ============================================================================
# POST-DEPLOY
# ============================================================================
log_info "Deployment complete!"
log_info "Application running at: ${NEXTAUTH_URL}"
log_info ""
log_info "Useful commands:"
log_info "  View logs:    docker compose -f docker-compose.production.yml logs -f web"
log_info "  Stop:         docker compose -f docker-compose.production.yml down"
log_info "  Health check: curl ${NEXTAUTH_URL}/api/health"
