# Chapter 16: Installation, Deployment & Operations

---

## 16.1 System Requirements & Prerequisites

DukaPOS can run on bare-metal servers, virtual private servers (VPS), managed cloud containers (AWS ECS, GCP Cloud Run, DigitalOcean App Platform), or standard local development machines.

### Hardware Specifications
| Environment | Minimum Specs | Recommended Specs |
|---|---|---|
| **Local Development** | 2 CPU Cores, 4 GB RAM, 10 GB Disk | 4 CPU Cores, 8 GB RAM, 20 GB SSD |
| **Production (Single Store)** | 1 vCPU, 2 GB RAM, 20 GB SSD | 2 vCPU, 4 GB RAM, 40 GB NVMe SSD |
| **Production (Enterprise / Multi-Branch)** | 2 vCPU, 4 GB RAM, 50 GB SSD | 4 vCPU, 8–16 GB RAM, 100 GB NVMe SSD |

### Software Dependencies
- **Node.js**: `v18.x` or `v20.x LTS` (includes `npm 9+`)
- **Python**: `3.10`, `3.11`, or `3.12`
- **Database**: PostgreSQL `14+` (production) or SQLite `3.35+` (local testing)
- **Web Server / Reverse Proxy**: Nginx `1.20+`
- **WSGI Server**: Gunicorn `21.x`
- **Containerization (Optional)**: Docker `24+` & Docker Compose `v2+`

---

## 16.2 Local Development Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/dukaPOS.git
cd dukaPOS
```

### Step 2: One-Click Dependency Installation
DukaPOS includes a root orchestration script that configures both frontend and backend:
```bash
npm run install:all
```
*This command installs client npm modules, creates the Python virtual environment in `server/venv`, and installs all backend Python packages via pip.*

### Step 3: Configure Environment Variables

**Frontend (`client/.env.local`):**
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_DUKAPOS_APP_BASE_URL=http://localhost:5000
```

**Backend (`server/.env`):**
```env
DEBUG=True
SECRET_KEY=dukapos-insecure-dev-secret-key-change-in-prod
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Step 4: Run Database Migrations
```bash
cd server
venv/bin/python manage.py migrate
venv/bin/python manage.py createsuperuser  # Optional: create root admin
cd ..
```

### Step 5: Launch Development Servers
Run both client and server concurrently:
```bash
npm run dev
```
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Django Admin**: `http://localhost:5000/admin/`

---

## 16.3 Containerized Deployment (Docker Compose)

### Development Mode with Live Reload
```bash
docker compose up --build
```
- Automatically provisions PostgreSQL container, runs migrations, and binds code volumes for real-time frontend and backend updates.

### Production Container Orchestration
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Includes health checks, restart policies, isolated internal bridge networks, and Nginx reverse proxy.

---

## 16.4 Production Deployment on Linux (Ubuntu 22.04 / 24.04 LTS)

```mermaid
graph LR
    Internet((Public Internet)) -->|HTTPS :443| Nginx[Nginx Reverse Proxy]
    Nginx -->|Static / Assets| StaticFiles[Dist / Staticfiles Directory]
    Nginx -->|Proxy Pass /api/| Gunicorn[Gunicorn WSGI :8000]
    Gunicorn --> DjangoApp[Django 5.2 Application]
    DjangoApp --> Postgres[(PostgreSQL 16 DB)]
```

### Step 1: Install System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv python3-dev postgresql postgresql-contrib nginx git certbot python3-certbot-nginx
```

### Step 2: Provision PostgreSQL Database
```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE dukapos_prod;
CREATE USER dukapos_user WITH ENCRYPTED PASSWORD 'StrongSecureDBPassword_2026!';
GRANT ALL PRIVILEGES ON DATABASE dukapos_prod TO dukapos_user;
ALTER DATABASE dukapos_prod OWNER TO dukapos_user;
\q
```

### Step 3: Clone Code & Configure Virtual Environment
```bash
sudo mkdir -p /var/www/dukapos
sudo chown -R $USER:$USER /var/www/dukapos
cd /var/www/dukapos
git clone https://github.com/your-org/dukaPOS.git .

# Backend virtualenv
python3 -m venv venv
source venv/bin/activate
pip install -r server/requirements.txt
pip install gunicorn psycopg2-binary
```

### Step 4: Configure Production Environment Variables
Create `/var/www/dukapos/server/.env`:
```env
DEBUG=False
SECRET_KEY=generate-a-64-character-random-hex-key-here
DATABASE_URL=postgresql://dukapos_user:StrongSecureDBPassword_2026!@localhost:5432/dukapos_prod
ALLOWED_HOSTS=pos.yourdomain.co.ke,api.yourdomain.co.ke
CORS_ALLOWED_ORIGINS=https://pos.yourdomain.co.ke

# KRA eTIMS Production
KRA_ETIMS_ENV=production
KRA_ETIMS_BASE_URL=https://etims-api.kra.go.ke
KRA_PIN=P051234567A

# Safaricom Daraja M-Pesa Production
DARAJA_ENVIRONMENT=production
DARAJA_CONSUMER_KEY=your_live_consumer_key
DARAJA_CONSUMER_SECRET=your_live_consumer_secret
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=your_live_passkey
DARAJA_CALLBACK_URL=https://api.yourdomain.co.ke/api/payments/mpesa/callback/
```

### Step 5: Run Database Migrations & Static Collection
```bash
cd /var/www/dukapos/server
../venv/bin/python manage.py migrate
../venv/bin/python manage.py collectstatic --noinput
```

### Step 6: Build Frontend Single Page Application
```bash
cd /var/www/dukapos/client
npm install
npm run build
# Output is compiled into /var/www/dukapos/client/dist
```

### Step 7: Configure Gunicorn Systemd Service
Create `/etc/systemd/system/dukapos.service`:
```ini
[Unit]
Description=DukaPOS Gunicorn Daemon
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/dukapos/server
ExecStart=/var/www/dukapos/venv/bin/gunicorn \
          --access-logfile - \
          --workers 4 \
          --bind 127.0.0.1:8000 \
          dukaPOS.wsgi:application

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start dukapos
sudo systemctl enable dukapos
```

### Step 8: Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/dukapos`:
```nginx
server {
    server_name pos.yourdomain.co.ke;

    root /var/www/dukapos/client/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Reverse Proxy to Gunicorn
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Assets for Django Admin / DRF
    location /static/ {
        alias /var/www/dukapos/server/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    client_max_body_size 20M;
}
```

Enable site & acquire SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/dukapos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Free Let's Encrypt SSL
sudo certbot --nginx -d pos.yourdomain.co.ke
```

---

## 16.5 Maintenance, Backups & Operational Tasks

### Automated Daily Database Backups
Create backup script `/usr/local/bin/dukapos_backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/dukapos"
DATE=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

pg_dump -U dukapos_user -h localhost -F c dukapos_prod > $BACKUP_DIR/dukapos_$DATE.dump
find $BACKUP_DIR -type f -name "*.dump" -mtime +14 -delete
```

Add cron job (`sudo crontab -e`):
```cron
0 2 * * * /usr/local/bin/dukapos_backup.sh > /dev/null 2>&1
```

### Database Restore Command
To restore from a backup:
```bash
pg_restore -U dukapos_user -d dukapos_prod -c /var/backups/dukapos/dukapos_YYYYMMDD_HHMMSS.dump
```

---
