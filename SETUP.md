# GEO Platform - Quick Setup Guide

This guide will help you get the GEO Platform up and running in under 15 minutes.

## 🚀 Quick Start (Development)

### Prerequisites Check
```bash
# Check Node.js version (requires 18+)
node --version

# Check MySQL (requires 8.0+)
mysql --version

# Check Redis (optional but recommended)
redis-cli --version
```

### 1-Minute Setup Script

```bash
#!/bin/bash
# Quick setup script for GEO Platform

# Clone and setup backend
git clone <repository-url> geo-platform
cd geo-platform

# Install backend dependencies
npm install

# Setup environment
cp .env.example .env
echo "⚠️  Please edit .env file with your database and API credentials"

# Setup database (requires MySQL running)
mysql -u root -p -e "CREATE DATABASE exchange_geo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p exchange_geo < database/schema.sql

# Setup frontend
cd frontend
npm install

# Start development servers
cd ..
npm run dev &
cd frontend && npm run dev &

echo "✅ GEO Platform is starting up!"
echo "🔗 Backend: http://localhost:8000"
echo "🔗 Frontend: http://localhost:3000"
```

## 🔧 Manual Setup Steps

### Step 1: Database Configuration

#### Option A: Local MySQL
```bash
# Install MySQL (Ubuntu/Debian)
sudo apt update
sudo apt install mysql-server

# Install MySQL (macOS with Homebrew)
brew install mysql
brew services start mysql

# Create database
mysql -u root -p
CREATE DATABASE exchange_geo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'geouser'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON exchange_geo.* TO 'geouser'@'localhost';
FLUSH PRIVILEGES;
exit

# Import schema
mysql -u geouser -p exchange_geo < database/schema.sql
```

#### Option B: Docker MySQL
```bash
# Run MySQL in Docker
docker run --name geo-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=exchange_geo \
  -e MYSQL_USER=geouser \
  -e MYSQL_PASSWORD=geopassword \
  -p 3306:3306 \
  -d mysql:8.0

# Wait for container to be ready, then import schema
sleep 30
docker exec -i geo-mysql mysql -u geouser -pgeopassword exchange_geo < database/schema.sql
```

### Step 2: Redis Setup (Optional but Recommended)

#### Option A: Local Redis
```bash
# Install Redis (Ubuntu/Debian)
sudo apt install redis-server

# Install Redis (macOS with Homebrew)
brew install redis
brew services start redis

# Test Redis
redis-cli ping
```

#### Option B: Docker Redis
```bash
docker run --name geo-redis -p 6379:6379 -d redis:7-alpine
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env
```

**Minimal .env Configuration:**
```bash
# Database (Required)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=exchange_geo
DB_USER=geouser
DB_PASSWORD=geopassword

# Authentication (Required)
JWT_SECRET=change-this-to-a-long-random-string-in-production
JWT_REFRESH_SECRET=change-this-to-another-long-random-string

# Basic API Keys (Optional for testing)
OPENAI_API_KEY=sk-your-openai-key-here
```

### Step 4: Start Services

#### Terminal 1 - Backend
```bash
cd geo-platform
npm install
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd geo-platform/frontend
npm install
npm run dev
```

## 🧪 Verification Steps

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
```
Expected response:
```json
{
  "success": true,
  "message": "GEO Platform API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Database Connection
```bash
curl http://localhost:8000/api/v1/docs
```
Should return API documentation.

### 3. Frontend Access
Visit `http://localhost:3000` - you should see the login page.

### 4. Create Test Account
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User",
    "company": "Test Company"
  }'
```

## 🐳 Docker Setup (Alternative)

### Complete Docker Setup
```bash
# Clone repository
git clone <repository-url> geo-platform
cd geo-platform

# Start all services with Docker Compose
docker-compose up -d

# Import database schema
docker exec -i geo-platform_mysql_1 mysql -u geouser -pgeopassword exchange_geo < database/schema.sql

# Check services
docker-compose ps
```

### Docker Compose Services
- **MySQL**: `localhost:3306`
- **Redis**: `localhost:6379`
- **Backend API**: `localhost:8000`
- **Frontend**: `localhost:3000` (if included in compose)

## ⚙️ Configuration Guide

### Required API Keys

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Add to `.env`: `OPENAI_API_KEY=sk-...`

#### Perplexity API Key (Optional)
1. Go to https://www.perplexity.ai/settings/api
2. Generate API key
3. Add to `.env`: `PERPLEXITY_API_KEY=pplx-...`

#### Google API Key (Optional)
1. Go to https://console.developers.google.com/
2. Create project and enable Generative AI API
3. Add to `.env`: `GOOGLE_API_KEY=AIza...`

### Email Configuration (Optional)
```bash
# SendGrid
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@yourdomain.com

# Or SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Issue: "Database connection failed"
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection manually
mysql -u geouser -p -h localhost exchange_geo

# Solution: Ensure MySQL is running and credentials are correct
```

#### Issue: "Port 8000 already in use"
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=8001
```

#### Issue: "Redis connection failed"
```bash
# Check Redis service
redis-cli ping

# Start Redis if not running
sudo systemctl start redis

# Or disable Redis temporarily
REDIS_HOST=
```

#### Issue: "API key invalid"
```bash
# Test OpenAI key
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.openai.com/v1/models

# Solution: Verify API key format and permissions
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_content_website_status ON content(website_id, optimization_status);
CREATE INDEX idx_ai_tracking_website_platform ON ai_tracking_results(website_id, platform, tracked_at);
```

#### Node.js Memory Settings
```bash
# For large operations, increase memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

## 📚 Next Steps

1. **Create Your First Website Scan**
   - Login to http://localhost:3000
   - Add a website URL
   - Run your first scan

2. **Set Up API Keys**
   - Add OpenAI API key for content optimization
   - Configure other AI platform keys

3. **Explore Features**
   - Try the content optimization tools
   - Set up AI tracking for your brand
   - Generate your first GEO report

4. **Production Deployment**
   - Follow the production deployment guide in README.md
   - Set up proper SSL certificates
   - Configure monitoring and backups

## 🚀 Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Set up SSL certificates
- [ ] Configure production database with backups
- [ ] Set up monitoring and alerting
- [ ] Configure email service
- [ ] Set up CDN for static assets
- [ ] Configure proper logging
- [ ] Set up process monitoring (PM2)
- [ ] Configure firewall rules
- [ ] Set up automated backups

---

Need help? Check our [full documentation](README.md) or open an issue on GitHub.