# Salon Booking System

A full-stack web application for managing salon appointments. Salon owners can
configure their services and schedules, while customers can browse salons, book
time slots, and leave reviews -- all through an intuitive browser-based interface.

## Features

### For Salon Owners
- Register and set up a salon profile (name, address)
- Configure working hours (open time, close time, day off)
- Add/remove services with optional custom pricing
- View and manage bookings (confirm, reject)
- Receive notifications on booking events

### For Customers
- Browse all registered salons and their services
- View salon details, ratings, and reviews
- Check available time slots on a calendar
- Book one or more services in consecutive slots
- Confirm bookings within a 10-minute hold window
- Cancel bookings (pending or confirmed)
- Leave ratings and reviews for completed bookings

### System Features
- Session-based authentication with role-based access control
- Automatic slot generation with lunch break exclusion
- Booking hold mechanism with timeout (10 minutes)
- Cron jobs for: abandoned slot release, auto-confirm, mark completed
- Simulated email/SMS notifications logged to database and file
- Input validation on all API endpoints

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | HTML5, CSS3, jQuery 3.7, vanilla JavaScript |
| Backend    | Node.js, Express.js 4                       |
| Database   | PostgreSQL 14+                              |
| ORM        | Sequelize 6 with migrations and seeders     |
| Session    | express-session + connect-session-sequelize  |
| Scheduler  | node-cron                                   |
| Auth       | bcryptjs (password hashing)                 |

## Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **PostgreSQL** 14.0 or higher

## Quick Start

### Option A: Automated Setup

**Windows:**
```cmd
scripts\setup-windows.bat
```

**Linux / macOS:**
```bash
chmod +x scripts/setup-linux.sh
./scripts/setup-linux.sh
```

### Option B: Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file** in the project root:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=saloon_booking
   DB_USER=postgres
   DB_PASSWORD=postgres
   SESSION_SECRET=your-secret-key
   ```

3. **Create the PostgreSQL database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE saloon_booking;"
   ```

4. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Seed initial data:**
   ```bash
   npm run db:seed
   ```

6. **Start the server:**
   ```bash
   npm run dev
   ```

7. **Open** `http://localhost:3000` in your browser.

## Project Structure

```
saloon-booking-system/
├── config/
│   ├── app.js               # Application config (slots, lunch break)
│   ├── database.js           # Sequelize database config
│   └── session.js            # Express session config
├── db/
│   ├── migrations/           # 8 migration files (table creation)
│   └── seeders/              # 5 seeder files (demo data)
├── docs/
│   ├── HLD.md                # High-level design
│   ├── LLD.md                # Low-level design
│   ├── ER-DIAGRAM.md         # Entity-relationship diagram
│   ├── CLASS-DIAGRAM.md      # Class/module diagram
│   └── DEPLOYMENT.md         # Deployment guide
├── logs/                     # Notification log files (auto-created)
├── public/
│   ├── css/                  # Stylesheets
│   ├── js/                   # Frontend JavaScript
│   ├── lib/                  # jQuery library
│   ├── customer/             # Customer HTML pages
│   ├── owner/                # Owner HTML pages
│   ├── index.html            # Landing page
│   ├── login.html            # Login page
│   └── register.html         # Registration page
├── scripts/
│   ├── create-db.sql         # Database creation SQL
│   ├── setup-windows.bat     # Windows setup script
│   └── setup-linux.sh        # Linux/macOS setup script
├── src/
│   ├── controllers/          # Route handlers
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── customerController.js
│   │   └── ownerController.js
│   ├── jobs/                 # Cron job definitions
│   │   ├── autoConfirmBookings.js
│   │   ├── releaseAbandonedSlots.js
│   │   └── scheduler.js
│   ├── middleware/            # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── validationMiddleware.js
│   ├── models/               # Sequelize model definitions
│   ├── routes/               # Express route definitions
│   ├── services/             # Business logic layer
│   │   ├── authService.js
│   │   ├── bookingService.js
│   │   ├── notificationService.js
│   │   ├── ownerService.js
│   │   ├── reviewService.js
│   │   └── slotService.js
│   └── utils/                # Shared utilities
│       ├── logger.js
│       ├── timeUtils.js
│       └── validators.js
├── app.js                    # Express app configuration
├── server.js                 # Server entry point
├── package.json
└── .env                      # Environment variables (create manually)
```

## API Endpoints Summary

### Authentication (`/api/auth`)
| Method | Endpoint    | Description           |
|--------|-------------|-----------------------|
| POST   | /register   | Register a new user   |
| POST   | /login      | Log in                |
| POST   | /logout     | Log out               |
| GET    | /me         | Get current user info |

### Owner (`/api/owner`) -- requires owner role
| Method | Endpoint                 | Description              |
|--------|--------------------------|--------------------------|
| GET    | /profile                 | Get owner profile        |
| PUT    | /profile                 | Update salon name/address|
| PUT    | /schedule                | Update working hours     |
| GET    | /services                | List owner's services    |
| POST   | /services                | Add a service            |
| DELETE | /services/:serviceId     | Remove a service         |
| GET    | /bookings                | List bookings            |
| PUT    | /bookings/:id/confirm    | Confirm a booking        |
| PUT    | /bookings/:id/reject     | Reject a booking         |

### Customer (`/api/customer`) -- requires customer role
| Method | Endpoint                      | Description               |
|--------|-------------------------------|---------------------------|
| GET    | /owners                       | Browse salons             |
| GET    | /owners/:id                   | Get salon details         |
| GET    | /owners/:id/slots             | Get available time slots  |
| GET    | /bookings                     | List my bookings          |
| POST   | /bookings                     | Create a booking          |
| PUT    | /bookings/:id/confirm         | Confirm a booking         |
| PUT    | /bookings/:id/cancel          | Cancel a booking          |
| POST   | /reviews                      | Submit a review           |

### Public
| Method | Endpoint       | Description           |
|--------|----------------|-----------------------|
| GET    | /api/services  | List all services     |
| GET    | /api/health    | Health check          |

## Default Credentials (Seed Data)

After running seeders, the following accounts are available:

| Role     | Email                  | Password      | Name          |
|----------|------------------------|---------------|---------------|
| Owner    | owner@salon.com        | Owner@123     | Raj Kumar     |
| Customer | customer@example.com   | Customer@123  | Priya Sharma  |

**Seeded Services:** Haircut, Shave, Hair Color, Facial, Head Massage, Hair Spa

## npm Scripts

| Script          | Command                    | Description                       |
|-----------------|----------------------------|-----------------------------------|
| `start`         | `npm start`                | Start production server           |
| `dev`           | `npm run dev`              | Start with nodemon (auto-reload)  |
| `db:migrate`    | `npm run db:migrate`       | Run database migrations           |
| `db:migrate:undo`| `npm run db:migrate:undo` | Undo all migrations               |
| `db:seed`       | `npm run db:seed`          | Run all seeders                   |
| `db:seed:undo`  | `npm run db:seed:undo`     | Undo all seeders                  |
| `db:reset`      | `npm run db:reset`         | Undo migrations + re-migrate + re-seed |

## Screenshots

> Screenshots can be added here after the application is running.

| Page               | Description                                    |
|--------------------|------------------------------------------------|
| Landing Page       | _screenshot placeholder_                       |
| Login              | _screenshot placeholder_                       |
| Owner Dashboard    | _screenshot placeholder_                       |
| Customer Dashboard | _screenshot placeholder_                       |
| Booking Flow       | _screenshot placeholder_                       |
| Review Page        | _screenshot placeholder_                       |

## Documentation

Detailed design documents are available in the `docs/` folder:

- [High-Level Design](docs/HLD.md)
- [Low-Level Design](docs/LLD.md)
- [ER Diagram](docs/ER-DIAGRAM.md)
- [Class Diagram](docs/CLASS-DIAGRAM.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

This project is licensed under the [MIT License](LICENSE).
