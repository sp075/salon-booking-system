@echo off
REM ============================================================
REM  Salon Booking System - Windows Setup Script
REM ============================================================
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   Salon Booking System - Setup
echo ============================================================
echo.

REM ------------------------------------------------------------
REM  1. Check for Node.js
REM ------------------------------------------------------------
echo [1/6] Checking for Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo       Found Node.js %NODE_VER%

REM ------------------------------------------------------------
REM  2. Check for PostgreSQL (psql)
REM ------------------------------------------------------------
echo [2/6] Checking for PostgreSQL...
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: PostgreSQL client (psql) is not installed or not in PATH.
    echo Please install PostgreSQL 14+ from https://www.postgresql.org
    echo Make sure the bin directory is in your PATH.
    exit /b 1
)
for /f "tokens=*" %%v in ('psql --version') do set PSQL_VER=%%v
echo       Found %PSQL_VER%

REM ------------------------------------------------------------
REM  3. Install npm dependencies
REM ------------------------------------------------------------
echo [3/6] Installing npm dependencies...
cd /d "%~dp0.."
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm install failed.
    exit /b 1
)
echo       Dependencies installed successfully.

REM ------------------------------------------------------------
REM  4. Create database
REM ------------------------------------------------------------
echo [4/6] Creating database...
echo.
set /p PGPASSWORD="Enter PostgreSQL password for user 'postgres': "

REM Check if database already exists
psql -U postgres -h localhost -tc "SELECT 1 FROM pg_database WHERE datname='saloon_booking'" | findstr "1" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo       Database 'saloon_booking' already exists. Skipping creation.
) else (
    psql -U postgres -h localhost -c "CREATE DATABASE saloon_booking;"
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to create database. Check your PostgreSQL credentials.
        exit /b 1
    )
    echo       Database 'saloon_booking' created successfully.
)

REM ------------------------------------------------------------
REM  5. Run migrations and seeders
REM ------------------------------------------------------------
echo [5/6] Running migrations...
call npx sequelize-cli db:migrate
if %ERRORLEVEL% neq 0 (
    echo ERROR: Migrations failed.
    exit /b 1
)
echo       Migrations completed successfully.

echo [5/6] Running seeders...
call npx sequelize-cli db:seed:all
if %ERRORLEVEL% neq 0 (
    echo WARNING: Seeders may have partially failed. Check if data already exists.
)
echo       Seeders completed.

REM ------------------------------------------------------------
REM  6. Create .env file if not exists
REM ------------------------------------------------------------
if not exist ".env" (
    echo [6/6] Creating .env file...
    (
        echo PORT=3000
        echo NODE_ENV=development
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=saloon_booking
        echo DB_USER=postgres
        echo DB_PASSWORD=%PGPASSWORD%
        echo SESSION_SECRET=dev-secret-change-in-production
        echo SESSION_MAX_AGE=86400000
        echo SLOT_DURATION_MINUTES=30
        echo HOLD_TIMEOUT_MINUTES=10
        echo LUNCH_START=13:00
        echo LUNCH_END=14:00
    ) > .env
    echo       .env file created.
) else (
    echo [6/6] .env file already exists. Skipping.
)

REM ------------------------------------------------------------
REM  Done - Start server
REM ------------------------------------------------------------
echo.
echo ============================================================
echo   Setup Complete!
echo ============================================================
echo.
echo   Default credentials:
echo     Owner:    owner@salon.com / Owner@123
echo     Customer: customer@example.com / Customer@123
echo.
echo   Starting the server...
echo.

call npm start

endlocal
