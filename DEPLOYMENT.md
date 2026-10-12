# 🚀 Deployment Checklist - Garage SaaS

Complete guide to deploy your Garage SaaS application to production.

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All features tested locally
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Database schema finalized
- [ ] API endpoints tested
- [ ] Production build successful

### 2. Database Setup
- [ ] Choose production database (PostgreSQL recommended)
- [ ] Database credentials secured
- [ ] Backup strategy planned
- [ ] Migration scripts ready

### 3. Security
- [ ] Strong NEXTAUTH_SECRET generated
- [ ] Environment variables secured
- [ ] API routes protected
- [ ] CORS configured properly
- [ ] SQL injection protection verified

### 4. Performance
- [ ] Images optimized
- [ ] Code minified (automatic in build)
- [ ] Database indexed
- [ ] Caching strategy planned

## Deployment Options

## Option 1: Vercel (Easiest) ⭐ Recommended

### Step 1: Prepare Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login
```

### Step 2: Configure Database

1. Create PostgreSQL database (Supabase/Neon/Railway)
2. Get connection string
3. Update environment variables

### Step 3: Deploy

```bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
# Or use CLI:
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Deploy to production
vercel --prod
```

### Vercel Environment Variables:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="super-secret-key-min-32-chars"
```

## Option 2: Traditional VPS (More Control)

### Requirements:
- Ubuntu 22.04 or similar
- Node.js 18+
- Nginx
- PostgreSQL
- PM2

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install PM2
sudo npm install -g pm2
```

### Step 2: Database Setup

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE garage_saas;
CREATE USER garage_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE garage_saas TO garage_user;
\q
```

### Step 3: Deploy Application

```bash
# Clone/upload project
cd /var/www
git clone your-repo.git garage-saas
cd garage-saas

# Install dependencies
npm install

# Setup environment
nano .env
# Add production environment variables

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Build application
npm run build

# Start with PM2
pm2 start npm --name "garage-saas" -- start
pm2 save
pm2 startup
```

### Step 4: Nginx Configuration

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/garage-saas
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/garage-saas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## Option 3: Docker Deployment

### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Step 2: Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=garage_user
      - POSTGRES_PASSWORD=strong_password
      - POSTGRES_DB=garage_saas
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

volumes:
  postgres_data:
```

### Step 3: Deploy

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Post-Deployment Tasks

### 1. Verification
- [ ] Website accessible
- [ ] Registration works
- [ ] Login works
- [ ] All pages load correctly
- [ ] API endpoints responding
- [ ] Database connected
- [ ] SSL certificate active

### 2. Testing
- [ ] Create test customer
- [ ] Create test job card
- [ ] Generate test invoice
- [ ] Check inventory
- [ ] Book test appointment
- [ ] Test payment flow

### 3. Monitoring Setup
- [ ] Setup error tracking (Sentry)
- [ ] Setup uptime monitoring (UptimeRobot)
- [ ] Setup analytics (Google Analytics)
- [ ] Setup backup automation

### 4. Backup Configuration

#### Automated Daily Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/garage-saas"
DB_NAME="garage_saas"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

#### Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## Environment Variables Reference

### Required
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="minimum-32-character-secret-key"
```

### Optional
```env
APP_NAME="Garage SaaS"
APP_VERSION="1.0.0"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
WHATSAPP_API_KEY=""
```

## Performance Optimization

### 1. Database
```sql
-- Add indexes
CREATE INDEX idx_customer_phone ON "Customer"(phone);
CREATE INDEX idx_invoice_customer ON "Invoice"("customerId");
CREATE INDEX idx_jobcard_status ON "JobCard"(status);
```

### 2. Caching
- Setup Redis for session storage
- Enable Next.js image optimization
- Use CDN for static assets

### 3. Monitoring

```bash
# Install monitoring tools
npm install @sentry/nextjs

# Setup in next.config.js
```

## Troubleshooting

### Database Connection Issues
```bash
# Check database is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U garage_user -d garage_saas
```

### Build Failures
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### PM2 Issues
```bash
# Check status
pm2 status

# View logs
pm2 logs garage-saas

# Restart
pm2 restart garage-saas
```

## Scaling Considerations

### Vertical Scaling
- Increase server RAM
- Upgrade CPU
- Faster SSD storage

### Horizontal Scaling
- Load balancer (Nginx)
- Multiple app instances
- Database replication
- CDN for static files

## Security Hardening

### 1. Firewall
```bash
# UFW setup
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2Ban
```bash
# Install
sudo apt install fail2ban

# Configure
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Updates
```bash
# System updates
sudo apt update && sudo apt upgrade

# Node packages
npm audit fix
npm update
```

## Support & Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Check backup status

### Weekly
- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies
- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature planning

## Emergency Contacts

Keep these handy:
- Hosting provider support
- Database admin
- Development team
- Domain registrar

## Rollback Plan

If deployment fails:

```bash
# PM2
pm2 stop garage-saas
git checkout previous-version
npm install
npm run build
pm2 restart garage-saas

# Docker
docker-compose down
git checkout previous-version
docker-compose up -d --build
```

---

## 🎉 Deployment Complete!

Once deployed:
1. Test all features
2. Create first customer
3. Share with beta users
4. Collect feedback
5. Iterate and improve

**Good luck with your launch! 🚀**

**તમારા લોન્ચ માટે શુભેચ્છાઓ!**
