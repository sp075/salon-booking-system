#!/bin/bash
# ============================================================
#  Salon Booking System - Linux/Mac Setup Script
# ============================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "============================================================"
echo "  Salon Booking System - Setup"
echo "============================================================"
echo ""

# Get the project root directory (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# ------------------------------------------------------------
#  1. Check for Node.js
# ------------------------------------------------------------
echo -e "[1/6] Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed.${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODE_VER=$(node --version)
echo -e "      Found Node.js ${GREEN}${NODE_VER}${NC}"

# Check minimum version (18+)
NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}ERROR: Node.js 18+ is required. Found ${NODE_VER}.${NC}"
    exit 1
fi

# ------------------------------------------------------------
#  2. Check for PostgreSQL (psql)
# ------------------------------------------------------------
echo -e "[2/6] Checking for PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}ERROR: PostgreSQL client (psql) is not installed.${NC}"
    echo "Install PostgreSQL 14+:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-client"
    echo "  macOS:         brew install postgresql"
    exit 1
fi
PSQL_VER=$(psql --version)
echo -e "      Found ${GREEN}${PSQL_VER}${NC}"

# ------------------------------------------------------------
#  3. Install npm dependencies
# ------------------------------------------------------------
echo -e "[3/6] Installing npm dependencies..."
npm install
echo -e "      ${GREEN}Dependencies installed successfully.${NC}"

# ------------------------------------------------------------
#  4. Create database
# ------------------------------------------------------------
echo -e "[4/6] Creating database..."

DB_NAME="saloon_booking"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Check if database exists
DB_EXISTS=$(psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -tc \
    "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null | tr -d '[:space:]')

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "      ${YELLOW}Database '${DB_NAME}' already exists. Skipping creation.${NC}"
else
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "      ${GREEN}Database '${DB_NAME}' created successfully.${NC}"
    else
        echo -e "${RED}ERROR: Failed to create database.${NC}"
        echo "You may need to provide a password or adjust pg_hba.conf."
        echo "Try running manually: createdb -U postgres ${DB_NAME}"
        exit 1
    fi
fi

# ------------------------------------------------------------
#  5. Create .env file if not exists
# ------------------------------------------------------------
if [ ! -f ".env" ]; then
    echo -e "[5/6] Creating .env file..."
    cat > .env << 'EOF'
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saloon_booking
DB_USER=postgres
DB_PASSWORD=postgres
SESSION_SECRET=dev-secret-change-in-production
SESSION_MAX_AGE=86400000
SLOT_DURATION_MINUTES=30
HOLD_TIMEOUT_MINUTES=10
LUNCH_START=13:00
LUNCH_END=14:00
EOF
    echo -e "      ${GREEN}.env file created.${NC}"
    echo -e "      ${YELLOW}Please update DB_PASSWORD in .env if needed.${NC}"
else
    echo -e "[5/6] .env file already exists. Skipping."
fi

# ------------------------------------------------------------
#  6. Run migrations and seeders
# ------------------------------------------------------------
echo -e "[6/6] Running migrations..."
npx sequelize-cli db:migrate
echo -e "      ${GREEN}Migrations completed successfully.${NC}"

echo -e "      Running seeders..."
npx sequelize-cli db:seed:all || {
    echo -e "      ${YELLOW}WARNING: Seeders may have partially failed (data might already exist).${NC}"
}
echo -e "      ${GREEN}Seeders completed.${NC}"

# ------------------------------------------------------------
#  Done
# ------------------------------------------------------------
echo ""
echo "============================================================"
echo -e "  ${GREEN}Setup Complete!${NC}"
echo "============================================================"
echo ""
echo "  Default credentials:"
echo "    Owner:    owner@salon.com / Owner@123"
echo "    Customer: customer@example.com / Customer@123"
echo ""
echo "  Start the server:"
echo "    npm start       (production)"
echo "    npm run dev     (development with auto-reload)"
echo ""
echo "  The server will be available at http://localhost:3000"
echo ""

# Ask if user wants to start the server now
read -p "Start the server now? (y/n): " START_SERVER
if [ "$START_SERVER" = "y" ] || [ "$START_SERVER" = "Y" ]; then
    echo ""
    echo "Starting the server..."
    npm start
fi
