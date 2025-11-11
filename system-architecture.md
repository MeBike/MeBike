# MeBike System Architecture

## Overview

MeBike is a comprehensive bike-sharing platform built with a microservices architecture, featuring IoT-enabled smart bikes, web and mobile applications, and a robust backend system. The platform supports bike rentals, reservations, maintenance tracking, administrative operations, and SOS emergency response management.

## Technology Stack

### Backend Services
- **Main Backend**: Node.js with Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **IoT Service**: Node.js with Hono framework, TypeScript
- **Message Queue**: Redis with BullMQ
- **Authentication**: JWT tokens
- **Email Service**: Nodemailer

### Frontend Applications
- **Web Frontend**: Next.js 15, React 19, TypeScript
- **Mobile App**: React Native with Expo
- **UI Framework**: Tailwind CSS, Radix UI components
- **Maps**: TomTom Maps SDK
- **State Management**: TanStack Query (React Query)

### IoT Components
- **Device Firmware**: C++ on ESP32 with Arduino framework
- **Communication**: MQTT protocol
- **Hardware**: ESP32 microcontroller, PN532 NFC reader, LED indicators

### Development Tools
- **Build System**: Turborepo monorepo management
- **Package Manager**: pnpm
- **Linting**: ESLint with custom configurations
- **API Documentation**: OpenAPI/Swagger
- **Code Generation**: Orval for API client generation

## C4 Model Diagrams

### Context Diagram (Level 1)

```mermaid
graph TB
    subgraph "External Users"
        Customer[👤 Customer<br/>Bike Renter]
        Admin[👨‍💼 Admin<br/>System Manager]
        Staff[👷 Staff<br/>Maintenance Worker]
        SOSOperator[🚨 SOS Operator<br/>Emergency Response]
    end

    subgraph "MeBike System"
        WebApp[🌐 Web Application<br/>Next.js]
        MobileApp[📱 Mobile Application<br/>React Native]
        BackendAPI[⚙️ Backend API<br/>Node.js/Express]
        IoTService[🔧 IoT Service<br/>Node.js/Hono]
        Database[(💾 Database<br/>MongoDB)]
        IoTDevices[🚲 IoT Devices<br/>ESP32]
    end

    subgraph "External Systems"
        Payment[💳 Payment Gateway]
        Maps[🗺️ Maps Service<br/>TomTom]
        Email[📧 Email Service<br/>SMTP]
    end

    Customer --> WebApp
    Customer --> MobileApp
    Admin --> WebApp
    Staff --> WebApp
    SOSOperator --> WebApp

    WebApp --> BackendAPI
    MobileApp --> BackendAPI
    BackendAPI --> IoTService
    IoTService --> IoTDevices
    BackendAPI --> Database
    BackendAPI --> Payment
    WebApp --> Maps
    MobileApp --> Maps
    BackendAPI --> Email
```

### Container Diagram (Level 2)

```mermaid
graph TB
    subgraph "Client Applications"
        WebFrontend[🌐 Web Frontend<br/>Next.js + React<br/>Port: 3000<br/>Tech: TypeScript, Tailwind]
        MobileFrontend[📱 Mobile App<br/>React Native + Expo<br/>Tech: TypeScript, React Native]
    end

    subgraph "API Applications"
        BackendContainer[⚙️ Backend API<br/>Express.js Server<br/>Port: 4000<br/>Tech: Node.js, TypeScript<br/>Responsibilities:<br/>• User Management<br/>• Bike Management<br/>• Rental Processing<br/>• Payment Handling<br/>• SOS Management]
        IoTContainer[🔧 IoT Service<br/>Hono Server<br/>Port: 3000<br/>Tech: Node.js, TypeScript<br/>Responsibilities:<br/>• Device Commanding<br/>• State Management<br/>• MQTT Communication]
    end

    subgraph "Data Stores"
        MongoDB[(💾 MongoDB<br/>Primary Database<br/>Tech: MongoDB<br/>Stores: Users, Bikes,<br/>Rentals, Stations)]
        Redis[(🔄 Redis<br/>Cache & Queue<br/>Tech: Redis<br/>Stores: Sessions,<br/>Message Queue)]
    end

    subgraph "IoT Infrastructure"
        MQTTBroker[📡 MQTT Broker<br/>Tech: MQTT<br/>Protocol: MQTT<br/>Topics: esp/commands/*,<br/>esp/status/*]
        ESP32Devices[🚲 ESP32 Devices<br/>Tech: C++ Arduino<br/>Hardware: ESP32, NFC<br/>States: Available, Booked,<br/>Reserved, etc.]
    end

    subgraph "External Services"
        TomTom[🗺️ TomTom Maps<br/>Mapping Service<br/>Tech: TomTom SDK<br/>Features: Geolocation,<br/>Route Planning]
        EmailService[📧 Email Service<br/>SMTP Service<br/>Tech: Nodemailer<br/>Features: Notifications,<br/>OTP, Reports]
    end

    WebFrontend --> BackendContainer
    MobileFrontend --> BackendContainer
    BackendContainer --> IoTContainer
    IoTContainer --> MQTTBroker
    MQTTBroker --> ESP32Devices
    BackendContainer --> MongoDB
    BackendContainer --> Redis
    WebFrontend --> TomTom
    MobileFrontend --> TomTom
    BackendContainer --> EmailService
```

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Presentation Layer"
        Web[🌐 Web Frontend<br/>Next.js]
        Mobile[📱 Mobile App<br/>React Native]
    end

    subgraph "Application Layer"
        API[⚙️ Backend API<br/>Express.js]
        IoT[🔧 IoT Service<br/>Hono]
    end

    subgraph "Data Layer"
        DB[(💾 MongoDB)]
        Cache[(🔄 Redis)]
        Queue[(📨 BullMQ)]
    end

    subgraph "IoT Layer"
        Broker[📡 MQTT Broker]
        Devices[🚲 ESP32 Devices]
    end

    subgraph "External Services"
        Maps[🗺️ TomTom]
        Email[📧 SMTP]
    end

    Web --> API
    Mobile --> API
    API --> IoT
    IoT --> Broker
    Broker --> Devices
    API --> DB
    API --> Cache
    API --> Queue
    Web --> Maps
    Mobile --> Maps
    API --> Email
```

## Component Architecture

#### Backend Service Architecture

```mermaid
graph TB
    subgraph "Backend Service"
        Server[🚀 Express Server]
        Routes[🛣️ API Routes]
        Controllers[🎮 Controllers]
        Services[⚙️ Business Services]
        Models[📊 Data Models]
        Middleware[🔧 Middleware]
        Utils[🛠️ Utilities]
    end

    subgraph "External Dependencies"
        DB[(💾 MongoDB)]
        Cache[(🔄 Redis)]
        Queue[(📨 BullMQ)]
        Mail[📧 Email Service]
    end

    Server --> Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Models
    Services --> Utils
    Services --> DB
    Services --> Cache
    Services --> Queue
    Services --> Mail
    Middleware --> Server
```

#### IoT Service Architecture

```mermaid
graph TB
    subgraph "IoT Service"
        Hono[🚀 Hono Server]
        Routes[🛣️ HTTP Routes]
        DeviceMgr[🎮 Device Manager]
        MQTTClient[📡 MQTT Client]
        StateMachine[🔄 State Machine]
    end

    subgraph "Communication"
        MQTT[📡 MQTT Broker]
        ESP32[🚲 ESP32 Devices]
    end

    Hono --> Routes
    Routes --> DeviceMgr
    DeviceMgr --> MQTTClient
    MQTTClient --> MQTT
    MQTT --> ESP32
    DeviceMgr --> StateMachine
```

#### ESP32 Device Architecture

```mermaid
graph TB
    subgraph "ESP32 Device"
        Main[🚀 Main Loop]
        StateMachine[🔄 State Machine]
        NetworkMgr[🌐 Network Manager]
        MQTTClient[📡 MQTT Client]
        NFCMgr[📱 NFC Manager]
        LEDMgr[💡 LED Manager]
        Storage[💾 State Storage]
    end

    subgraph "Hardware"
        WiFi[📶 WiFi Module]
        MQTTBroker[📡 MQTT Broker]
        NFCReader[📱 NFC Reader]
        LEDs[💡 LED Indicators]
        Flash[💾 Flash Memory]
    end

    Main --> StateMachine
    StateMachine --> NetworkMgr
    NetworkMgr --> WiFi
    StateMachine --> MQTTClient
    MQTTClient --> MQTTBroker
    StateMachine --> NFCMgr
    NFCMgr --> NFCReader
    StateMachine --> LEDMgr
    LEDMgr --> LEDs
    StateMachine --> Storage
    Storage --> Flash
```

## Communication Protocols

### HTTP/REST APIs
- **Backend API**: RESTful API with Express.js
- **IoT Service API**: REST API with Hono framework
- **Authentication**: JWT Bearer tokens
- **API Documentation**: OpenAPI 3.1 specification

### MQTT Protocol
- **Broker**: MQTT broker for IoT device communication
- **Topics**:
  - `esp/commands/*`: Device command topics
  - `esp/status/*`: Device status topics
  - `esp/logs/*`: Device logging
  - `mebike/rentals/card-tap`: NFC card tap events

### WebSocket (Future Enhancement)
- Real-time updates for bike status
- Live tracking features

## Data Flow

### Bike Rental Flow

```mermaid
sequenceDiagram
    participant User
    participant Mobile/Web
    participant Backend
    participant IoTService
    participant MQTT
    participant ESP32

    User->>Mobile/Web: Request bike rental
    Mobile/Web->>Backend: POST /rentals
    Backend->>Backend: Validate user & bike
    Backend->>IoTService: POST /devices/{id}/commands/booking
    IoTService->>MQTT: Publish booking command
    MQTT->>ESP32: Receive booking command
    ESP32->>ESP32: Change state to BOOKED
    ESP32->>MQTT: Publish status update
    MQTT->>IoTService: Status update
    IoTService->>Backend: Status confirmation
    Backend->>Mobile/Web: Rental confirmed
    Mobile/Web->>User: Show rental active
```

### NFC Card Tap Flow

```mermaid
sequenceDiagram
    participant User
    participant ESP32
    participant MQTT
    participant IoTService
    participant Backend

    User->>ESP32: Tap NFC card
    ESP32->>ESP32: Read card UID
    ESP32->>MQTT: Publish card-tap event
    MQTT->>IoTService: Card tap message
    IoTService->>Backend: POST rental completion
    Backend->>Backend: Process payment & end rental
    Backend->>IoTService: Release bike command
    IoTService->>MQTT: Publish release command
    MQTT->>ESP32: Receive release command
    ESP32->>ESP32: Change state to AVAILABLE
```

## Device State Management

### ESP32 State Machine

The ESP32 devices implement a finite state machine with the following states:

```mermaid
stateDiagram-v2
    [*] --> INIT
    INIT --> CONNECTING_WIFI
    CONNECTING_WIFI --> CONNECTED
    CONNECTED --> AVAILABLE
    AVAILABLE --> RESERVED: Reserve command
    RESERVED --> BOOKED: Claim command
    RESERVED --> AVAILABLE: Cancel command
    AVAILABLE --> BOOKED: Book command
    BOOKED --> AVAILABLE: Release command
    AVAILABLE --> MAINTAINED: Maintenance start
    MAINTAINED --> AVAILABLE: Maintenance complete
    ANY --> BROKEN: Error condition
    BROKEN --> MAINTAINED: Maintenance start
    ANY --> UNAVAILABLE: System unavailable
    UNAVAILABLE --> AVAILABLE: System recovery
    ANY --> ERROR: Critical error
    ERROR --> [*]: Reset required
```

### State Transitions

| Current State | Command | Next State | Description |
|---------------|---------|------------|-------------|
| AVAILABLE | reserve | RESERVED | Bike held for user pickup |
| RESERVED | claim | BOOKED | User claims reserved bike |
| RESERVED | cancel | AVAILABLE | Reservation cancelled |
| AVAILABLE | book | BOOKED | Direct booking |
| BOOKED | release | AVAILABLE | Bike returned |
| AVAILABLE | start_maintenance | MAINTAINED | Begin maintenance |
| MAINTAINED | complete_maintenance | AVAILABLE | Maintenance finished |
| ANY | error | BROKEN | Hardware/software error |
| BROKEN | start_maintenance | MAINTAINED | Begin repair |

## Database Schema

### Core Entities

```mermaid
erDiagram
    User ||--o{ Rental : has
    User ||--o{ Reservation : makes
    User ||--o{ Report : submits
    User ||--o{ Wallet : owns
    User ||--o{ Withdrawal : requests
    User ||--o{ Rating : gives

    Station ||--o{ Bike : contains
    Station ||--o{ Report : receives

    Bike ||--o{ Rental : involved_in
    Bike ||--o{ Reservation : reserved_for
    Bike ||--o{ Report : reported_on

    Supplier ||--o{ Bike : supplies

    Rental {
        string id PK
        string userId FK
        string bikeId FK
        datetime startTime
        datetime endTime
        number cost
        string status
    }

    Reservation {
        string id PK
        string userId FK
        string bikeId FK
        datetime startTime
        datetime endTime
        string status
    }

    Bike {
        string id PK
        string stationId FK
        string supplierId FK
        string deviceId
        string status
        json location
        string qrCode
    }

    Station {
        string id PK
        string name
        json location
        number capacity
        json operatingHours
    }

    User {
        string id PK
        string email
        string phone
        string name
        string role
        datetime createdAt
    }

    Wallet {
        string id PK
        string userId FK
        number balance
        datetime updatedAt
    }
```

## Deployment Architecture

### Development Environment

```mermaid
graph TB
    subgraph "Development"
        DevBackend[Backend<br/>localhost:4000]
        DevFrontend[Frontend<br/>localhost:3000]
        DevMobile[Mobile<br/>Expo Dev Client]
        DevIoTService[IoT Service<br/>localhost:3000]
        DevMQTT[MQTT Broker<br/>localhost:1883]
        DevMongoDB[(MongoDB<br/>localhost:27017)]
        DevRedis[(Redis<br/>localhost:6379)]
    end

    DevFrontend --> DevBackend
    DevMobile --> DevBackend
    DevBackend --> DevIoTService
    DevIoTService --> DevMQTT
    DevBackend --> DevMongoDB
    DevBackend --> DevRedis
```

### Production Environment

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Load Balancer<br/>Nginx/Cloud]
    end

    subgraph "Application Servers"
        Backend1[Backend Instance 1]
        Backend2[Backend Instance 2]
        Frontend1[Frontend Instance 1]
        Frontend2[Frontend Instance 2]
    end

    subgraph "IoT Infrastructure"
        IoTService1[IoT Service 1]
        IoTService2[IoT Service 2]
        MQTTCluster[MQTT Cluster]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB<br/>Replica Set)]
        Redis[(Redis<br/>Cluster)]
    end

    subgraph "External Services"
        Email[Email Service]
        Maps[Maps Service]
        Monitoring[Monitoring<br/>Logs/Metrics]
    end

    LB --> Backend1
    LB --> Backend2
    LB --> Frontend1
    LB --> Frontend2

    Backend1 --> IoTService1
    Backend2 --> IoTService2
    IoTService1 --> MQTTCluster
    IoTService2 --> MQTTCluster

    Backend1 --> MongoDB
    Backend2 --> MongoDB
    Backend1 --> Redis
    Backend2 --> Redis

    Backend1 --> Email
    Backend2 --> Email
    Frontend1 --> Maps
    Frontend2 --> Maps

    Backend1 --> Monitoring
    Backend2 --> Monitoring
    IoTService1 --> Monitoring
    IoTService2 --> Monitoring
```

## Security Considerations

### Authentication & Authorization
- JWT-based authentication for API access
- Role-based access control (User, Admin, Staff, SOS)
- Secure password hashing with bcrypt
- Token expiration and refresh mechanisms

### API Security
- Input validation with express-validator
- CORS configuration
- Rate limiting (future implementation)
- API versioning

### IoT Security
- MQTT authentication with username/password
- Device MAC address validation
- Command validation and sanitization
- Secure firmware updates (future)

### Data Protection
- MongoDB authentication
- Redis authentication
- Environment variable management
- Sensitive data encryption

## Scalability Considerations

### Horizontal Scaling
- Stateless backend services
- Database read replicas
- Redis clustering
- Load balancer distribution

### Performance Optimization
- Database indexing
- Caching strategies (Redis)
- API response compression

### Monitoring & Observability
- Pino logging
- Error tracking
- Performance monitoring
- Health checks

## Future Enhancements

### Planned Features
- Real-time GPS tracking
- Advanced analytics dashboard
- Mobile payment integration
- Bike maintenance scheduling
- User loyalty program
- Multi-language support
- Enhanced SOS system with operator management
- Emergency response coordination

### Technical Improvements
- GraphQL API implementation
- Microservices decomposition
- Container orchestration (Kubernetes)
- CI/CD pipeline enhancement
- Automated testing expansion

---

*This document provides a comprehensive overview of the MeBike system architecture. For detailed API specifications, refer to the OpenAPI documentation at `/api-docs`. For IoT device protocols, see the MQTT topics documentation.*