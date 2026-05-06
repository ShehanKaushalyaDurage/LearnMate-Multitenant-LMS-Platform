# 🎓 LearnHub – Multi-Tenant LMS SaaS Platform

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**LearnHub** is an enterprise-grade, multi-tenant Learning Management System (LMS) delivered as a SaaS platform. Designed specifically to serve private tuition classes, colleges, and independent course creators, it utilizes a **Shared-Infrastructure, Isolated-Data** architecture to ensure maximum scalability, security, and performance.

## 🏗️ Architectural Overview

LearnHub operates on a highly optimized multi-tenant architecture designed to scale seamlessly while maintaining strict data isolation between tenants (institutes).

- **Dynamic Routing:** Tenant identification is handled via subdomain resolution (`{institute-slug}.learnhub.lk`). Nginx proxies the request to the NestJS backend, which extracts the tenant identity.
- **Database Isolation (Model A):** The system utilizes a Master PostgreSQL database for tenant registry, global billing, and platform administration. Upon identifying a tenant, the backend dynamically establishes a connection to a **dedicated PostgreSQL database** specifically provisioned for that tenant.
- **Microservices-Ready Monolith:** The backend is built with NestJS using a strict modular architecture, making it ready to be decoupled into microservices if horizontal scaling demands it.

## 🚀 Key Technical Engineering & DevOps Achievements

* **Automated Infrastructure Provisioning:** Engineered a dynamic tenant provisioning system where the Super Admin can create a new institute, which automatically spins up a new dedicated PostgreSQL database and applies Prisma schema migrations on the fly.
* **Containerized Deployment Strategy:** The entire stack (Backend, Frontend, Master DB, Tenant DBs, Redis) is containerized using **Docker** and orchestrated via **Docker Compose**, ensuring zero environment inconsistencies between staging and production.
* **Advanced Reverse Proxy & SSL:** Configured **Nginx** for dynamic wildcard subdomain routing and implemented **Let's Encrypt** wildcard SSL termination to secure all tenant data in transit.
* **Security & Performance:** 
  - Application-layer AES-256-GCM encryption for sensitive fields.
  - Redis-backed rate limiting (100 req/min per IP).
  - Short-lived JWTs mapped with `httpOnly` refresh cookies.
  - Zero-egress scalable file storage integrated with **Cloudflare R2** and **Bunny.net CDN** for high-speed video delivery.

## 🛠️ Technology Stack

**Infrastructure & DevOps:**
* Docker & Docker Compose
* Nginx (Reverse Proxy & Load Balancing)
* Linux VPS (Hetzner)
* Cloudflare (DNS & DDoS Protection)

**Backend:**
* NestJS 10+ (TypeScript)
* Prisma ORM (Multi-client architecture)
* PostgreSQL 15 (Master & Tenant isolated DBs)
* Redis (Session caching, Rate limiting)

**Frontend:**
* Angular 17+ (Standalone Components, Signals)
* Tailwind CSS & Angular Material

**Third-Party Integrations:**
* Cloudflare R2 (S3-Compatible Storage)
* Bunny.net (Video CDN)
* Resend.com (Transactional Emails)
* PayHere (Payment Gateway)

## � Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) or **yarn** (v1.22 or higher)
- **Docker** (v20.10 or higher) - [Download](https://www.docker.com/get-started)
- **Docker Compose** (v2.0 or higher)
- **PostgreSQL** (v15 or higher) - for local development (optional, can use Docker)
- **Redis** (v7 or higher) - for local development (optional, can use Docker)

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/learnhub.git
   cd learnhub
   ```

2. **Install root dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## ⚙️ Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables:**
   Edit the `.env` file and update the following required variables:
   ```env
   # Database credentials
   POSTGRES_USER=your_db_user
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=learnhub_master

   # JWT secrets (generate secure random strings)
   JWT_SECRET=your_64_char_jwt_secret
   JWT_REFRESH_SECRET=your_64_char_refresh_secret

   # Encryption key (32-byte hex)
   ENCRYPTION_KEY=your_32_byte_encryption_key

   # Redis password
   REDIS_PASSWORD=your_redis_password
   ```

   > **Security Note:** Never commit the `.env` file to version control. It's already included in `.gitignore`.

## 🗄️ Database Setup

### Using Docker (Recommended)

1. **Start the database services:**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Run Prisma migrations for master database:**
   ```bash
   npx prisma migrate dev --schema=prisma/master/schema.prisma
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate --schema=prisma/master/schema.prisma
   ```

### Manual Setup (Alternative)

1. **Create PostgreSQL databases:**
   ```sql
   CREATE DATABASE learnhub_master;
   -- Additional tenant databases will be created automatically
   ```

2. **Install Redis** and ensure it's running on port 6379.

## 🏃 Running the Application

### Development Mode

1. **Start all services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Start the backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

The application will be available at:
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api

### Production Mode

1. **Build the applications:**
   ```bash
   # Backend
   cd backend
   npm run build

   # Frontend
   cd frontend
   npm run build --prod
   ```

2. **Start production services:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

## 📖 API Documentation

The API documentation is automatically generated using Swagger/OpenAPI. Once the backend is running, visit:

**http://localhost:3000/api**

This provides interactive documentation for all available endpoints, including request/response examples and the ability to test endpoints directly from the browser.

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm run test                    # Run unit tests
npm run test:e2e               # Run end-to-end tests
npm run test:cov               # Run tests with coverage
```

### Frontend Tests

```bash
cd frontend
npm test                       # Run unit tests
```

## 🚢 Deployment

### Docker Deployment

1. **Build and start all services:**
   ```bash
   docker-compose up -d --build
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f [service-name]
   ```

### Manual Deployment

1. **Configure production environment variables**
2. **Build and deploy backend and frontend separately**
3. **Set up Nginx reverse proxy**
4. **Configure SSL certificates**
5. **Set up database backups and monitoring**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Backend:** Follow the existing ESLint and Prettier configuration
- **Frontend:** Use Angular CLI linting and formatting
- **Commits:** Use conventional commit format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@learnhub.lk or join our Discord community.

---

**LearnHub** - Empowering education through technology. 🚀
