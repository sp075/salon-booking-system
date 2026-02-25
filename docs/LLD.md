# Low-Level Design (LLD) - Salon Booking System

## 1. Module Breakdown

### 1.1 Models (`src/models/`)

| Model          | Table              | PK Type   | Key Fields                                  |
|----------------|--------------------|-----------|---------------------------------------------|
| User           | users              | UUID      | email, mobile, password, firstName, lastName, role |
| OwnerProfile   | owner_profiles     | UUID      | userId, salonName, address, openTime, closeTime, dayOff, avgRating, totalReviews |
| Service        | services           | INTEGER   | name, defaultPrice, durationMinutes         |
| OwnerService   | owner_services     | INTEGER   | ownerProfileId, serviceId, isActive, customPrice |
| Booking        | bookings           | UUID      | customerId, ownerProfileId, bookingDate, startTime, endTime, totalPrice, status, heldAt |
| BookingService | booking_services   | INTEGER   | bookingId, serviceId, slotStart, slotEnd, price |
| Review         | reviews            | INTEGER   | customerId, ownerProfileId, bookingId, rating, comment |
| Notification   | notifications      | INTEGER   | userId, type, recipient, subject, body, status |

### 1.2 Services (`src/services/`)

| Service             | Methods                                                      |
|---------------------|--------------------------------------------------------------|
| authService         | `register()`, `login()`, `getUserById()`                     |
| ownerService        | `getProfile()`, `updateProfile()`, `updateSchedule()`, `getServices()`, `addService()`, `removeService()`, `getBookings()`, `confirmBooking()`, `rejectBooking()` |
| slotService         | `generateAllSlots()`, `excludeLunchSlots()`, `getBookedSlots()`, `getAvailableSlots()`, `validateBookingSlots()` |
| bookingService      | `createBooking()`, `confirmBooking()`, `cancelBooking()`, `getCustomerBookings()`, `getBookingById()` |
| reviewService       | `createReview()`, `getOwnerReviews()`                        |
| notificationService | `sendEmail()`, `sendSMS()`, `notifyBookingConfirmed()`, `notifyBookingRejected()`, `notifyBookingCancelled()` |

### 1.3 Controllers (`src/controllers/`)

| Controller          | Methods                                                      |
|---------------------|--------------------------------------------------------------|
| authController      | `register()`, `login()`, `logout()`, `me()`                 |
| ownerController     | `getProfile()`, `updateProfile()`, `updateSchedule()`, `getServices()`, `addService()`, `removeService()`, `getBookings()`, `confirmBooking()`, `rejectBooking()` |
| customerController  | `browseOwners()`, `getOwnerDetail()`, `getAvailableSlots()` |
| bookingController   | `createBooking()`, `confirmBooking()`, `cancelBooking()`, `getMyBookings()`, `submitReview()` |

### 1.4 Middleware (`src/middleware/`)

| Middleware            | Purpose                                                    |
|-----------------------|------------------------------------------------------------|
| authMiddleware        | `isAuthenticated()` checks session; `isRole(role)` checks role |
| validationMiddleware  | `validateRegistration()`, `validateLogin()`, `validateBooking()`, `validateReview()` |
| errorHandler          | Global error handler; maps `err.statusCode` to HTTP response |

### 1.5 Jobs (`src/jobs/`)

| Job                   | Schedule     | Description                                |
|-----------------------|--------------|--------------------------------------------|
| releaseAbandonedSlots | Every 1 min  | Mark pending bookings with expired hold as `abandoned` |
| autoConfirmBookings   | Every 5 min  | Auto-confirm pending bookings within 30 min of start |
| markCompleted         | Every 15 min | Mark confirmed bookings as `completed` after end time passes |

## 2. Key Algorithms

### 2.1 Slot Generation Algorithm

```
INPUT: openTime, closeTime, durationMinutes (default 30)
OUTPUT: Array of { start, end } slot objects

1. Convert openTime to minutes since midnight -> currentStart
2. Convert closeTime to minutes since midnight -> endMins
3. WHILE currentStart + durationMinutes <= endMins:
   a. currentEnd = currentStart + durationMinutes
   b. Push { start: toTimeString(currentStart), end: toTimeString(currentEnd) }
   c. currentStart = currentEnd
4. Filter out slots overlapping lunch break (13:00-14:00)
   - A slot overlaps if slotStart < lunchEnd AND slotEnd > lunchStart
5. Query existing bookings (status: pending/confirmed) for the date
6. Filter out slots that overlap any booked slot
7. If multiple services requested, find consecutive windows of N slots
```

### 2.2 Booking Hold and Release

```
CREATE BOOKING:
1. Validate requested slots are available
2. Create Booking with status='pending', heldAt=NOW() inside a transaction
3. Create BookingService rows for each service-slot pair

CUSTOMER CONFIRM (within hold timeout):
1. Verify booking belongs to customer and status='pending'
2. Check (NOW - heldAt) <= HOLD_TIMEOUT_MINUTES (default 10)
3. Update status='confirmed', heldAt=NULL

RELEASE ABANDONED (cron every 1 min):
1. Find bookings WHERE status='pending' AND heldAt IS NOT NULL AND heldAt < (NOW - timeout)
2. Bulk update status='abandoned'
```

### 2.3 Auto-Confirm and Mark Completed

```
AUTO-CONFIRM (cron every 5 min):
1. Calculate threshold = currentTime + 30 minutes
2. Update bookings WHERE status='pending' AND bookingDate=today AND startTime <= threshold
3. Set status='confirmed'

MARK COMPLETED (cron every 15 min):
1. Update bookings WHERE status='confirmed' AND bookingDate <= today AND endTime <= currentTime
2. Set status='completed'
```

## 3. API Endpoint Details

### 3.1 Authentication (`/api/auth`)

| Method | Endpoint          | Auth | Body/Params                                       | Response     |
|--------|-------------------|------|---------------------------------------------------|--------------|
| POST   | `/auth/register`  | No   | `{ email, mobile, password, firstName, lastName, role }` | 201 User     |
| POST   | `/auth/login`     | No   | `{ email, password }`                             | 200 User     |
| POST   | `/auth/logout`    | Yes  | --                                                | 200 message  |
| GET    | `/auth/me`        | Yes  | --                                                | 200 User     |

### 3.2 Owner (`/api/owner`) -- requires `owner` role

| Method | Endpoint                  | Body/Params                        | Response        |
|--------|---------------------------|------------------------------------|-----------------|
| GET    | `/owner/profile`          | --                                 | 200 Profile     |
| PUT    | `/owner/profile`          | `{ salonName, address }`           | 200 Profile     |
| PUT    | `/owner/schedule`         | `{ openTime, closeTime, dayOff }`  | 200 Profile     |
| GET    | `/owner/services`         | --                                 | 200 Service[]   |
| POST   | `/owner/services`         | `{ serviceId, customPrice }`       | 201 OwnerService|
| DELETE | `/owner/services/:serviceId` | --                              | 200 { removed } |
| GET    | `/owner/bookings`         | `?date=&status=`                   | 200 Booking[]   |
| PUT    | `/owner/bookings/:id/confirm` | --                             | 200 Booking     |
| PUT    | `/owner/bookings/:id/reject`  | --                             | 200 Booking     |

### 3.3 Customer (`/api/customer`) -- requires `customer` role

| Method | Endpoint                        | Body/Params                                          | Response       |
|--------|---------------------------------|------------------------------------------------------|----------------|
| GET    | `/customer/owners`              | `?service=`                                          | 200 Owner[]    |
| GET    | `/customer/owners/:id`          | --                                                   | 200 Owner      |
| GET    | `/customer/owners/:id/slots`    | `?date=&services=1,2`                                | 200 Slot[]     |
| GET    | `/customer/bookings`            | --                                                   | 200 Booking[]  |
| POST   | `/customer/bookings`            | `{ ownerProfileId, bookingDate, startTime, serviceIds }` | 201 Booking    |
| PUT    | `/customer/bookings/:id/confirm`| --                                                   | 200 Booking    |
| PUT    | `/customer/bookings/:id/cancel` | --                                                   | 200 Booking    |
| POST   | `/customer/reviews`             | `{ bookingId, rating, comment }`                     | 201 Review     |

### 3.4 Public Endpoints

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | `/api/services`  | List all master services |
| GET    | `/api/health`    | Health check             |

## 4. Error Handling Strategy

All errors follow a consistent pattern:

1. Service layer throws errors with `err.statusCode` and `err.message`.
2. Controllers call `next(err)` to pass errors to the global error handler.
3. Global `errorHandler` middleware maps `statusCode` to HTTP status (defaults to 500).
4. Response format: `{ success: false, message: "..." }`.
5. In development mode, `stack` trace is included in the response.
6. Validation middleware returns 400 immediately with field-specific messages.

### HTTP Status Codes Used

| Code | Meaning                        |
|------|--------------------------------|
| 200  | Success                        |
| 201  | Created                        |
| 400  | Bad request / validation error |
| 401  | Unauthorized (not logged in)   |
| 403  | Forbidden (wrong role/owner)   |
| 404  | Resource not found             |
| 409  | Conflict (duplicate)           |
| 500  | Internal server error          |

## 5. Session Management

- **Library**: `express-session` with `connect-session-sequelize` store.
- **Storage**: Sessions stored in PostgreSQL `Sessions` table (auto-created by the store).
- **Cookie**: `connect.sid`, HTTP-only, SameSite=Lax, secure in production.
- **Max Age**: 24 hours (86400000 ms), configurable via `SESSION_MAX_AGE`.
- **Session Data**: `{ userId: UUID, role: 'owner'|'customer' }`.
- **Logout**: `req.session.destroy()` + `res.clearCookie('connect.sid')`.

## 6. Notification Strategy

Notifications are **simulated** (no real email/SMS gateway):
1. Log the message to console with `[NOTIFICATION]` prefix.
2. Append to `logs/notifications.log` file.
3. Insert a record in the `notifications` table for audit trail.
4. Notification failures do not block the main request flow.
