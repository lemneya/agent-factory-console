#!/bin/bash
# ============================================================================
# DEPLOY-0: Database Migration Script
# ============================================================================
# Usage: ./scripts/migrate.sh [--dry-run]
#
# Options:
#   --dry-run    Show what migrations would be applied without executing
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

DRY_RUN=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true ;;
        *) log_error "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    # Try to load from env file
    if [ -f ".env.production" ]; then
        export $(grep -v '^#' .env.production | grep DATABASE_URL | xargs)
    elif [ -f ".env" ]; then
        export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL is not set"
    log_info "Set DATABASE_URL environment variable or create .env file"
    exit 1
fi

log_info "Running database migrations..."

if [ "$DRY_RUN" = true ]; then
    log_info "Dry run mode - showing pending migrations"
    npx prisma migrate status
else
    log_info "Applying migrations..."
    npx prisma migrate deploy

    log_info "Generating Prisma client..."
    npx prisma generate

    log_info "Migrations complete!"
fi
