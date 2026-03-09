# NestJS Backend Architecture with Redis, Custom Rate Limiting and Docker

## Overview

This project demonstrates a **production-style backend architecture** built using **NestJS**, **PostgreSQL**, **Prisma ORM**, **Redis**, and **Docker**.

The goal of the project is not CRUD complexity but **infrastructure design and backend engineering patterns**, including:

* Custom **rate limiting algorithms**
* **Redis caching layer**
* **Containerized deployment**
* **Database migrations**
* **Network-isolated services**

The system runs entirely using **Docker Compose**, orchestrating the API server, Redis, and PostgreSQL.

---

# Architecture

```
Client
  │
  ▼
NestJS API
  │
  ├── Redis
  │     ├── Cache
  │     └── Rate Limiter
  │
  ▼
PostgreSQL (Prisma ORM)
```

Services are isolated within a **Docker bridge network**.

---

# Tech Stack

| Component             | Technology        |
| --------------------- | ----------------- |
| Backend Framework     | NestJS            |
| Language              | TypeScript        |
| Database              | PostgreSQL        |
| ORM                   | Prisma            |
| Cache Layer           | Redis             |
| Rate Limiting         | Custom algorithms |
| Containerization      | Docker            |
| Service Orchestration | Docker Compose    |

---

# Key Backend Features

## 1. Redis Integration via ioredis

This project intentionally **avoids NestJS CacheManager** and instead uses **direct Redis integration via `ioredis`**.

### Why avoid CacheManager?

The built-in cache manager abstraction has limitations:

* Limited control over Redis primitives
* Harder to implement advanced patterns
* Less predictable performance under load
* Poor support for custom algorithms (rate limiting)

Using **ioredis** provides:

```
direct access to Redis commands
better connection handling
pipeline support
cluster compatibility
fine-grained performance tuning
```

Redis is used for:

```
response caching
rate limiting counters
sliding window tracking
```

---

# Redis Service Layer

A dedicated Redis service wraps all Redis operations.

Example responsibilities:

```
GET / SET cache entries
pattern-based key deletion
TTL management
connection lifecycle management
```

The Redis client is injected into NestJS modules using a provider pattern.

---

# Rate Limiting Architecture

Two different algorithms are implemented to demonstrate **different traffic protection strategies**.

```
Global rate limiting
API-level rate limiting
```

---

# Fixed Window Rate Limiter (Global)

The **Fixed Window algorithm** is implemented as a **global NestJS guard**.

This protects the entire backend from abusive clients.

### Advantages

```
extremely fast
minimal Redis operations
low memory footprint
good for global API protection
```

### Limitations

```
burst traffic allowed at window boundaries
less precise enforcement
```

---

# Sliding Window Rate Limiter (Endpoint Level)

For sensitive endpoints, the project implements a **Sliding Window algorithm** using Redis sorted sets.

### Advantages

```
precise request limiting
no burst edge cases
better fairness across time windows
```

### Trade-offs

```
higher memory usage
slightly slower than fixed window
```

---

# Rate Limiting Decorator

API endpoints can define custom limits using a decorator.

Example:

```
@RateLimit(5, 60)
POST /auth/login
```

This overrides default values defined in the guard.

The guard retrieves configuration via NestJS **Reflector metadata**.

---

# Prisma ORM Integration

Database access is implemented using **Prisma ORM**.

Benefits:

```
type-safe queries
migration system
generated client
clean schema modeling
```

Migrations are automatically applied during container startup.

```
prisma migrate deploy
```

This ensures schema consistency across environments.

---

# Dockerized Deployment

The system uses **multi-stage Docker builds** for optimized images.

### Build Stage

```
install dependencies
compile NestJS application
```

### Production Stage

```
install production dependencies only
copy compiled output
run database migrations
start application
```

---

# Docker Compose Services

Three services are orchestrated:

```
app
postgres
redis
```

### API Service

Runs the NestJS backend.

Startup sequence:

```
run migrations
start server
```

### PostgreSQL Service

Provides persistent relational storage.

Features:

```
health checks
volume persistence
isolated container network
```

### Redis Service

Provides:

```
in-memory caching
rate limiting storage
append-only persistence
```

---

# Container Networking

All services communicate via an internal Docker network.

Example internal hosts:

```
postgres:5432
redis:6379
```

No container communicates using localhost.

---

# Running the Project

## Build and Start Services

```
docker compose up --build
```

This will start:

```
NestJS API
PostgreSQL database
Redis cache
```

---

# Access the API

```
http://localhost:3000
```

---

# Performance Considerations

Redis operations used in rate limiting are **O(log n)** or **O(1)** depending on the algorithm.

The system is designed to:

```
minimize Redis round trips
use pipelined commands
avoid distributed locks
```

This ensures high throughput even under heavy API load.


---

# Summary

This project demonstrates backend engineering patterns including:

```
custom rate limiting algorithms
redis-based caching
dockerized infrastructure
database migrations
modular NestJS architecture
```

It focuses on **system design and backend infrastructure**, not just API endpoints.
