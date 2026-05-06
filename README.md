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

## 📂 Repository Structure
```text
learnhub/
├── backend/          # NestJS application (Modular domains)
├── frontend/         # Angular 17+ application (Lazy-loaded modules)
├── docker/           # Nginx configs, custom Dockerfiles
├── prisma/
│   ├── master/       # Master DB schema (Tenants, Subscriptions)
│   └── tenant/       # Per-tenant DB schema (Users, Courses, Exams)
└── docker-compose.yml # Container orchestration configuration
