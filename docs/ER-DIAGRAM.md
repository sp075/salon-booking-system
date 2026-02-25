# Entity-Relationship Diagram - Salon Booking System

## Overview

The database consists of 8 tables (plus a system-managed `Sessions` table).
All tables use `created_at` and `updated_at` timestamp columns (managed by Sequelize).

## ER Diagram (ASCII)

```
+-------------------+       1:1       +------------------------+
|      users        |<--------------->|    owner_profiles      |
+-------------------+                 +------------------------+
| *id        UUID PK|                 | *id          UUID PK   |
|  email     VARCHAR|                 |  user_id     UUID FK   |---+
|  mobile    VARCHAR|                 |  salon_name  VARCHAR   |   |
|  password  VARCHAR|                 |  address     TEXT      |   |
|  first_name VARCHAR|                |  open_time   TIME      |   |
|  last_name VARCHAR|                 |  close_time  TIME      |   |
|  role      ENUM   |                 |  day_off     INTEGER   |   |
|  created_at TIMESTAMP|              |  avg_rating  DECIMAL   |   |
|  updated_at TIMESTAMP|              |  total_reviews INTEGER |   |
+-------------------+                 |  created_at  TIMESTAMP |   |
        |                             |  updated_at  TIMESTAMP |   |
        | 1:N                         +------------------------+   |
        |                                    |                     |
        v                                    | 1:N                 |
+-------------------+                        |                     |
|   notifications   |                        v                     |
+-------------------+              +------------------------+      |
| *id      INT PK   |              |    owner_services      |      |
|  user_id UUID FK   |             +------------------------+      |
|  type    ENUM      |             | *id              INT PK|      |
|  recipient VARCHAR |             |  owner_profile_id UUID FK     |
|  subject VARCHAR   |             |  service_id      INT FK|------+---+
|  body    TEXT      |             |  is_active       BOOL  |      |   |
|  status  VARCHAR   |             |  custom_price    DECIMAL      |   |
|  created_at TIMESTAMP|           |  created_at      TIMESTAMP    |   |
|  updated_at TIMESTAMP|           |  updated_at      TIMESTAMP    |   |
+-------------------+              +------------------------+      |   |
                                     UNIQUE(owner_profile_id,      |   |
                                            service_id)            |   |
                                                                   |   |
+-------------------+                                              |   |
|     services      |<---------------------------------------------+---+
+-------------------+                                              |
| *id         INT PK|                                              |
|  name       VARCHAR|      (unique)                               |
|  default_price DECIMAL|                                          |
|  duration_minutes INT|                                           |
|  created_at TIMESTAMP|                                           |
|  updated_at TIMESTAMP|                                           |
+-------------------+                                              |
        |                                                          |
        | 1:N                                                      |
        v                                                          |
+-------------------+          +-------------------+               |
| booking_services  |          |     bookings      |               |
+-------------------+          +-------------------+               |
| *id       INT PK  |  N:1    | *id        UUID PK|               |
|  booking_id UUID FK|-------->|  customer_id UUID FK (-> users)   |
|  service_id INT FK |         |  owner_profile_id UUID FK --------+
|  slot_start TIME   |         |  booking_date DATEONLY|
|  slot_end   TIME   |         |  start_time   TIME   |
|  price     DECIMAL |         |  end_time     TIME   |
|  created_at TIMESTAMP|       |  total_price  DECIMAL|
|  updated_at TIMESTAMP|       |  status       ENUM   |
+-------------------+          |  held_at      TIMESTAMP|
                               |  created_at   TIMESTAMP|
                               |  updated_at   TIMESTAMP|
                               +-------------------+
                                       |
                                       | 1:1
                                       v
                               +-------------------+
                               |     reviews       |
                               +-------------------+
                               | *id          INT PK|
                               |  customer_id UUID FK (-> users)
                               |  owner_profile_id UUID FK (-> owner_profiles)
                               |  booking_id  UUID FK (unique)
                               |  rating      INTEGER |
                               |  comment     TEXT    |
                               |  created_at  TIMESTAMP|
                               |  updated_at  TIMESTAMP|
                               +-------------------+
```

## Table Details

### users
| Column     | Type         | Constraints                |
|------------|--------------|----------------------------|
| id         | UUID         | PK, default UUIDv4         |
| email      | VARCHAR(255) | NOT NULL, UNIQUE           |
| mobile     | VARCHAR(15)  | NOT NULL                   |
| password   | VARCHAR(255) | NOT NULL                   |
| first_name | VARCHAR(255) | NOT NULL                   |
| last_name  | VARCHAR(255) | NOT NULL                   |
| role       | ENUM         | NOT NULL, ('owner','customer') |
| created_at | TIMESTAMP    | NOT NULL                   |
| updated_at | TIMESTAMP    | NOT NULL                   |

### owner_profiles
| Column        | Type         | Constraints                  |
|---------------|--------------|------------------------------|
| id            | UUID         | PK, default UUIDv4           |
| user_id       | UUID         | FK -> users.id, NOT NULL, UNIQUE |
| salon_name    | VARCHAR(255) | NULLABLE                     |
| address       | TEXT         | NULLABLE                     |
| open_time     | TIME         | NULLABLE                     |
| close_time    | TIME         | NULLABLE                     |
| day_off       | INTEGER      | NULLABLE, 0-6 (0=Sun)       |
| avg_rating    | DECIMAL(2,1) | DEFAULT 0                    |
| total_reviews | INTEGER      | DEFAULT 0                    |
| created_at    | TIMESTAMP    | NOT NULL                     |
| updated_at    | TIMESTAMP    | NOT NULL                     |

### services
| Column           | Type         | Constraints            |
|------------------|--------------|------------------------|
| id               | INTEGER      | PK, auto-increment     |
| name             | VARCHAR(255) | NOT NULL, UNIQUE       |
| default_price    | DECIMAL(10,2)| NOT NULL               |
| duration_minutes | INTEGER      | NOT NULL, DEFAULT 30   |
| created_at       | TIMESTAMP    | NOT NULL               |
| updated_at       | TIMESTAMP    | NOT NULL               |

### owner_services
| Column           | Type         | Constraints                       |
|------------------|--------------|-----------------------------------|
| id               | INTEGER      | PK, auto-increment                |
| owner_profile_id | UUID         | FK -> owner_profiles.id, NOT NULL |
| service_id       | INTEGER      | FK -> services.id, NOT NULL       |
| is_active        | BOOLEAN      | DEFAULT true                      |
| custom_price     | DECIMAL(10,2)| NULLABLE                          |
| created_at       | TIMESTAMP    | NOT NULL                          |
| updated_at       | TIMESTAMP    | NOT NULL                          |
| **UNIQUE**       |              | (owner_profile_id, service_id)    |

### bookings
| Column           | Type         | Constraints                        |
|------------------|--------------|------------------------------------|
| id               | UUID         | PK, default UUIDv4                 |
| customer_id      | UUID         | FK -> users.id, NOT NULL           |
| owner_profile_id | UUID         | FK -> owner_profiles.id, NOT NULL  |
| booking_date     | DATEONLY     | NOT NULL                           |
| start_time       | TIME         | NOT NULL                           |
| end_time         | TIME         | NOT NULL                           |
| total_price      | DECIMAL(10,2)| NOT NULL                           |
| status           | ENUM         | NOT NULL, DEFAULT 'pending'        |
|                  |              | Values: pending, confirmed, rejected, cancelled, completed, abandoned |
| held_at          | TIMESTAMP    | NULLABLE                           |
| created_at       | TIMESTAMP    | NOT NULL                           |
| updated_at       | TIMESTAMP    | NOT NULL                           |

### booking_services
| Column     | Type         | Constraints                    |
|------------|--------------|--------------------------------|
| id         | INTEGER      | PK, auto-increment             |
| booking_id | UUID         | FK -> bookings.id, NOT NULL    |
| service_id | INTEGER      | FK -> services.id, NOT NULL    |
| slot_start | TIME         | NOT NULL                       |
| slot_end   | TIME         | NOT NULL                       |
| price      | DECIMAL(10,2)| NOT NULL                       |
| created_at | TIMESTAMP    | NOT NULL                       |
| updated_at | TIMESTAMP    | NOT NULL                       |

### reviews
| Column           | Type         | Constraints                       |
|------------------|--------------|-----------------------------------|
| id               | INTEGER      | PK, auto-increment                |
| customer_id      | UUID         | FK -> users.id, NOT NULL          |
| owner_profile_id | UUID         | FK -> owner_profiles.id, NOT NULL |
| booking_id       | UUID         | FK -> bookings.id, NOT NULL, UNIQUE |
| rating           | INTEGER      | NOT NULL, CHECK 1-5               |
| comment          | TEXT         | NULLABLE                          |
| created_at       | TIMESTAMP    | NOT NULL                          |
| updated_at       | TIMESTAMP    | NOT NULL                          |

### notifications
| Column     | Type         | Constraints                    |
|------------|--------------|--------------------------------|
| id         | INTEGER      | PK, auto-increment             |
| user_id    | UUID         | FK -> users.id, NOT NULL       |
| type       | ENUM         | NOT NULL, ('email','sms')      |
| recipient  | VARCHAR(255) | NOT NULL                       |
| subject    | VARCHAR(255) | NULLABLE                       |
| body       | TEXT         | NOT NULL                       |
| status     | VARCHAR(255) | DEFAULT 'sent'                 |
| created_at | TIMESTAMP    | NOT NULL                       |
| updated_at | TIMESTAMP    | NOT NULL                       |

## Relationship Summary

| Relationship                     | Type | FK Column          |
|----------------------------------|------|--------------------|
| users -> owner_profiles          | 1:1  | owner_profiles.user_id |
| users -> bookings                | 1:N  | bookings.customer_id   |
| users -> reviews                 | 1:N  | reviews.customer_id    |
| users -> notifications           | 1:N  | notifications.user_id  |
| owner_profiles -> owner_services | 1:N  | owner_services.owner_profile_id |
| owner_profiles -> bookings       | 1:N  | bookings.owner_profile_id |
| owner_profiles -> reviews        | 1:N  | reviews.owner_profile_id |
| services -> owner_services       | 1:N  | owner_services.service_id |
| services -> booking_services     | 1:N  | booking_services.service_id |
| bookings -> booking_services     | 1:N  | booking_services.booking_id |
| bookings -> reviews              | 1:1  | reviews.booking_id (unique) |

## N:M Relationships (via Join Tables)

- **owner_profiles <-> services**: Many-to-Many via `owner_services` table
- **bookings <-> services**: Many-to-Many via `booking_services` table
