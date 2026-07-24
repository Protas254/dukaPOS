# DukaPOS

A full-featured Point of Sale system built for Kenyan retail businesses. Supports M-Pesa, KRA eTIMS compliance, loyalty programs, shift management, inventory, and more.

---

## Project Structure

```
dukaPOS/
├── client/          # React (Vite) frontend
│   ├── src/
│   │   ├── api/         # Local API client (apiClient.js)
│   │   ├── components/  # UI components
│   │   ├── lib/         # Auth context, utilities
│   │   └── pages/       # Application pages
│   ├── .env.local
│   ├── package.json
│   └── vite.config.js
│
├── server/          # Django Backend
│   ├── api/         # Django API app (models, serializers, views)
│   ├── server/      # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3   # SQLite database (auto-generated & seeded on first run)
│   └── package.json
│
└── package.json     # Root scripts for running both
```

---

## Getting Started

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Run in development

```bash
# Start both client and server
npm run dev

# Or run separately:
npm run client    # Starts Vite dev server on http://localhost:5173
npm run server    # Starts Express server on http://localhost:5000
```

---



> Logging in with any other email auto-registers a new user. Emails containing `admin` are granted the admin role.

---

## Architecture

- **Frontend**: React 18 + Vite, TailwindCSS, shadcn/ui, TanStack Query, React Router
- **Backend**: Python 3 + Django, Django Rest Framework (DRF), SQLite database (`db.sqlite3`)
- **Auth**: Mock token-based auth stored in `localStorage`
- **Data**: The server seeds `db.sqlite3` automatically on the first API request with demo products, customers, shifts, and sales

---

## KRA eTIMS Compliance

The system includes a mock eTIMS submission flow. To connect to the real KRA API, update `server/api/views.py` with your `ETIMS_KRA_PIN` and `ETIMS_DEVICE_SERIAL` environment configurations.
