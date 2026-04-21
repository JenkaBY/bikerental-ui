# Project Architecture: Bike Rental Enterprise System

## 1. Overview

This is a high-performance enterprise bike rental management system built with **Angular 21**. The project follows an **Angular Workspace (Monorepo)** pattern to manage two distinct applications (Admin and Operator) while maximizing code reuse through a shared library.

- **GitHub Repository:** `jenkaby/bikerental-ui`
- **Target Audience:** Internal staff (Operators) and Management (Admins).

---

## 2. Tech Stack

- **Framework:** Angular 21 (Standalone Components, Signals, Hydration).
- **UI Framework:** Angular Material + Tailwind CSS (Hybrid approach: Material for components, Tailwind for layout/utilities).
- **State Management:** Angular Signals (Global and Local stores).
- **API Generation:** `ng-openapi-gen` (Restful API integration).
- **i18n:** Built-in Angular `@angular/localize` (XLF files).
- **Linting/Formatting:** ESLint + Prettier.
- **CI/CD:** GitHub Actions.
- **Deployment:** GitHub Pages.

---

## 3. Workspace Structure (Angular Multi-Project)

The project uses the standard Angular Workspace organization.

```text
/
├── projects/
│   ├── admin-app/             # Desktop-first Admin Panel
│   ├── operator-app/          # Mobile/Tablet-first PWA for field staff
│   └── shared-lib/            # Core business logic and shared UI
│       ├── src/
│       │   ├── lib/
│       │   │   ├── api/       # Generated API services/models
│       │   │   ├── state/     # Global Signal-based stores (Dictionary, Auth)
│       │   │   ├── ui/        # Shared dumb components (Buttons, Indicators)
│       │   │   ├── features/  # SHARED PAGES (Customer, Transactions, Profile)
│       │   │   ├── mappers/   # Data transformation logic (DTO to UI Models)
│       │   │   └── models/    # Domain-specific TypeScript interfaces
│       │   ├── locale/        # Source .xlf files (En, Ru)
│       │   └── config/        # openapi.config.ts
├── angular.json               # Multi-project workspace config
└── package.json
```

---

## 4. Key Design Patterns & Justification

### 4.1. Facade Pattern (Signal Stores)

All data-fetching and state-management logic is encapsulated in **Services (Stores)**.

- **Why:** Components never interact with APIs directly. This ensures the UI remains "thin" and business logic is testable and reusable.

### 4.2. Smart & Dumb Components

- **Smart:** Orchestrate data from stores and handle feature routing.
- **Dumb:** Purely presentational, receiving data via `@Input` signals and emitting via `@Output`.
- **Why:** Facilitates UI reuse between Admin (Desktop) and Operator (Mobile) apps.

### 4.3. Metadata-Driven UI

Status indicators (e.g., "Available", "Rented") are determined by functional flags (`canStartRental`, `color`, `icon`) sent by the backend or calculated in Mappers.

- **Why:** Allows adding new statuses without redeploying the frontend.

### 4.4. Domain Mapping

- **Input:** DTOs from generated API.
- **Output:** Rich UI Models (Domain Models).
- **Why:** Decouples the frontend from backend schema changes and handles date/currency formatting centrally.

---

## 5. API Generation

The project uses `ng-openapi-gen` for automated API client generation.

- **Configuration Path:** `projects/shared-lib/src/config/openapi.config.ts`.
- **Source:** Dynamic JSON URL provided by the backend.
- **Command:** `npm run api:gen`.
- **Strategy:** - **Never modify** directly the generated source, only regenerate when you are asked.

---

## 6. Internationalization (i18n)

- **Engine:** Standard Angular i18n (`@angular/localize`).
- **Source Files:** Located in `projects/shared-lib/src/locale/`.
- **Strategy:** - Default language: **English (En)**.
  - No translation during active development; only English keys are required.
  - Build-time localization for both apps.

---

## 7. Shared Features (Cross-App Pages)

The following pages are implemented within `shared-lib/src/lib/features/` and imported into both `admin-app` and `operator-app`:

- **Customer Data:** Management and viewing of client profiles.
- **Transactions:** History of payments and rental sessions.
- **Balance:** Current financial standing and credit management.
- **Profile:** User settings and authentication details.

---

## 8. CI/CD & Deployment

- **Pipeline:** GitHub Actions.
- **Tasks:** Lint, Test, Build.
- **Deployment Strategy:** - Build both `admin-app` and `operator-app`.
  - Deploy to **GitHub Pages** simultaneously.
  - **URL Structure:** - `https://jenkaby.github.io/bike-rental/admin/`
    - `https://jenkaby.github.io/bike-rental/operator/`

---

## 9. Testing Strategy

- **Unit Testing:** Jasmine/Karma or Jest for logic in Stores and Mappers.
- **Component Testing:** Focus on Smart component integration.
- **Coverage Goal:** Minimum 80% for `shared-lib` (business logic).
- **Command:** `ng test shared-lib --code-coverage`.

---

## 10. Styling Standards

- **Material Design:** Used for complex components (Tables, Dialogs, Steppers, Datepickers).
- **Tailwind CSS:** Used for grid layouts, spacing, flexbox, and responsive visibility classes.
- **Customization:** Material themes are customized via Tailwind variables for design consistency.
