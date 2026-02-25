# High-Level Design (HLD) - Salon Booking System

## 1. System Overview

The Salon Booking System is a full-stack web application that allows salon owners to
manage their services and schedule, and customers to browse salons, book appointments,
and leave reviews. The system follows a **3-tier architecture**:

- **Presentation Tier** -- Static HTML/CSS/JS frontend served by Express.js
- **Application Tier** -- Express.js REST API with session-based authentication
- **Data Tier** -- PostgreSQL relational database accessed via Sequelize ORM

## 2. Architecture Diagram

```
+------------------------------------------------------------------+
|                        CLIENT (Browser)                          |
|   +------------------+  +------------------+  +----------------+ |
|   | Landing / Auth   |  | Owner Dashboard  |  | Customer Views | |
|   | (HTML + jQuery)  |  | (HTML + jQuery)  |  | (HTML + jQuery)| |
|   +--------+---------+  +--------+---------+  +-------+--------+ |
+------------|------------------------|-----------------|-----------+
             |         HTTPS / JSON   |                 |
             v                        v                 v
+------------------------------------------------------------------+
|                    EXPRESS.js  API  SERVER                        |
|                                                                  |
|  +------------+  +------------+  +-----------+  +--------------+ |
|  |   Auth     |  |   Owner    |  |  Customer |  |   Booking    | |
|  |  Routes    |  |  Routes    |  |  Routes   |  |   Routes     | |
|  +-----+------+  +-----+------+  +-----+-----+  +------+------+ |
|        |               |               |                |        |
|  +-----v------+  +-----v------+  +-----v-----+  +------v------+ |
|  |   Auth     |  |   Owner    |  |  Customer  |  |   Booking   | |
|  | Controller |  | Controller |  | Controller |  |  Controller | |
|  +-----+------+  +-----+------+  +-----+-----+  +------+------+ |
|        |               |               |                |        |
|  +-----v------+  +-----v------+  +-----v-----+  +------v------+ |
|  |   Auth     |  |   Owner    |  |   Slot     |  |  Booking    | |
|  |  Service   |  |  Service   |  |  Service   |  |  Service    | |
|  +-----+------+  +-----+------+  +-----+-----+  +------+------+ |
|        |               |               |                |        |
|  +-----+---------------+---------------+-------+--------+------+ |
|  |              Sequelize ORM  (Models Layer)                  | |
|  +-----------------------------+-------------------------------+ |
|                                |                                 |
|  +-----------------------------v-------------------------------+ |
|  |         Middleware: Auth | Validation | ErrorHandler        | |
|  +---------------------------------------------------------+  | |
|  |         Jobs: Scheduler | AutoConfirm | ReleaseAbandoned|  | |
|  +---------------------------------------------------------+  | |
|  |         Utils: Logger | TimeUtils | Validators           |  | |
|  +-----------------------------------------------------------+ |
+------------------------------------------------------------------+
             |
             v
+------------------------------------------------------------------+
|                      POSTGRESQL DATABASE                         |
|                                                                  |
|  users | owner_profiles | services | owner_services              |
|  bookings | booking_services | reviews | notifications           |
|  Sessions (connect-session-sequelize)                            |
+------------------------------------------------------------------+
```

## 3. Component Overview

| Component       | Responsibility                                          |
|-----------------|---------------------------------------------------------|
| **Auth**        | User registration, login, logout, session management    |
| **Owner**       | Profile management, schedule, services, booking actions |
| **Customer**    | Browse salons, view details, query available slots      |
| **Booking**     | Create bookings with hold, confirm, cancel, review      |
| **Notification**| Log email/SMS notifications to DB and file              |
| **Scheduler**   | Cron jobs: release abandoned holds, auto-confirm, mark completed |
| **Slot Engine** | Generate time slots, exclude lunch, check availability  |

## 4. Technology Choices and Rationale

| Technology           | Rationale                                                |
|----------------------|----------------------------------------------------------|
| **Node.js + Express**| Lightweight, non-blocking I/O, large ecosystem           |
| **PostgreSQL**       | ACID compliance, strong relational model for bookings    |
| **Sequelize ORM**    | Model definitions, migrations, seeders, query abstraction|
| **express-session**  | Server-side session with cookie; simple, no JWT overhead |
| **connect-session-sequelize** | Store sessions in PostgreSQL for persistence   |
| **bcryptjs**         | Secure password hashing with configurable salt rounds    |
| **node-cron**        | Lightweight in-process cron for scheduled background jobs|
| **jQuery 3.7**       | Simple DOM manipulation for a server-rendered frontend   |
| **dotenv**           | Environment variable management for configuration        |
| **uuid**             | Generate UUID v4 primary keys for users and bookings     |

## 5. Data Flow Overview

### 5.1 Registration Flow
1. Customer/Owner submits registration form.
2. Validation middleware checks fields.
3. `authService.register()` hashes password, creates User (and OwnerProfile if owner).
4. Session is created; user ID and role stored in session.

### 5.2 Booking Flow
1. Customer browses owners, selects a salon.
2. Customer picks a date; frontend requests available slots via `GET /api/customer/owners/:id/slots`.
3. Slot engine generates slots from open-to-close, excludes lunch, filters booked slots.
4. Customer selects a start time and services, submits `POST /api/customer/bookings`.
5. Booking is created with status `pending` and `heldAt` timestamp.
6. Customer confirms within 10-minute hold window via `PUT /api/customer/bookings/:id/confirm`.
7. If not confirmed in time, the cron job marks booking as `abandoned`.

### 5.3 Owner Booking Management
1. Owner views bookings filtered by date/status.
2. Owner can confirm or reject pending bookings.
3. Notifications are logged for booking state changes.

### 5.4 Scheduled Jobs
- **Every 1 min**: Release abandoned bookings where `heldAt` exceeds timeout.
- **Every 5 min**: Auto-confirm pending bookings within 30 min of start time.
- **Every 15 min**: Mark confirmed bookings as `completed` after end time.

### 5.5 Review Flow
1. After a booking is marked `completed`, customer can submit a review.
2. Review is created; owner's `avg_rating` and `total_reviews` are recalculated via SQL.
