-- Create database for Saloon Booking System
-- Run: psql -U postgres -f scripts/create-db.sql

CREATE DATABASE saloon_booking;

\c saloon_booking;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
