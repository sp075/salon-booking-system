# Class / Module Diagram - Salon Booking System

## Overview

This document describes the logical structure of the backend modules, their key
attributes/methods, and inter-module relationships. Since the project uses plain
JavaScript (not classes), each "class" below represents a module export.

## Module Diagram (ASCII)

```
+===========================================================================+
|                              MODELS LAYER                                 |
+===========================================================================+
|                                                                           |
|  +------------------+    +----------------------+    +-----------------+  |
|  |      User        |    |    OwnerProfile      |    |    Service      |  |
|  +------------------+    +----------------------+    +-----------------+  |
|  | id: UUID         |    | id: UUID             |    | id: INTEGER     |  |
|  | email: STRING    |    | userId: UUID         |    | name: STRING    |  |
|  | mobile: STRING   |    | salonName: STRING    |    | defaultPrice:   |  |
|  | password: STRING |    | address: TEXT        |    |   DECIMAL       |  |
|  | firstName: STRING|    | openTime: TIME       |    | durationMinutes:|  |
|  | lastName: STRING |    | closeTime: TIME      |    |   INTEGER       |  |
|  | role: ENUM       |    | dayOff: INTEGER      |    +-----------------+  |
|  +------------------+    | avgRating: DECIMAL   |            |            |
|       |  |  |            | totalReviews: INTEGER|            |            |
|       |  |  |            +----------------------+            |            |
|       |  |  |                  |          |                  |            |
|       |  |  |                  |          |                  |            |
|  +----+--+--+------+    +-----+----------+------+    +------+----------+ |
|  |  Notification    |    |    OwnerService       |    | BookingService  | |
|  +-----------------+    +----------------------+    +-----------------+  |
|  | id: INTEGER      |    | id: INTEGER          |    | id: INTEGER     |  |
|  | userId: UUID     |    | ownerProfileId: UUID |    | bookingId: UUID |  |
|  | type: ENUM       |    | serviceId: INTEGER   |    | serviceId: INT  |  |
|  | recipient: STRING|    | isActive: BOOLEAN    |    | slotStart: TIME |  |
|  | subject: STRING  |    | customPrice: DECIMAL |    | slotEnd: TIME   |  |
|  | body: TEXT       |    +----------------------+    | price: DECIMAL  |  |
|  | status: STRING   |                                +-----------------+  |
|  +-----------------+                                         |            |
|                                                              |            |
|                          +-----------------+                 |            |
|                          |     Booking     |<----------------+            |
|                          +-----------------+                              |
|                          | id: UUID        |    +-----------------+       |
|                          | customerId: UUID|    |     Review      |       |
|                          | ownerProfileId: |    +-----------------+       |
|                          |   UUID          |    | id: INTEGER     |       |
|                          | bookingDate:    |    | customerId: UUID|       |
|                          |   DATEONLY      |    | ownerProfileId: |       |
|                          | startTime: TIME |    |   UUID          |       |
|                          | endTime: TIME   |    | bookingId: UUID |       |
|                          | totalPrice:     |    | rating: INTEGER |       |
|                          |   DECIMAL       |    | comment: TEXT   |       |
|                          | status: ENUM    |    +-----------------+       |
|                          | heldAt: DATE    |            ^                 |
|                          +-----------------+            |                 |
|                                  |          1:1         |                 |
|                                  +----------------------+                 |
+===========================================================================+

+===========================================================================+
|                            SERVICES LAYER                                 |
+===========================================================================+
|                                                                           |
|  +---------------------+     +---------------------+                     |
|  |    authService       |     |    ownerService      |                    |
|  +---------------------+     +---------------------+                     |
|  | register(data)       |     | getProfile(userId)   |                    |
|  | login(credentials)   |     | updateProfile(       |                    |
|  | getUserById(id)      |     |   userId, data)      |                    |
|  +---------------------+     | updateSchedule(      |                    |
|                               |   userId, data)      |                    |
|  +---------------------+     | getServices(         |                    |
|  |    slotService       |     |   ownerProfileId)    |                    |
|  +---------------------+     | addService(id,       |                    |
|  | generateAllSlots(    |     |   serviceId, price)  |                    |
|  |   open, close, dur)  |     | removeService(       |                    |
|  | excludeLunchSlots(   |     |   id, serviceId)     |                    |
|  |   slots, start, end) |     | getBookings(         |                    |
|  | getBookedSlots(      |     |   id, filters)       |                    |
|  |   ownerId, date)     |     | confirmBooking(      |                    |
|  | getAvailableSlots(   |     |   bookingId, id)     |                    |
|  |   ownerId, date,     |     | rejectBooking(       |                    |
|  |   serviceIds)        |     |   bookingId, id)     |                    |
|  | validateBookingSlots(|     +---------------------+                     |
|  |   slots, start, cnt) |                                                 |
|  +---------------------+     +---------------------+                     |
|                               |  bookingService      |                    |
|  +---------------------+     +---------------------+                     |
|  | notificationService  |     | createBooking(       |                    |
|  +---------------------+     |   custId, params)    |                    |
|  | sendEmail(userId,    |     | confirmBooking(      |                    |
|  |   to, subject, body) |     |   bookingId, custId) |                    |
|  | sendSMS(userId,      |     | cancelBooking(       |                    |
|  |   to, body)          |     |   bookingId, custId) |                    |
|  | notifyBookingConfirm |     | getCustomerBookings( |                    |
|  | notifyBookingReject  |     |   customerId)        |                    |
|  | notifyBookingCancel  |     | getBookingById(id)   |                    |
|  +---------------------+     +---------------------+                     |
|                                                                           |
|  +---------------------+                                                  |
|  |   reviewService      |                                                 |
|  +---------------------+                                                  |
|  | createReview(        |                                                 |
|  |   custId, params)    |                                                 |
|  | getOwnerReviews(     |                                                 |
|  |   ownerProfileId)    |                                                 |
|  +---------------------+                                                  |
+===========================================================================+

+===========================================================================+
|                          CONTROLLERS LAYER                                |
+===========================================================================+
|                                                                           |
|  +---------------------+     +---------------------+                     |
|  |  authController      |     |  ownerController     |                    |
|  +---------------------+     +---------------------+                     |
|  | register(req, res)   |     | getProfile(req, res) |                    |
|  | login(req, res)      |     | updateProfile(...)   |                    |
|  | logout(req, res)     |     | updateSchedule(...)  |                    |
|  | me(req, res)         |     | getServices(...)     |                    |
|  +---------------------+     | addService(...)      |                    |
|                               | removeService(...)   |                    |
|  +---------------------+     | getBookings(...)     |                    |
|  | customerController   |     | confirmBooking(...)  |                    |
|  +---------------------+     | rejectBooking(...)   |                    |
|  | browseOwners(...)    |     +---------------------+                     |
|  | getOwnerDetail(...)  |                                                 |
|  | getAvailableSlots    |     +---------------------+                     |
|  |   (req, res)         |     | bookingController    |                    |
|  +---------------------+     +---------------------+                     |
|                               | createBooking(...)   |                    |
|                               | confirmBooking(...)  |                    |
|                               | cancelBooking(...)   |                    |
|                               | getMyBookings(...)   |                    |
|                               | submitReview(...)    |                    |
|                               +---------------------+                     |
+===========================================================================+

+===========================================================================+
|                         MIDDLEWARE & UTILS                                 |
+===========================================================================+
|                                                                           |
|  +---------------------+   +----------------------+  +------------------+ |
|  |  authMiddleware      |   | validationMiddleware |  |  errorHandler    | |
|  +---------------------+   +----------------------+  +------------------+ |
|  | isAuthenticated(     |   | validateRegistration |  | errorHandler(    | |
|  |   req, res, next)    |   | validateLogin        |  |  err, req, res,  | |
|  | isRole(role) ->      |   | validateBooking      |  |  next)           | |
|  |   middleware          |   | validateReview       |  +------------------+ |
|  +---------------------+   +----------------------+                      |
|                                                                           |
|  +---------------------+   +----------------------+  +------------------+ |
|  |     logger           |   |     timeUtils        |  |   validators     | |
|  +---------------------+   +----------------------+  +------------------+ |
|  | info(...args)        |   | timeToMinutes(str)   |  | isValidEmail()   | |
|  | error(...args)       |   | minutesToTime(mins)  |  | isValidMobile()  | |
|  | notification(...args)|   | addMinutes(str, n)   |  | isValidPassword()| |
|  +---------------------+   | isTimeBefore(t1, t2) |  | isValidTime()    | |
|                             | isTimeInRange(...)   |  | isValidDate()    | |
|                             | generateTimeSlots()  |  | isValidUUID()    | |
|                             +----------------------+  +------------------+ |
+===========================================================================+

+===========================================================================+
|                           JOBS (CRON)                                     |
+===========================================================================+
|                                                                           |
|  +---------------------+   +-------------------------+                    |
|  |     scheduler        |   | releaseAbandonedSlots   |                   |
|  +---------------------+   +-------------------------+                    |
|  | start()              |   | releaseAbandonedSlots() |                   |
|  |  - runs all 3 crons  |   |  - marks expired holds  |                   |
|  +---------------------+   |    as 'abandoned'        |                   |
|                             +-------------------------+                    |
|  +---------------------------+                                             |
|  |   autoConfirmBookings     |                                             |
|  +---------------------------+                                             |
|  | autoConfirmBookings()     |                                             |
|  |  - confirms pending near  |                                             |
|  |    start time             |                                             |
|  | markCompleted()           |                                             |
|  |  - marks past confirmed   |                                             |
|  |    bookings as completed  |                                             |
|  +---------------------------+                                             |
+===========================================================================+
```

## Dependency Flow

```
Controllers --> Services --> Models --> Sequelize --> PostgreSQL
     |              |
     v              v
Middleware     Notification
     |          Service
     v
  Utils (logger, timeUtils, validators)
```

## Key Relationships

1. **authController** depends on **authService**
2. **ownerController** depends on **ownerService** and **notificationService**
3. **customerController** depends on **slotService** (for available slots)
4. **bookingController** depends on **bookingService**, **reviewService**, and **notificationService**
5. **bookingService** depends on **slotService** (for slot validation)
6. **scheduler** depends on **releaseAbandonedSlots** and **autoConfirmBookings**
7. All services depend on the **Models** layer via Sequelize
