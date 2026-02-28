# Project Brief

## Project Name

Bike Rental UI (`bikerental-ui`)

## Overview

A web-based point-of-sale (POS) interface for a bicycle (and other equipment) rental shop. The application has two
modules:

- **Admin module** — desktop-first (≥22", 1080p). CRUD management of reference data (equipment, types, statuses,
  tariffs, customers), user management, rental/payment history viewing.
- **Operator module** — mobile-first (phone screen). Operational flow: customer search → rental creation → QR-scan
  return → payment processing.

## Core Goals

- Provide a fast, operator-friendly mobile interface for managing bike rentals
- Provide a desktop admin panel for reference data management
- Search customers by partial phone number (last 4 digits)
- Create and manage rental records end-to-end
- Handle equipment return with QR code scanning via phone camera
- Display and select appropriate tariffs automatically
- Secure all API calls with JWT Bearer token authorization
- Role-based access: Admin vs Operator
- i18n support from the start (Russian as default language)

## Scope

### In Scope

- **Authentication**: Login page, JWT token storage, auth interceptor, route guards by role
- **Admin module** (desktop-first, ≥22" 1080p):
  - Equipment CRUD (create, edit, list, search by status/type)
  - Equipment Types CRUD
  - Equipment Statuses CRUD (with transition management)
  - Tariffs CRUD (create, edit, activate/deactivate)
  - Customer list and edit
  - Rental history and payment history viewing
  - User management (placeholder page with mock table — API endpoint coming later)
- **Operator module** (mobile-first, phone screen):
  - Customer search by phone (partial, min 4 digits)
  - Quick customer creation (phone only) and full customer creation form
  - Rental creation — enter equipment UID manually or scan QR code via camera, select duration, auto-tariff
  - Prepayment recording
  - Active rentals dashboard
  - Equipment return via QR code scan (phone camera) using `html5-qrcode`
  - Return cost breakdown, overtime/forgiveness display
  - Additional payment collection at return
  - Early return / swap within 10 minutes → full refund

### Out of Scope

- Backend / API implementation
- Reporting and analytics dashboards
- Mobile native app
- Push notifications
- NFC scanning (replaced by QR code camera scanning)

## Business Rules

1. Search customer by partial phone (min 4 digits)
2. Equipment identified by UID (entered manually or scanned via QR code with phone camera)
3. Rental duration options: 30 min, 1 hour, 2 hours, day
4. Tariff is auto-selected based on equipment type + planned duration + date
5. Forgiveness rule: up to 7 minutes overtime is free; above 7 min rounds to next 10 min block
6. Early return within first 10 minutes → full refund
7. Overtime cost calculated in 5-minute increments (rounded to 10 min if > 7 min over)

## Success Criteria

- Operator can complete a rental in under 1 minute on a phone
- Return flow works via QR code scanning on mobile browser
- Admin can manage all reference data from a desktop browser
- All API interactions secured with JWT Bearer token
- All API interactions use the Bike Rental API (http://localhost:8080)
- UI labels support i18n (Russian as default)

