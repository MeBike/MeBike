# MeBike Fixed-Slot System Diagrams

## Physical Database Diagram (ER Diagram)

```mermaid
erDiagram
    users {
        ObjectId _id PK
        string fullname
        string email
        string password
        string email_verify_otp
        Date email_verify_otp_expires
        string forgot_password_otp
        Date forgot_password_otp_expires
        UserVerifyStatus verify
        string location
        string username
        string phone_number
        string avatar
        Role role
        string nfc_card_uid
        Date created_at
        Date updated_at
    }

    fixed_slot_templates {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId station_id FK
        string slot_start
        string[] selected_dates
        FixedSlotStatus status
        Date created_at
        Date updated_at
    }

    stations {
        ObjectId _id PK
        string name
        string address
        string latitude
        string longitude
        string capacity
        Date created_at
        Date updated_at
        location_geo Point
    }

    reservations {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId bike_id FK
        ObjectId station_id FK
        Date start_time
        Date end_time
        Decimal128 prepaid
        ReservationStatus status
        ReservationOptions reservation_option
        ObjectId fixed_slot_template_id FK
        ObjectId subscription_id FK
        Date created_at
        Date updated_at
    }

    rentals {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId bike_id FK
        ObjectId start_station FK
        ObjectId end_station FK
        Date start_time
        Date end_time
        Int32 duration
        Decimal128 total_price
        ObjectId subscription_id FK
        RentalStatus status
        Date created_at
        Date updated_at
    }

    subscriptions {
        ObjectId _id PK
        ObjectId user_id FK
        SubscriptionPackage package_name
        Date activated_at
        Date expires_at
        number max_usages
        number usage_count
        Decimal128 price
        SubscriptionStatus status
        Date created_at
        Date updated_at
    }

    wallets {
        ObjectId _id PK
        ObjectId user_id FK
        Decimal128 balance
        WalletStatus status
        Date created_at
        Date updated_at
    }

    users ||--o{ fixed_slot_templates : "1:N (creates)"
    users ||--o{ reservations : "1:N (has)"
    users ||--o{ rentals : "1:N (has)"
    users ||--o{ subscriptions : "1:N (has)"
    users ||--|| wallets : "1:1 (has)"
    stations ||--o{ fixed_slot_templates : "1:N (location)"
    fixed_slot_templates ||--o{ reservations : "1:N (generates)"
    fixed_slot_templates ||--o{ rentals : "1:N (generates)"
    stations ||--o{ reservations : "1:N (station)"
    stations ||--o{ rentals : "1:N (start_station)"
    subscriptions ||--o{ reservations : "1:N (optional)"
    subscriptions ||--o{ rentals : "1:N (optional)"
```

## Class Diagram (Crow's Foot Notation)

```mermaid
erDiagram
    User {
        ObjectId _id PK
        string fullname
        string email
        string password
        Role role
        string phone_number
        string avatar
        Date created_at
        Date updated_at
    }

    FixedSlotTemplate {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId station_id FK
        string slot_start
        string[] selected_dates
        FixedSlotStatus status
        Date created_at
        Date updated_at
    }

    Bike {
        ObjectId _id PK
        string chip_id
        ObjectId station_id FK
        BikeStatus status
        ObjectId supplier_id FK
        Date created_at
        Date updated_at
    }

    Station {
        ObjectId _id PK
        string name
        string address
        string latitude
        string longitude
        string capacity
        Date created_at
        Date updated_at
    }

    Rental {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId bike_id FK
        ObjectId start_station FK
        ObjectId end_station FK
        Date start_time
        Date end_time
        Int32 duration
        Decimal128 total_price
        RentalStatus status
        Date created_at
        Date updated_at
    }

    Reservation {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId bike_id FK
        ObjectId station_id FK
        Date start_time
        Date end_time
        Decimal128 prepaid
        ReservationStatus status
        ReservationOptions reservation_option
        ObjectId fixed_slot_template_id FK
        Date created_at
        Date updated_at
    }

    Subscription {
        ObjectId _id PK
        ObjectId user_id FK
        SubscriptionPackage package_name
        Date activated_at
        Date expires_at
        number max_usages
        number usage_count
        Decimal128 price
        SubscriptionStatus status
        Date created_at
        Date updated_at
    }

    Wallet {
        ObjectId _id PK
        ObjectId user_id FK
        Decimal128 balance
        WalletStatus status
        Date created_at
        Date updated_at
    }

    User ||--o{ FixedSlotTemplate : "creates (1:N)"
    User ||--o{ Reservation : "has (1:N)"
    User ||--o{ Rental : "has (1:N)"
    User ||--o{ Subscription : "has (1:N)"
    User ||--|| Wallet : "has (1:1)"
    Station ||--o{ FixedSlotTemplate : "location (1:N)"
    FixedSlotTemplate ||--o{ Reservation : "generates (1:N)"
    FixedSlotTemplate ||--o{ Rental : "generates (1:N)"
    Station ||--o{ Bike : "contains (1:N)"
    Station ||--o{ Reservation : "station (1:N)"
    Station ||--o{ Rental : "start_station (1:N)"
    Bike ||--o{ Rental : "used in (1:N)"
    Bike ||--o{ Reservation : "reserved for (1:N)"
    Subscription ||--o{ Reservation : "optional (1:N)"
    Subscription ||--o{ Rental : "optional (1:N)"
```

## Class Operations

**User Operations:**
- login(), register(), updateProfile(), changePassword()
- getMyFixedSlotTemplates(), getMyReservations(), getMyRentals()

**FixedSlotTemplate Operations:**
- createTemplate(), updateTemplate(), cancelTemplate()
- generateReservations(), generateRentals(), getDetail()

**Station Operations:**
- addBike(), removeBike(), getAvailableBikes()
- getNearbyStations(), updateCapacity()

**Reservation Operations:**
- createReservation(), confirmReservation(), cancelReservation()
- expireReservation(), getReservationHistory(), notifyExpiring()

**Rental Operations:**
- createRental(), endRental(), calculatePrice()
- updateStatus(), cancelRental(), getDetail()

**Subscription Operations:**
- activate(), renew(), cancel()
- checkUsageLimit(), getRemainingUsage()

**Wallet Operations:**
- addBalance(), deductBalance(), checkBalance()
- getTransactionHistory(), freezeWallet(), unfreezeWallet()

## Sequence Diagram - Fixed-Slot Template Creation

```mermaid
sequenceDiagram
    participant U as User
    participant MA as Mobile App
    participant API as Backend API
    participant FSS as FixedSlotService
    participant DB as Database

    U->>MA: Select station, time slot & dates
    MA->>API: POST /fixed-slots (createFixedSlotTemplate)
    API->>FSS: create()
    FSS->>DB: Check user subscription
    DB-->>FSS: Subscription details
    FSS->>FSS: Generate reservations & rentals for each date
    FSS->>DB: Insert fixed_slot_template
    DB-->>FSS: Template created
    FSS->>DB: Insert reservations
    FSS->>DB: Insert rentals
    FSS->>DB: Update subscription usage (if applicable)
    FSS->>DB: Deduct wallet balance (if prepaid)
    DB-->>FSS: Success
    FSS-->>API: Template created with reservations
    API-->>MA: Success response
    MA-->>U: Fixed-slot template created
```

## Sequence Diagram - Fixed-Slot Template Update

```mermaid
sequenceDiagram
    participant U as User
    participant MA as Mobile App
    participant API as Backend API
    participant FSS as FixedSlotService
    participant DB as Database

    U->>MA: Modify dates or time slot
    MA->>API: PUT /fixed-slots/:id (updateFixedSlotTemplate)
    API->>FSS: update()
    FSS->>DB: Get existing template
    DB-->>FSS: Current template data
    FSS->>FSS: Calculate date changes (add/remove/update)
    FSS->>DB: Add new reservations/rentals for added dates
    FSS->>DB: Update time slots for modified dates
    FSS->>DB: Cancel reservations/rentals for removed dates
    FSS->>DB: Update wallet balance
    FSS->>DB: Update template
    DB-->>FSS: Success
    FSS-->>API: Template updated
    API-->>MA: Success response
    MA-->>U: Template updated
```

## State Diagram - Fixed-Slot Template Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active : Create template
    Active --> Active : Update template
    Active --> Cancelled : User cancels template
    Active --> [*] : All dates completed
    Cancelled --> [*]
```

## Activity Diagram - Fixed-Slot Creation Process (Swimlane)

```mermaid
flowchart TD
    subgraph "User"
        A1[Open mobile app]
        A2[Select station]
        A3[Choose time slot]
        A4[Select recurring dates]
        A5[Confirm template creation]
        A6[Receive confirmation]
    end

    subgraph "Mobile App"
        B1[Display station selection]
        B2[Show time slot picker]
        B3[Display calendar for date selection]
        B4[Validate selections]
        B5[Send creation request]
        B6[Show success message]
    end

    subgraph "Backend API"
        C1[Validate request data]
        C2[Check user authentication]
        C3[Verify station availability]
        C4[Check subscription status]
        C5[Calculate total cost]
        C6[Verify wallet balance]
        C7[Create template record]
        C8[Generate reservations for each date]
        C9[Generate rentals for each date]
        C10[Update subscription usage]
        C11[Deduct wallet balance]
        C12[Send confirmation]
    end

    subgraph "Database"
        D1[Check subscription details]
        D2[Insert template record]
        D3[Bulk insert reservations]
        D4[Bulk insert rentals]
        D5[Update subscription usage count]
        D6[Update wallet balance]
    end

    A1 --> B1
    B1 --> A2
    A2 --> A3
    A3 --> B2
    B2 --> A4
    A4 --> B3
    B3 --> B4
    B4 --> B5
    B5 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> D1
    D1 --> C5
    C5 --> C6
    C6 --> C7
    C7 --> D2
    D2 --> C8
    C8 --> D3
    D3 --> C9
    D3 --> D4
    D4 --> C10
    C10 --> D5
    D5 --> C11
    C11 --> D6
    D6 --> C12
    C12 --> B6
    B6 --> A6
    A6 --> A5
```

## Activity Diagram - Fixed-Slot Update Process (Swimlane)

```mermaid
flowchart TD
    subgraph "User"
        A1[View existing template]
        A2[Modify dates or time]
        A3[Confirm changes]
        A4[Receive update confirmation]
    end

    subgraph "Mobile App"
        B1[Display template details]
        B2[Show edit interface]
        B3[Validate changes]
        B4[Send update request]
        B5[Show update result]
    end

    subgraph "Backend API"
        C1[Validate update request]
        C2[Get current template]
        C3[Analyze date changes]
        C4[Process added dates]
        C5[Process removed dates]
        C6[Process time changes]
        C7[Update wallet balance]
        C8[Update template record]
        C9[Send update confirmation]
    end

    subgraph "Database"
        D1[Retrieve template data]
        D2[Insert new reservations/rentals]
        D3[Cancel old reservations/rentals]
        D4[Update existing records]
        D5[Update wallet transactions]
        D6[Update template]
    end

    A1 --> B1
    B1 --> A2
    A2 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> C1
    C1 --> C2
    C2 --> D1
    D1 --> C3
    C3 --> C4
    C4 --> D2
    D2 --> C5
    C5 --> D3
    D3 --> C6
    C6 --> D4
    D4 --> C7
    C7 --> D5
    D5 --> C8
    C8 --> D6
    D6 --> C9
    C9 --> B5
    B5 --> A4
    A4 --> A3