# DukaPOS — Installation, Setup & Deployment Guide

This guide covers local development, Dockerized container deployment, production server setup, and point of sale hardware configuration.

---

## 1. System Requirements & Prerequisites

### Server & Runtime
- **Node.js**: Version 18.x or 20.x LTS
- **Python**: Version 3.10, 3.11, or 3.12
- **Package Managers**: `npm` 9+ and `pip`
- **Database**: PostgreSQL 14+ (production) or SQLite 3 (local development)
- **Memory & CPU**: Minimum 2 GB RAM, 1 vCPU (4 GB RAM recommended for multi-tenant production)

---

## 2. Local Development Setup (Quickstart)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/dukaPOS.git
cd dukaPOS
```

### Step 2: One-Click Dependency Installation
From the root directory, run:
```bash
npm run install:all
```
*This command installs client npm modules, creates the Python virtual environment in `server/venv`, and installs all backend Python dependencies.*

### Step 3: Configure Environment Variables
Create `.env.local` inside `client/`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_DUKAPOS_APP_BASE_URL=http://localhost:5000
```

Create `.env` inside `server/`:
```env
DEBUG=True
SECRET_KEY=local-development-secret-key-change-in-prod
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Step 4: Run Database Migrations
```bash
cd server
venv/bin/python manage.py migrate
cd ..
```

### Step 5: Start Development Servers
To run both frontend and backend concurrently:
```bash
npm run dev
```
Or run individually in separate terminals:
- **Client (Vite)**:
  ```bash
  npm run client
  # Serves at http://localhost:5173
  ```
- **Server (Django)**:
  ```bash
  npm run server
  # Serves at http://localhost:5000
  ```

---

## 3. Docker & Docker Compose Setup

DukaPOS includes complete Docker configurations for isolated containerized environments.

### Development with Docker Compose
To spin up PostgreSQL, Django API, and Vite client with live volume reload:
```bash
docker compose up --build
```
- Client accessible at: `http://localhost:5173`
- Backend API accessible at: `http://localhost:8000`
- PostgreSQL accessible at: `localhost:5432`

### Production Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 4. Production Deployment on Linux (Ubuntu / Debian)

### Architecture Architecture in Production:
- **Reverse Proxy**: Nginx (handling SSL, compression, and request routing)
- **Application Server**: Gunicorn WSGI with 4 worker processes
- **Static Asset Serving**: WhiteNoise or Nginx direct static root
- **Database**: PostgreSQL 15 on dedicated cluster

```mermaid
graph LR
    Client((Client Browser / Tablet)) -->|HTTPS :443| Nginx[Nginx Reverse Proxy]
    Nginx -->|Static Assets| StaticFiles[/var/www/dukapos/client/dist]
    Nginx -->|Proxy Pass /api/| Gunicorn[Gunicorn WSGI :8000]
    Gunicorn --> Django[Django Application]
    Django --> Postgres[(PostgreSQL 15)]
    Django --> S3[(AWS S3 Vault)]
```

### Systemd Service Configuration (`/etc/systemd/system/dukapos.service`)
```ini
[Unit]
Description=DukaPOS Gunicorn Daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/dukapos/server
ExecStart=/var/www/dukapos/server/venv/bin/gunicorn \
          --access-logfile - \
          --workers 4 \
          --bind 127.0.0.1:8000 \
          server.wsgi:application

[Install]
WantedBy=multi-user.target
```

### Nginx Virtual Host Configuration (`/etc/nginx/sites-available/dukapos`)
```nginx
server {
    listen 80;
    server_name pos.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pos.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/pos.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.yourdomain.com/privkey.pem;

    root /var/www/dukapos/client/dist;
    index index.html;

    # Frontend Single Page App Router Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin Interface
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Static Assets Cache
    location /static/ {
        alias /var/www/dukapos/server/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 5. POS Hardware Configuration

DukaPOS is designed to operate seamlessly with standard off-the-shelf retail hardware peripherals without requiring proprietary drivers:

### 1. Thermal Receipt Printers (80mm & 58mm)
- **Supported Connection**: USB, Ethernet (LAN), Bluetooth, or Virtual Windows Spooler.
- **Protocol**: Standard ESC/POS emulation.
- **Setup**:
  - Connect the printer to the terminal.
  - Install standard manufacturer CUPS/Windows driver.
  - Set as the default receipt printer in Chrome/Edge browser.
  - In browser print settings, enable **"Margins: None"** and check **"Print Headers and Footers: Off"**.

### 2. Barcode Scanners
- **Supported Types**: 1D Laser Scanners, 2D QR Code Imagers (USB, Wireless 2.4GHz dongle, or Bluetooth).
- **Emulation**: Standard HID Keyboard Wedge emulation.
- **Setup**:
  - Plug scanner into the POS terminal.
  - Ensure the scanner is configured to emit an `Enter` (Carriage Return) suffix after each scan (factory default on 99% of scanners).
  - Scanning any barcode immediately adds the item to the active cart without requiring manual cursor clicks.

### 3. Electronic Cash Drawers (RJ11 / RJ12)
- **Connection**: Standard RJ11 cable plugged directly into the DK (Drawer Kick) port of the thermal receipt printer.
- **Trigger**: The printer sends a 24V pulse to spring open the cash drawer immediately upon checkout or when clicking "Open Drawer".
