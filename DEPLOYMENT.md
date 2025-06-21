# Production Deployment Guide

## Prerequisites
- DigitalOcean VPS with Ubuntu 22.04+
- Node.js 18+ installed
- PostgreSQL database (can be local or managed)
- Git installed

## Step 1: System Restart (if required)
```bash
sudo reboot
```

## Step 2: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install PostgreSQL (if using local database)
sudo apt install postgresql postgresql-contrib -y
```

## Step 3: Clone and Setup Repository
```bash
# Clone the repository
git clone https://github.com/sureshnaloor/smartprojectalpha.git
cd smartprojectalpha

# Install all dependencies
npm run install:all
```

## Step 4: Environment Configuration
```bash
# Create environment file for backend
cd backend-smartproject
cp .env.example .env
nano .env
```

Configure the following in `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/smartproject
NODE_ENV=production
PORT=8080
```

## Step 5: Database Setup
```bash
# Create database (if using local PostgreSQL)
sudo -u postgres psql
CREATE DATABASE smartproject;
CREATE USER smartuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smartproject TO smartuser;
\q

# Run database migrations (if using Drizzle)
cd backend-smartproject
npm run db:migrate
```

## Step 6: Build Application
```bash
# From the root directory
npm run build
```

This will:
- Build the frontend React app to `frontend-smartproject/dist/`
- Build the backend TypeScript to `backend-smartproject/dist/`

## Step 7: Start Production Server
```bash
# Using PM2 for process management
cd backend-smartproject
pm2 start dist/index.js --name "smartproject-api"

# Save PM2 configuration
pm2 save
pm2 startup
```

## Step 8: Configure Nginx (Optional but Recommended)
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/smartproject
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/smartproject /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Configure Firewall
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Step 10: SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Monitoring and Maintenance

### Check Application Status
```bash
pm2 status
pm2 logs smartproject-api
```

### Restart Application
```bash
pm2 restart smartproject-api
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm run install:all

# Build application
npm run build

# Restart application
pm2 restart smartproject-api
```

## Troubleshooting

### Check Logs
```bash
# PM2 logs
pm2 logs smartproject-api

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u nginx
```

### Common Issues
1. **Port 8080 already in use**: Change PORT in .env file
2. **Database connection failed**: Check DATABASE_URL and PostgreSQL status
3. **Static files not serving**: Ensure frontend build completed successfully
4. **Permission denied**: Check file permissions and ownership

## Security Considerations
- Use strong passwords for database
- Keep system updated regularly
- Configure firewall properly
- Use SSL certificates in production
- Regularly backup database
- Monitor application logs for suspicious activity 