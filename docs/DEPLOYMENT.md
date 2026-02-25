# Deployment Guide - Salon Booking System

## 1. Prerequisites

| Software     | Minimum Version | Download                          |
|--------------|-----------------|-----------------------------------|
| Node.js      | 18.0+           | https://nodejs.org                |
| npm          | 9.0+            | Bundled with Node.js              |
| PostgreSQL   | 14.0+           | https://www.postgresql.org        |

Verify installation:

```bash
node --version    # should print v18.x or higher
npm --version     # should print 9.x or higher
psql --version    # should print psql (PostgreSQL) 14.x or higher
```

## 2. Clone and Install Dependencies

```bash
git clone <repository-url> saloon-booking-system
cd saloon-booking-system
npm install
```

## 3. Environment Setup

Create a `.env` file in the project root:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saloon_booking
DB_USER=postgres
DB_PASSWORD=postgres

# Session
SESSION_SECRET=your-super-secret-key-change-in-production
SESSION_MAX_AGE=86400000

# Application
SLOT_DURATION_MINUTES=30
HOLD_TIMEOUT_MINUTES=10
LUNCH_START=13:00
LUNCH_END=14:00
```

**Important**: Change `SESSION_SECRET` and `DB_PASSWORD` for production environments.

## 4. Database Setup

### 4.1 Create the Database

Connect to PostgreSQL and create the database:

```bash
# Using psql
psql -U postgres -h localhost

# Inside psql:
CREATE DATABASE saloon_booking;
\q
```

Or use the provided SQL script:

```bash
psql -U postgres -h localhost -f scripts/create-db.sql
```

### 4.2 Run Migrations

Migrations create all required tables:

```bash
npm run db:migrate
```

This creates the following tables in order:
1. `users`
2. `owner_profiles`
3. `services`
4. `owner_services`
5. `bookings`
6. `booking_services`
7. `reviews`
8. `notifications`

### 4.3 Run Seeders

Seeders populate initial data (master services, demo owner, demo customer):

```bash
npm run db:seed
```

### 4.4 Reset Database (if needed)

To drop all tables and re-run migrations and seeds:

```bash
npm run db:reset
```

## 5. Starting the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

This uses `nodemon` to watch for file changes and restart automatically.

### Production Mode

```bash
npm start
```

The server starts on `http://localhost:3000` (or the port specified in `.env`).

## 6. Verifying the Setup

1. Open `http://localhost:3000` in a browser. You should see the landing page.
2. Check the health endpoint: `GET http://localhost:3000/api/health`.
3. Log in with the seeded accounts:

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Owner    | owner@salon.com        | Owner@123     |
| Customer | customer@example.com   | Customer@123  |

## 7. Production Considerations

### 7.1 Environment Variables

- Set `NODE_ENV=production` to enable secure cookies and disable stack traces.
- Use a strong, unique `SESSION_SECRET` (at least 32 random characters).
- Use a strong `DB_PASSWORD`.

### 7.2 Database

- Use a managed PostgreSQL service (AWS RDS, Azure Database, etc.) for reliability.
- Enable SSL connections by adding to the Sequelize config:
  ```js
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
  ```
- Set up regular automated backups.

### 7.3 Process Management

Use a process manager for production:

```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name salon-booking
pm2 save
pm2 startup
```

### 7.4 Reverse Proxy

Place the app behind Nginx or a load balancer:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

When behind a proxy, add to Express config:
```js
app.set('trust proxy', 1);
```

### 7.5 Logging

- In production, consider using a log aggregation service (e.g., Datadog, ELK stack).
- Notification logs are written to `logs/notifications.log`.
- Rotate log files to prevent disk space issues.

### 7.6 Security Checklist

- [ ] Change all default passwords and secrets
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set secure and httpOnly cookie flags (automatic in production mode)
- [ ] Rate-limit API endpoints (consider `express-rate-limit`)
- [ ] Add CORS headers if frontend is on a different domain
- [ ] Keep dependencies updated (`npm audit`)

## 8. Troubleshooting

| Issue                              | Solution                                      |
|------------------------------------|-----------------------------------------------|
| `ECONNREFUSED` on DB connect       | Ensure PostgreSQL is running on the configured host/port |
| `relation does not exist`          | Run `npm run db:migrate`                      |
| `password authentication failed`   | Check `DB_USER` and `DB_PASSWORD` in `.env`   |
| Port already in use                | Change `PORT` in `.env` or kill the existing process |
| Session not persisting             | Ensure `SESSION_SECRET` is set and DB is connected |
