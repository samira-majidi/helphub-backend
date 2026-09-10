# HelpHub

A full-stack service marketplace focused on discovering nearby professionals and enabling authenticated users to communicate with them in real time.

The provided project snapshot contains the **NestJS backend** implementation, including authentication, authorization, geospatial professional discovery, real-time chat, notifications, file storage, Redis integration, PostgreSQL/PostGIS persistence, and Docker configuration.

> **Source scope:** The repository snapshot provided for this README exposes the backend source tree and backend configuration. The frontend source code was not included in the supplied project files, so frontend architecture and frontend-specific technologies are intentionally not documented here.

---

## Overview

HelpHub is designed around a simple workflow:

1. Users create accounts or register as specialists.
2. Specialists maintain a professional profile with category, biography, availability status, location, and avatar.
3. Users can search for nearby specialists using geographic coordinates, radius, and category filters.
4. Users can open direct conversations with specialists.
5. Messages are persisted in PostgreSQL and delivered in real time through Socket.IO.
6. Chat supports text, image, and audio messages.
7. Redis is used for presence, last-seen information, counters, and locking utilities.
8. Notifications are persisted and delivered through a dedicated WebSocket namespace.

The backend is organized into domain-oriented modules rather than a single monolithic service class.

---

## Features

### User & Authentication

* User registration
* Specialist registration
* Sign in
* JWT access-token authentication
* Refresh-token endpoint
* Global authentication guard with opt-out support for public endpoints
* Authenticated-user extraction through a custom `ActiveUser` decorator

### Specialist Management

* Specialist profiles
* Job categories
* Specialist biography
* Specialist avatar
* Availability status
* Geographic location
* Public specialist profiles
* Specialist self-management endpoints
* Real-time specialist availability updates

### Nearby Specialist Discovery

* Geographic radius search
* PostgreSQL/PostGIS `geography(Point, 4326)` storage
* Category filtering
* Pagination
* Distance-based ordering
* Availability-based priority ordering
* Spatial index on specialist location

### Real-Time Chat

* Socket.IO
* Dedicated `/chat` namespace
* Direct conversations
* Persistent rooms and messages
* Room membership
* Typing indicators
* Online/offline presence
* Last-seen tracking
* Read timestamps
* Unread message counts
* Cursor-based message pagination
* Text, image, and audio messages

### Notifications

* Dedicated `/notification` namespace
* User-specific notification rooms
* Database-persisted notifications
* Event-driven notification creation
* Real-time `newNotification` delivery

### File Handling

* Image and audio upload support
* MIME-type validation
* Public/private object storage
* S3-compatible storage through Arvan Cloud
* UUID/timestamp-based object naming
* Presigned URLs for private files
* Upload ownership validation
* Attachment-state tracking

---

## Key Engineering Highlights

### 1. Real-Time Direct Messaging

The chat subsystem uses Socket.IO namespaces and room-based communication while persisting messages in PostgreSQL.

The gateway handles room lifecycle, message delivery, typing events, read events, and presence updates.

```ts
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway extends BaseGateway {}
```

**Implementation**

* `src/chat/chat.gateway.ts`
* `src/chat/chat.service.ts`
* `src/chat/gateway/base.gateway.ts`
* `src/chat/interface/authenticated-socket.interface.ts`

The architecture separates transport concerns in the gateway from persistence and business logic in `ChatService`.

---

### 2. Geospatial Professional Discovery

Specialists store their location as a PostGIS geography point:

```ts
@Index({ spatial: true })
@Column({
  type: 'geography',
  spatialFeatureType: 'Point',
  srid: 4326,
})
location: geojson.Point;
```

Searches use `ST_DWithin` for radius filtering and PostGIS distance operations for ordering.

The current default search radius is **5,000 meters**, with a default page size of **20**.

The query also prioritizes availability:

```text
AVAILABLE → BUSY → OFF_SHIFT
```

and then orders results by geographic distance.

**Implementation**

* `src/experts/entity/experts.entity.ts`
* `src/experts/providers/ExpertSearchService.ts`

---

### 3. Transaction-Safe Direct Room Creation

Creating a direct room is protected against concurrent duplicate-room creation.

The implementation:

1. Starts a database transaction.
2. Generates a deterministic advisory-lock key from both user IDs.
3. Acquires a PostgreSQL transaction-scoped advisory lock.
4. Checks for an existing direct room.
5. Creates the room and its two members when necessary.
6. Commits the transaction.
7. Releases the query runner in `finally`.

```ts
await queryRunner.query(
  'SELECT pg_advisory_xact_lock($1)',
  [lockKey],
);
```

This is one of the more significant backend design choices in the project because direct-room creation is a concurrency-sensitive operation.

**Implementation**

* `src/chat/chat.service.ts`

---

### 4. Resource Ownership as a Separate Authorization Layer

The backend contains a dedicated ownership subsystem rather than putting ownership checks directly inside every controller.

The ownership layer includes:

* Ownership metadata
* Ownership decorators
* Ownership guards
* Ownership service
* Ownership handler registry

```text
src/auth/authorization/
├── ownership-handler.registry.ts
├── ownership.decorator.ts
├── ownership.guard.ts
├── ownership.module.ts
└── ownership.service.ts
```

The chat HTTP controller demonstrates the intended separation:

```ts
@Get('rooms/:roomId/messages')
@UseGuards(OwnershipGuard)
async getMessages(...) {}
```

The project also contains a WebSocket ownership guard implementation under:

```text
src/chat/gaurd/ws-ownership.guard.ts
```

The supplied snapshot shows that guard infrastructure exists, although the `ChatGateway` currently does not apply `WsOwnershipGuard` to its handlers.

---

### 5. Private Object Storage with Presigned URLs

Files are stored outside the application database using an S3-compatible object-storage interface.

The upload provider:

* Creates an `S3Client`
* Uses the configured Arvan endpoint
* Stores metadata in PostgreSQL
* Supports `private` and `public-read` ACL modes
* Generates presigned URLs for private objects

```ts
const signedUrl = await getSignedUrl(
  this.s3Client,
  command,
  { expiresIn: 3600 },
);
```

Private image and audio messages are converted to temporary signed URLs before being returned by the chat service.

**Implementation**

* `src/common/upload/providers/upload-to-aws.provider.ts`
* `src/common/upload/providers/upload.service.ts`
* `src/common/upload/entity/upload.entity.ts`

---

### 6. Event-Driven Notification Flow

The backend uses NestJS EventEmitter to decouple message creation from notification delivery.

When a direct message is saved, `ChatService` emits:

```ts
this.eventEmitter.emit('notification.create', {
  userId: String(receiver.user_id),
  type: 'NEW_MESSAGE',
  ...
});
```

The notification service listens for the event, persists the notification, and forwards it through the notification WebSocket gateway.

```text
ChatService
    │
    └── notification.create
             │
             ▼
     NotificationService
             │
      ┌──────┴──────┐
      ▼             ▼
 PostgreSQL      Socket.IO
```

**Implementation**

* `src/chat/chat.service.ts`
* `src/notification/notification.service.ts`
* `src/notification/gateway/NotificationGateway.ts`

---

### 7. Redis-Based Presence, Counters and Locking Utilities

Redis is used for more than a single purpose.

The current implementation includes:

* Online/offline status
* Last-seen timestamps
* Daily message counters
* Generic Redis key/value operations
* Distributed locking utility

For example, message sending increments:

```text
chat:daily-message-count:{userId}
```

and blocks users after the configured daily threshold of **20 messages**.

Presence is tracked with keys such as:

```text
user:{userId}:status
user:{userId}:last_seen
```

The project also contains a reusable `RedisLockService` using `SET NX PX` and a Lua script for safe lock release.

**Implementation**

* `src/redis/providers/redis.service.ts`
* `src/redis/providers/redis-lock.service.ts`
* `src/chat/gateway/base.gateway.ts`
* `src/chat/chat.service.ts`

---

## Architecture

The backend follows a modular NestJS architecture with domain-oriented modules.

```text
                         ┌──────────────────────┐
                         │      Client(s)        │
                         │ HTTP + Socket.IO      │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
             HTTP Controllers                 WebSocket Gateways
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                              NestJS Modules
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
     PostgreSQL                  Redis                Object Storage
     + PostGIS              Presence / Counters        Arvan S3
          │
          ▼
   TypeORM Entities
```

### Main backend modules

```text
src/
├── auth/
├── chat/
├── common/
│   ├── upload/
│   └── websocket/
├── config/
├── experts/
├── notification/
├── rbac/
├── redis/
└── users/
```

`AppModule` wires these modules together and also registers the global authentication guard and response interceptor.

---

## Tech Stack

### Backend

| Technology                 | Usage                                 |
| -------------------------- | ------------------------------------- |
| Node.js 20                 | Runtime / Docker base image           |
| NestJS 11                  | Backend framework                     |
| TypeScript                 | Application language                  |
| TypeORM                    | ORM and persistence                   |
| PostgreSQL                 | Primary relational database           |
| PostGIS                    | Geographic search                     |
| Redis                      | Presence, counters, locking           |
| Socket.IO                  | Real-time communication               |
| JWT                        | Authentication                        |
| Passport                   | Authentication ecosystem              |
| bcryptjs                   | Password hashing dependency           |
| EventEmitter               | In-process event-driven communication |
| AWS SDK for JavaScript     | S3-compatible object storage          |
| Arvan Cloud Object Storage | Object storage endpoint               |
| class-validator            | DTO validation                        |
| Swagger                    | API documentation                     |
| Jest                       | Automated tests                       |
| Bull                       | Queue infrastructure dependency       |
| Docker                     | Backend containerization              |
| Docker Compose             | Local service orchestration           |

The dependency configuration explicitly includes these packages in `package.json`.

---

## Project Structure

```text
src/
├── auth/
│   ├── authorization/
│   ├── config/
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── guards/
│   ├── http/
│   ├── interfaces/
│   ├── providers/
│   └── types/
│
├── chat/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── filter/
│   ├── gateway/
│   ├── gaurd/
│   ├── interface/
│   └── middleware/
│
├── common/
│   ├── dto/
│   ├── enum/
│   ├── interceptors/
│   ├── interface/
│   ├── upload/
│   ├── utill/
│   └── websocket/
│
├── config/
├── experts/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── enum/
│   ├── gateway/
│   └── providers/
│
├── notification/
├── rbac/
├── redis/
└── users/
```

The supplied source tree confirms the domain separation and the dedicated modules for authentication, chat, experts, notifications, RBAC, Redis, uploads, and users.

---

## Authentication & Authorization

### Authentication

Authentication is implemented as a global NestJS guard.

`AuthenticationGuard` uses metadata to select the appropriate authentication mechanism:

```ts
[AuthType.Bearer]: this.accessTokenGuard,
[AuthType.None]: { canActivate: () => true },
```

The default authentication type is Bearer authentication, while individual routes can explicitly opt out.

**Implementation**

* `src/auth/guards/authentication/authentication.guard.ts`
* `src/auth/guards/access-token/access-token.guard.ts`
* `src/auth/decorators/auth.decorator.ts`

The access-token guard extracts the bearer token from the `Authorization` header and verifies it through `JwtService`.

### Authentication Endpoints

| Method | Endpoint                    | Auth   | Purpose                       |
| ------ | --------------------------- | ------ | ----------------------------- |
| POST   | `/auth/register`            | Public | Register a standard user      |
| POST   | `/auth/register-specialist` | Public | Register a specialist         |
| POST   | `/auth/sign-in`             | Public | Authenticate a user           |
| POST   | `/auth/refresh-token`       | Public | Refresh authentication tokens |

These routes are defined in `src/auth/auth.controller.ts`.

### Specialist Registration Flow

Specialist registration does more than create a user.

The flow is:

```text
/register-specialist
        │
        ▼
 create user as SPECIALIST
        │
        ▼
 emit specialist.registered
        │
        ▼
 ExpertsService listener
        │
        ▼
 create initial Expert profile
```

This is implemented with NestJS EventEmitter rather than tightly coupling the authentication service to specialist persistence.

### RBAC

The repository contains a dedicated RBAC subsystem:

```text
src/rbac/
├── constants/
├── decorators/
├── enums/
├── guards/
└── mapping/
```

It includes:

* Role enum
* Permission enum
* Permission decorator
* Permission guard
* Role-to-permission mapping

The supplied snapshot does not show enough controller usage to claim that every protected business operation currently relies on the RBAC guard, so this README treats RBAC as an implemented authorization subsystem rather than claiming universal endpoint enforcement.

---

## Real-Time Chat

The chat module uses a dedicated Socket.IO namespace:

```ts
@WebSocketGateway({ namespace: '/chat' })
```

### Supported operations

* Join direct room
* Leave room
* Send direct message
* Typing events
* Mark messages as read
* Broadcast message-read events
* Online/offline status
* Last-seen tracking

The gateway uses rooms named from persisted room IDs:

```text
room_{roomId}
```

### Message persistence

Messages are stored in PostgreSQL through TypeORM.

```text
Room
 ├── RoomMember
 │     └── User
 │
 └── Message
       ├── User
       ├── Image Upload
       └── Audio Upload
```

The `Message` entity also has a composite index on `(room_id, created_at)` for message retrieval.

### Read state

Each room member stores `last_read_at`.

This makes it possible to calculate unread messages with:

```text
message.created_at > last_read_at
AND message.sender_id != current_user
```

The service exposes `getUnreadCount()` and updates `last_read_at` whenever a user joins or explicitly marks messages as read.

### Cursor pagination

Message history is retrieved using a cursor rather than loading all messages at once.

The query orders by:

```text
created_at DESC
id DESC
```

and then uses the cursor message's timestamp and ID to fetch older records.

This provides stable pagination even when multiple messages share the same timestamp.

### Message rate limit

The chat service tracks a per-user daily message count in Redis.

The current implementation rejects a user after more than **20 messages in a 24-hour Redis window**.

### WebSocket authentication

The shared `BaseGateway` installs `WsAuthMiddleware` during gateway initialization:

```ts
afterInit(server: Server) {
  server.use(WsAuthMiddleware(this.jwtService));
}
```

This creates a common authentication layer for WebSocket namespaces that extend `BaseGateway`.

---

## Notifications

Notifications have their own WebSocket namespace:

```text
/notification
```

Users are placed into a room named after their user ID.

```ts
client.join(userId.toString());
```

The notification flow is event-driven:

```text
Message Created
      │
      ▼
notification.create
      │
      ▼
NotificationService
      │
      ├── Save notification
      │
      └── Emit newNotification
```

The notification entity contains:

* UUID
* User ID
* Notification type
* Title
* Message
* JSON metadata
* Read state
* Created/updated timestamps

---

## Geolocation & Professional Discovery

Specialists store coordinates as a PostGIS geography point using SRID 4326.

The service validates:

* Latitude: `-90` to `90`
* Longitude: `-180` to `180`

The search service then uses:

```sql
ST_DWithin(...)
```

to restrict results to the requested radius.

The default radius is:

```text
5000 meters
```

The search can also filter by category and paginate through `limit` and `page`.

### Search ordering

Results are sorted in two stages:

1. Availability priority
2. Geographic distance

```text
AVAILABLE
    ↓
BUSY
    ↓
OFF_SHIFT
    ↓
Distance ascending
```

This is implemented directly in the database query rather than performing the sorting in application memory.

---

## File Upload & Storage

The upload subsystem separates validation, metadata persistence, and object storage.

### Upload flow

```text
HTTP Upload
    │
    ▼
UploadService
    │
    ├── Validate MIME type
    ├── Determine IMAGE / AUDIO
    │
    ▼
UploadToAwsProvider
    │
    ▼
Arvan Cloud S3-compatible Storage
    │
    ▼
Save metadata in PostgreSQL
```

### Supported MIME types

#### Images

```text
image/gif
image/jpeg
image/jpg
image/png
image/webp
```

#### Audio

```text
audio/webm
audio/ogg
audio/mpeg
audio/mp4
audio/wav
```

These are checked before the upload is sent to object storage.

### Private files

Private files receive a `private` ACL and are served through signed URLs generated with the S3 presigner.

The current implementation uses a **1-hour presigned URL lifetime**.

### Attachment ownership

`GalleryManagerService` verifies that uploaded files:

* Belong to the current user
* Are not already attached
* Respect the configured maximum count

It also uses pessimistic locking when an `EntityManager` is available.

---

## Database

The backend uses PostgreSQL with TypeORM.

The Docker configuration uses:

```text
postgis/postgis:16-3.5-alpine
```

which is consistent with the project's PostGIS-based spatial queries.

### Main entities

```text
User
├── Expert
│   ├── Category
│   └── Avatar (Upload)
│
├── RoomMember
│   ├── Room
│   └── User
│
├── Message
│   ├── Room
│   ├── Sender
│   ├── Image Upload
│   └── Audio Upload
│
├── Upload
└── Notification
```

### Chat relationships

```text
Room
 ├── members: RoomMember[]
 └── messages: Message[]

RoomMember
 ├── room_id
 ├── user_id
 └── last_read_at

Message
 ├── room_id
 ├── sender_id
 ├── content
 ├── type
 ├── image_id
 └── audio_id
```

The room model supports `DIRECT` and `GROUP` enum values, although the supplied chat handlers implement direct conversations.

### Relevant indexes

The code explicitly defines:

```text
IDX_ROOM_ID_CREATED_AT
(room_id, created_at)
```

for messages, a user ID index on `room_members`, and a spatial index on specialist locations.

---

## API Overview

### Authentication

| Method | Endpoint                    | Authentication | Purpose             |
| ------ | --------------------------- | -------------- | ------------------- |
| POST   | `/auth/register`            | Public         | Register user       |
| POST   | `/auth/register-specialist` | Public         | Register specialist |
| POST   | `/auth/sign-in`             | Public         | Sign in             |
| POST   | `/auth/refresh-token`       | Public         | Refresh token       |

### Specialists

| Method | Endpoint                   | Authentication | Purpose                        |
| ------ | -------------------------- | -------------- | ------------------------------ |
| GET    | `/experts/search`          | Public         | Search nearby specialists      |
| GET    | `/experts/:id`             | Public         | Get specialist profile         |
| GET    | `/experts/me`              | Bearer         | Get current specialist profile |
| POST   | `/experts`                 | Bearer         | Create specialist profile      |
| PATCH  | `/experts/me`              | Bearer         | Update own profile             |
| PATCH  | `/experts/me/availability` | Bearer         | Update availability            |
| DELETE | `/experts/me`              | Bearer         | Delete own profile             |

These endpoints are defined in `src/experts/controller/experts.controller.ts`.

### Chat

| Method | Endpoint                       | Authentication           | Purpose                     |
| ------ | ------------------------------ | ------------------------ | --------------------------- |
| GET    | `/chat/rooms/:roomId/messages` | Bearer + Ownership Guard | Retrieve room messages      |
| GET    | `/chat/conversations`          | Bearer                   | Retrieve user conversations |

### WebSocket namespaces

```text
/chat
/notification
/experts
```

The project defines dedicated gateways for chat, notifications, and specialist status updates.

---

## Validation & Error Handling

The application registers a global `ValidationPipe` with:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
```

This provides DTO-based validation and rejects unexpected properties.

The backend also uses NestJS exception types such as:

* `BadRequestException`
* `UnauthorizedException`
* `ForbiddenException`
* `NotFoundException`
* `ConflictException`
* `InternalServerErrorException`
* `RequestTimeoutException`

### HTTP response envelope

A global response interceptor wraps successful HTTP responses with:

```text
data
meta.timestamp
meta.path
meta.version
```

The same interceptor logs HTTP method, URL, and execution duration.

**Implementation**

`src/common/interceptors/data-response/data-response.interceptor.ts`

### WebSocket errors

A dedicated WebSocket exception filter logs exceptions and emits a structured `exception` event back to the client.

**Implementation**

`src/chat/filter/ws-exception.filter.ts`

---

## Security

The provided implementation contains several concrete security-oriented controls.

### JWT authentication

Bearer tokens are read from the `Authorization` header and verified through `JwtService`. Invalid or missing tokens result in `UnauthorizedException`.

### Password hashing abstraction

The authentication module contains dedicated hashing providers, including:

```text
src/auth/providers/bcrypt.provider.ts
src/auth/providers/hashing.provider.ts
```

and the project declares `bcryptjs` as a dependency.

### Input validation

Global validation uses whitelist, forbidden-property rejection, and transformation.

### Upload validation

Uploads are restricted to explicitly allowed image and audio MIME types before being sent to object storage.

### Private object access

Private files use signed URLs rather than returning a permanent public object URL.

### Ownership validation

The project includes both HTTP ownership checks and a WebSocket ownership guard implementation.

### CORS

CORS is configured with an environment-driven client origin and credentials enabled.

### Security limitations

The supplied snapshot does **not** provide evidence for:

* HTTP security headers such as Helmet
* CSRF protection
* IP-based throttling
* Refresh-token rotation
* Token storage strategy on the frontend

Those are therefore not presented as implemented features.

---

## Performance

The code contains several concrete performance-related decisions.

### Database-side geospatial filtering

Nearby specialist filtering is performed inside PostgreSQL/PostGIS using `ST_DWithin`, rather than retrieving all specialists and filtering in application memory.

### Spatial index

The specialist location field is explicitly marked with a spatial index.

### Message index

Messages use a composite `(room_id, created_at)` index to support room-specific time-ordered queries.

### Cursor pagination

Chat history uses cursor-based pagination and fetches only a limited window of messages.

### Redis counters

Message-rate counting is handled with Redis atomic increment operations rather than a database counter.

### Targeted updates

Specialist availability updates fetch only the specialist ID before performing a narrow database update:

```ts
select: ['id']
```

followed by:

```ts
expertRepository.update(
  { id: expert.id },
  { availabilityStatus },
);
```

This avoids loading the full specialist entity for a simple status change.

### What is not claimed

The supplied backend snapshot does not provide evidence for:

* HTTP response caching
* Redis query caching
* CDN caching
* SSR / SSG / ISR / PPR
* Database read replicas
* Horizontal scaling
* Prometheus/Grafana monitoring

---

## Testing

The project uses Jest and includes test files for:

```text
src/app.controller.spec.ts
src/chat/chat.gateway.spec.ts
src/chat/chat.service.spec.ts
```

The configured scripts include:

```bash
npm test
npm run test:watch
npm run test:cov
npm run test:debug
npm run test:e2e
```

The Jest configuration uses `ts-jest` and a Node test environment.

The supplied source snapshot confirms the existence of unit-test files and Jest configuration, but it does not include the full test implementations or a coverage report. Therefore, no coverage percentage is claimed here.

---

## Deployment

The provided backend includes Docker and Docker Compose configuration.

### Docker

The Dockerfile uses a two-stage build:

```text
Stage 1
Node 20 Alpine
     ↓
npm install
     ↓
npm run build
     ↓
npm prune --omit=dev

Stage 2
Node 20 Alpine
     ↓
copy production node_modules
     ↓
copy dist
     ↓
node dist/main
```

### Docker Compose

The supplied Compose configuration defines:

```text
helphub-postgres
helphub-redis
helphub-api
```

PostgreSQL uses the PostGIS image, Redis uses `redis:7-alpine`, and the API is built from the backend Dockerfile.

### Swagger

Swagger documentation is generated at runtime and exposed under:

```text
/api
```

through `SwaggerModule.setup('api', app, document)`.

### Deployment caveats in the supplied configuration

The provided configuration contains a few values that should be reconciled before treating it as a production deployment template:

1. The application defaults to port `8080`, while the Compose API mapping is `8080:3000`.
2. PostgreSQL database names differ between the sample `.env` (`hotel-booking`) and Compose (`helphub_db`).
3. `BullModule` is configured with Redis host `localhost`, which is not the Compose Redis service name.
4. The sample Arvan bucket name is `hotel-reservation-images`, which appears unrelated to HelpHub.
5. A Compose file contains literal passwords in the provided snapshot and should not be committed in a real deployment.

These are configuration inconsistencies in the supplied material, not capabilities of the application.

---

## Environment Variables

The backend reads the following environment variables.

```env
# Database
DATABASE_HOST=
DATABASE_PORT=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
DATABASE_SYNC=
DATABASE_AUTOLOAD=

# JWT
JWT_SECRET=
JWT_TOKEN_AUDIENCE=
JWT_TOKEN_ISSUER=
JWT_ACCESS_TOKEN_TTL=
JWT_REFRESH_TOKEN_TTL=

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

# Object Storage
ARVAN_ACCESS_KEY=
ARVAN_SECRET_KEY=
ARVAN_ENDPOINT=
ARVAN_BUCKET_NAME=
ARVAN_REGION=
```

These variables are consumed by the database, Redis, JWT, and Arvan object-storage configuration providers.

**Never commit real credentials to Git.**

---

## Getting Started

### Requirements

Based on the supplied configuration, the backend expects:

* Node.js 20-compatible runtime
* PostgreSQL with PostGIS support
* Redis
* Arvan Cloud S3-compatible object storage when file uploads are enabled

### Install dependencies

```bash
npm install
```

### Development

The configured development script is:

```bash
npm run start:dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm run start:prod
```

### Tests

```bash
npm test
```

### Test coverage

```bash
npm run test:cov
```

### End-to-end tests

```bash
npm run test:e2e
```

The script names above come directly from the supplied `package.json`.

### Docker

The supplied Docker Compose configuration is intended to run PostgreSQL, Redis, and the API together.

Before using it, reconcile the port, database, Redis, and secret configuration described in the deployment section.

---

## Important Implementation Files

### Authentication

```text
src/auth/auth.controller.ts
src/auth/providers/auth.service.ts
src/auth/providers/sing-in.provider.ts
src/auth/providers/refresh-token.provider.ts
src/auth/providers/generate-token.providers.ts
src/auth/guards/access-token/access-token.guard.ts
src/auth/guards/authentication/authentication.guard.ts
```

### Authorization

```text
src/auth/authorization/ownership.guard.ts
src/auth/authorization/ownership.service.ts
src/auth/authorization/ownership-handler.registry.ts
src/rbac/guards/permission.guard.ts
src/rbac/decorators/permissions.decorator.ts
src/rbac/mapping/role-permission.map.ts
```

### Chat

```text
src/chat/chat.gateway.ts
src/chat/chat.service.ts
src/chat/gateway/base.gateway.ts
src/chat/middleware/ws-auth.middleware.ts
src/chat/filter/ws-exception.filter.ts
src/chat/entity/message.entity.ts
src/chat/entity/room.entity.ts
src/chat/entity/room-member.entity.ts
```

### Geospatial Search

```text
src/experts/entity/experts.entity.ts
src/experts/providers/ExpertSearchService.ts
src/experts/providers/experts.service.ts
```

### Uploads

```text
src/common/upload/providers/upload.service.ts
src/common/upload/providers/upload-to-aws.provider.ts
src/common/upload/providers/gallery-manager.service.ts
src/common/upload/entity/upload.entity.ts
```

### Notifications

```text
src/notification/notification.service.ts
src/notification/gateway/NotificationGateway.ts
src/notification/entities/notification.entity.ts
```

### Redis

```text
src/redis/providers/redis.service.ts
src/redis/providers/redis-lock.service.ts
```

---

## API Response Format

Successful HTTP responses are normalized by the global response interceptor into:

```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-01-01T00:00:00.000Z",
    "path": "/example",
    "version": "1.0.0"
  }
}
```

The actual application response is wrapped by `DataResponseInterceptor`, which also records request duration in application logs.

---

## Future Improvements

Based strictly on the supplied implementation and configuration, the most concrete next improvements would be:

### Production configuration hardening

Separate local-development and production configuration more cleanly, remove credentials from Compose files, and reconcile the API/Redis/database settings.

### Refresh-token hardening

The refresh-token provider exists, but the supplied snapshot does not provide enough implementation detail to verify rotation or token revocation. A production implementation should make those guarantees explicit.

### WebSocket authorization consistency

`WsOwnershipGuard` exists, but the supplied `ChatGateway` handlers do not currently apply it. Authorization rules should be consistently enforced at the WebSocket event boundary where resource ownership matters.

### Upload lifecycle cleanup

The application tracks attachments using `isAttached`, but the supplied object-storage code does not show deletion of orphaned objects from Arvan Cloud. A cleanup strategy would prevent unused objects from accumulating.

### Notification API surface

The notification subsystem currently demonstrates event creation, persistence, and real-time delivery, but the supplied snapshot does not show endpoints for listing, reading, or deleting notifications.

### Production observability

The project has structured application logging and request timing, but the supplied snapshot does not show metrics, tracing, or external monitoring infrastructure.

---

## What the Current Snapshot Demonstrates

The backend implementation demonstrates practical experience with:

* Modular NestJS architecture
* JWT-based authentication
* Custom NestJS guards and decorators
* RBAC infrastructure
* Resource ownership authorization
* PostgreSQL and TypeORM
* PostGIS spatial queries
* Transaction management
* PostgreSQL advisory locks
* Redis integration
* Redis-based counters and locks
* Socket.IO namespaces and rooms
* Persistent real-time messaging
* Event-driven notification delivery
* S3-compatible object storage
* Presigned URLs
* DTO validation
* Error handling
* Cursor-based pagination
* Database indexing
* Jest-based testing
* Multi-stage Docker builds

These are implementation-level features visible in the supplied backend source rather than inferred from technology names alone.

---

## Author

**Samira Majidi**

GitHub: `https://github.com/samira-majidi`

---

<!--
Source audit:
- Project structure and modules:
- Authentication endpoints and guards:
- WebSocket/base gateway:
- Chat persistence, pagination, Redis limits:
- Geospatial search:
- Uploads and presigned URLs:
- Notification system:
- Validation, Swagger and global configuration:
- Jest and Docker configuration:
-->
