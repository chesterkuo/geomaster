# GEO Platform - AI Search Engine Optimization SaaS

A comprehensive platform that helps businesses optimize their content for AI-powered search engines (ChatGPT, Google Gemini, Perplexity AI), enabling them to maintain and improve visibility in the AI-first search ecosystem.

## 🚀 Features

### Core Functionality
- **Website Scanning**: Comprehensive analysis of website content for AI optimization
- **Content Optimization**: AI-powered content enhancement with one-click optimization
- **AI Visibility Tracking**: Track mentions and citations across ChatGPT, Gemini, Perplexity, and Claude
- **GEO Scoring**: Proprietary scoring algorithm for AI search optimization

### Advanced Tools
- **Competitor Analysis**: Monitor competitor visibility in AI platforms
- **Keyword Research**: AI-focused keyword suggestions and tracking
- **Report Generation**: Comprehensive optimization reports
- **Multi-tenant Support**: Organization and team management

### Integration Options
- **Level 0**: Manual download and implementation
- **Level 1**: JavaScript embed code for quick optimization
- **Level 2**: WordPress/Shopify plugins
- **Level 3**: Full API integration
- **Level 4**: Complete automation with workflow integration

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: MySQL 8.0+ with Sequelize ORM
- **Caching**: Redis for session management and queues
- **Queue System**: Bull for background job processing
- **Authentication**: JWT with Passport.js
- **AI Integration**: OpenAI GPT-4, Perplexity, Google Gemini APIs

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **API Client**: Axios with React Query
- **UI Components**: Custom components with Lucide React icons

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- MySQL 8.0 or higher
- Redis 7.0 or higher
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd geo-platform
```

### 2. Database Setup

#### Create MySQL Database
```sql
mysql -u root -p
CREATE DATABASE exchange_geo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

#### Import Database Schema
```bash
mysql -u root -p exchange_geo < database/schema.sql
```

### 3. Backend Setup

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Application
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=exchange_geo
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key

# External APIs (Required for full functionality)
OPENAI_API_KEY=sk-your-openai-api-key
PERPLEXITY_API_KEY=pplx-your-perplexity-key
GOOGLE_API_KEY=your-google-api-key

# Email Service (Optional)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=your-s3-bucket
```

#### Start Backend Development Server
```bash
npm run dev
```

The backend API will be available at `http://localhost:8000`

### 4. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Start Frontend Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🚀 Production Deployment

### Using Docker

#### 1. Build Backend Image
```bash
docker build -t geo-platform-backend .
```

#### 2. Run with Docker Compose
```bash
docker-compose up -d
```

### Manual Deployment

#### 1. Build Backend
```bash
npm run build
npm start
```

#### 2. Build Frontend
```bash
cd frontend
npm run build
```

Serve the `frontend/dist` folder using nginx or your preferred web server.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile

### Website Management
- `GET /api/v1/websites` - List websites
- `POST /api/v1/websites` - Create website
- `GET /api/v1/websites/:id` - Get website details
- `PUT /api/v1/websites/:id` - Update website
- `DELETE /api/v1/websites/:id` - Delete website

### Scanning & Optimization
- `POST /api/v1/scans` - Start website scan
- `GET /api/v1/scans/:id` - Get scan status
- `POST /api/v1/content/optimize` - Optimize content
- `GET /api/v1/tracking/mentions` - Get AI mentions

### Full API documentation available at: `http://localhost:8000/api/v1/docs`

## 🧪 Testing

### Backend Tests
```bash
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🔧 Development

### Code Quality
```bash
# Backend linting
npm run lint
npm run lint:fix

# Frontend linting
cd frontend
npm run lint
```

### Database Migrations
```bash
# Create migration
npm run migrate:create

# Run migrations
npm run migrate

# Undo last migration
npm run migrate:undo
```

## 📊 Monitoring

### Health Checks
- Backend: `http://localhost:8000/health`
- Database connection status
- Redis connection status
- Queue system status

### Logging
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Console output in development mode

## 🔐 Security

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, User, Viewer)
- Organization-level data isolation
- API rate limiting

### Data Protection
- Password hashing with bcrypt
- SQL injection prevention with Sequelize ORM
- XSS protection with helmet
- CORS configuration
- Input validation with Joi

## 📈 Scaling Considerations

### Performance Optimization
- Database indexing for optimal query performance
- Redis caching for frequently accessed data
- Background job processing with Bull queues
- CDN integration for static assets

### High Availability
- Database connection pooling
- Graceful shutdown handling
- Process monitoring with PM2
- Load balancing support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

#### Database Connection Failed
```bash
# Check MySQL service
sudo systemctl status mysql

# Check database credentials in .env
# Ensure database exists and user has permissions
```

#### Redis Connection Failed
```bash
# Check Redis service
sudo systemctl status redis

# Check Redis configuration
redis-cli ping
```

#### API Key Issues
- Ensure all required API keys are set in `.env`
- Verify API key permissions and quotas
- Check API key format and validity

### Getting Help
- Check the [Issues](https://github.com/your-org/geo-platform/issues) page
- Review API documentation at `/api/v1/docs`
- Check application logs for detailed error messages

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core platform functionality
- ✅ Basic AI tracking
- ✅ Content optimization
- ✅ Website scanning

### Phase 2 (Next)
- [ ] Advanced competitor analysis
- [ ] Real-time AI mention alerts
- [ ] Custom optimization templates
- [ ] Bulk optimization tools

### Phase 3 (Future)
- [ ] Machine learning optimization suggestions
- [ ] Advanced analytics dashboard
- [ ] Third-party integrations (Zapier, Make.com)
- [ ] White-label solutions

---

**GEO Platform** - Empowering businesses for the AI search era 🚀