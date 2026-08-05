## Hotel Booking API
A scalable hotel booking backend built with NestJS, designed with modular architecture, RBAC authorization, distributed locking, caching, and background job processing.

This project demonstrates how to build a production‑ready backend with features like authentication, role‑based permissions, resource ownership validation, dynamic room pricing, and reservation management.

## Features
NestJS modular architecture
JWT Authentication
Role Based Access Control (RBAC)
Ownership based authorization
Redis caching
Redis distributed locking for safe reservations
Bull queue for background jobs
Dynamic room pricing engine
Swagger API documentation
Pagination support
Clean layered architecture (Controller → Service → Repository)
Tech Stack
Node.js
NestJS
TypeScript
PostgreSQL
TypeORM
Redis
Bull Queue
JWT Authentication
Swagger
Project Architecture
The project follows a modular architecture where each domain is separated into its own module.

### Project Structure

├── auth

│ ├── guards

│ ├── decorators

│ ├── authorization

│ └── providers

├── rbac

│ ├── guards

│ ├── decorators

│ └── mapping

├── hotels

│ ├── dtos

│ ├── entities

│ ├── https

│ └── providers

├── rooms

│ ├── dtos

│ ├── entity

│ ├── providers

│ └── processors

├── reservations

│ ├── dtos

│ ├── entity

│ └── providers

├── redis

│ └── providers

├── common

│ ├── dto

│ ├── interceptors

│ └── utils

└── config


## Each module typically contains:

DTOs
Entities
Controllers
Services / Providers
Domain specific logic
Authentication
Authentication is implemented using JWT Access Tokens.
##
The system uses a custom AuthenticationGuard which supports multiple authentication strategies:

Bearer Token
Public endpoints (no authentication)
Example:

@Auth(AuthType.None)
@Get()
findAll()
Authorization
Authorization is implemented in two layers.

## 1️⃣ Role Based Access Control (RBAC)
Each role has a predefined set of permissions.

Example roles:

HOST
USER
Example permissions:

HOTEL_CREATE
HOTEL_UPDATE
HOTEL_DELETE
ROOM_CREATE
ROOM_UPDATE
ROOM_DELETE
BOOKING_CREATE
Example usage:


@UseGuards(PermissionGuard)
@Permissions(Permission.HOTEL_CREATE)
@Post()

## 2️⃣ Ownership Based Authorization
For resources that belong to a specific user (like hotels or rooms), an OwnershipGuard verifies that the authenticated user is the owner.

Example:

@UseGuards(OwnershipGuard)
@CheckOwnership('hotel', 'id')
@Patch(':id')
Ownership handlers are registered dynamically through an OwnershipHandlerRegistry.

Room Pricing Engine
Rooms support dynamic pricing rules.

A pricing rule contains:

startDate
endDate
price
priority
type
When pricing rules are created or updated, the system generates 365 days of daily prices using a background job.

This is handled by a Bull queue processor:


@Processor('daily-price')
The processor calculates and stores daily prices for fast reservation calculations.

Reservation System
Reservations include:

room
check-in date
check-out date
guest information
reservation status
To prevent double booking, the system uses:

Redis Distributed Locks
Before creating a reservation the system acquires a lock:


room:lock:{roomId}
This ensures multiple users cannot book the same room simultaneously.

Caching
Redis is used for caching frequently requested data.

Example:

Fetching all reservations
Fetching a specific reservation
Cache TTL:


300 seconds

Environment Variables

An .env.development.example file is included in the project.

To set up your environment, simply copy it and rename it to .env:


cp .env.development.example .env

Example:


# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=YOUR_DB_PASSWORD
DATABASE_NAME=hotel-booking
DATABASE_SYNC=true
DATABASE_AUTOLOAD=true

# JWT
JWT_SECRET=YOUR_JWT_SECRET
JWT_TOKEN_AUDIENCE=localhost:3000
JWT_TOKEN_ISSUER=localhost:3000
JWT_ACCESS_TOKEN_TTL=3600
JWT_REFRESH_TOKEN_TTL=86400

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
Installation
Clone the repository:


git clone https://github.com/your-username/hotel-booking-api.git

###
Install dependencies:

npm install
Running the Application
Development mode:

npm run start:dev
Production mode:


npm run start:prod


API Documentation
Swagger documentation is available after running the project:


http://localhost:3000/api
## Running Tests
### Running Tests

Basic HTTP-level tests (manual testing via API tools such as Postman or Insomnia) are supported.

Automated unit/e2e tests will be added in future releases.

Image upload for hotels and rooms
Admin dashboard
License
This project is licensed under the MIT License.
