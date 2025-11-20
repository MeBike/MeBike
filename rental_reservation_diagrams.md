# MeBike Rental/Reservation System Diagrams

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

    bikes {
        ObjectId _id PK
        string chip_id
        ObjectId station_id FK
        BikeStatus status
        ObjectId supplier_id FK
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

    users ||--o{ rentals : "1:N (has)"
    users ||--o{ reservations : "1:N (has)"
    users ||--o{ subscriptions : "1:N (has)"
    users ||--|| wallets : "1:1 (has)"
    stations ||--o{ bikes : "1:N (contains)"
    bikes ||--o{ rentals : "1:N (used in)"
    bikes ||--o{ reservations : "1:N (reserved for)"
    stations ||--o{ rentals : "1:N (start_station)"
    stations ||--o{ rentals : "1:N (end_station)"
    stations ||--o{ reservations : "1:N (station)"
    subscriptions ||--o{ rentals : "1:N (optional)"
    subscriptions ||--o{ reservations : "1:N (optional)"
```

## Class Diagram

```mermaid
classDiagram
    class User {
        +_id
        +fullname
        +email
        +password
        +role
        +phone_number
        +avatar
        +rentals
        +reservations
        +subscriptions
        +wallet
        +login()
        +register()
        +updateProfile()
        +changePassword()
        +getMyRentals()
        +getMyReservations()
    }

    class Bike {
        +_id
        +chip_id
        +station_id
        +status
        +supplier_id
        +rentals
        +reservations
        +updateStatus()
        +assignToStation()
        +removeFromStation()
        +reportBroken()
        +getRentalHistory()
    }

    class Station {
        +_id
        +name
        +address
        +latitude
        +longitude
        +capacity
        +bikes
        +addBike()
        +removeBike()
        +getAvailableBikes()
        +getNearbyStations()
        +updateCapacity()
    }

    class Rental {
        +_id
        +user_id
        +bike_id
        +start_station
        +end_station
        +start_time
        +end_time
        +duration
        +total_price
        +subscription_id
        +status
        +createRental()
        +endRental()
        +calculatePrice()
        +updateStatus()
        +cancelRental()
        +getDetail()
    }

    class Reservation {
        +_id
        +user_id
        +bike_id
        +station_id
        +start_time
        +end_time
        +prepaid
        +status
        +reservation_option
        +subscription_id
        +createReservation()
        +confirmReservation()
        +cancelReservation()
        +expireReservation()
        +getReservationHistory()
        +notifyExpiring()
    }

    class Subscription {
        +_id
        +user_id
        +package_name
        +activated_at
        +expires_at
        +max_usages
        +usage_count
        +price
        +status
        +activate()
        +renew()
        +cancel()
        +checkUsageLimit()
        +getRemainingUsage()
    }

    class Wallet {
        +_id
        +user_id
        +balance
        +status
        +addBalance()
        +deductBalance()
        +checkBalance()
        +getTransactionHistory()
        +freezeWallet()
        +unfreezeWallet()
    }

    User "1" --* "*" Rental : has
    User "1" --* "*" Reservation : has
    User "1" --* "*" Subscription : has
    User "1" -- "1" Wallet : has
    Station "1" --* "*" Bike : contains
    Bike "1" --* "*" Rental : used in
    Bike "1" --* "*" Reservation : reserved for
    Rental --> Station : start_station
    Rental --> Station : end_station
    Reservation --> Station : station
    Rental ..> Subscription : optional
    Reservation ..> Subscription : optional
```

## Sequence Diagram - Reservation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant MA as Mobile App
    participant API as Backend API
    participant RS as ReservationService
    participant DB as Database

    U->>MA: Select bike & time
    MA->>API: POST /reservations (createReservation)
    API->>RS: reserveOneTime/reserveWithSubscription
    RS->>DB: Save reservation (status: Pending)
    DB-->>RS: Reservation created
    RS-->>API: Success response
    API-->>MA: Reservation created
    MA-->>U: Show pending reservation

    U->>MA: Confirm reservation
    MA->>API: POST /reservations/:id/confirm
    API->>RS: confirmReservation
    RS->>DB: Update reservation (status: Active)
    RS->>DB: Create rental (status: Rented)
    RS->>DB: Update bike status
    DB-->>RS: Success
    RS-->>API: Success
    API-->>MA: Reservation confirmed, rental started
    MA-->>U: Rental active

    alt User cancels
        U->>MA: Cancel reservation
        MA->>API: POST /reservations/:id/cancel
        API->>RS: cancelReservation
        RS->>DB: Update status to Cancelled
        DB-->>RS: Success
        RS-->>API: Success
        API-->>MA: Cancelled
        MA-->>U: Reservation cancelled
    end

    alt Expires
        API->>RS: expireReservations (scheduled)
        RS->>DB: Update expired reservations
        DB-->>RS: Success
    end
```

## Sequence Diagram - Rental Flow

```mermaid
sequenceDiagram
    participant U as User
    participant MA as Mobile App
    participant API as Backend API
    participant RTS as RentalService
    participant DB as Database

    U->>MA: Select bike for rental
    MA->>API: POST /rentals (postRent)
    API->>RTS: createRentalSession
    RTS->>DB: Create rental (status: Rented)
    RTS->>DB: Update bike status to Booked
    RTS->>DB: Deduct wallet balance
    DB-->>RTS: Success
    RTS-->>API: Rental created
    API-->>MA: Rental started
    MA-->>U: Bike unlocked, rental active

    U->>MA: End rental (scan QR/return bike)
    MA->>API: PUT /rentals/:id/end (endCurrentRental)
    API->>RTS: endRentalSession
    RTS->>DB: Update rental (status: Completed, end_time, total_price)
    RTS->>DB: Update bike status to Available
    RTS->>DB: Update wallet balance
    DB-->>RTS: Success
    RTS-->>API: Rental completed
    API-->>MA: Rental ended, show cost
    MA-->>U: Rental completed

    alt Insufficient balance
        RTS-->>API: Error: insufficient funds
        API-->>MA: Payment failed
        MA-->>U: Top up wallet
    end

    alt Staff ends rental
        API->>RTS: endRentalByAdminOrStaff
        RTS->>DB: Update rental details
    end
```

## State Diagram - Reservation Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending : Create reservation
    Pending --> Active : User confirms
    Pending --> Cancelled : User cancels
    Pending --> Expired : Time expires
    Active --> [*] : Rental completed
    Cancelled --> [*]
    Expired --> [*]
```

## State Diagram - Rental Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Rented : Create rental
    Rented --> Completed : End rental successfully
    Rented --> Cancelled : Cancel rental
    Completed --> [*]
    Cancelled --> [*]
```

## Activity Diagram - Overall Rental/Reservation Process

```mermaid
flowchart TD
    A[User wants to use bike] --> B{Choose option}
    B --> C[Reserve bike]
    B --> D[Rent directly]

    C --> C1[Select bike & time]
    C1 --> C2[Create reservation]
    C2 --> C3{Reservation status}
    C3 -->|Pending| C4{User action}
    C4 -->|Confirm| C5[Confirm reservation]
    C5 --> C6[Create rental]
    C6 --> E[Use bike]
    C4 -->|Cancel| C7[Cancel reservation]
    C7 --> F[End]
    C3 -->|Expired| C8[Reservation expired]
    C8 --> F

    D --> D1[Select bike]
    D1 --> D2[Create rental]
    D2 --> E

    E --> G{End rental}
    G -->|Success| H[Rental completed]
    H --> I[Calculate cost]
    I --> J[Update wallet]
    J --> K[Update bike status]
    K --> F

    G -->|Fail| L{Reason}
    L -->|Balance| M[Insufficient funds]
    M --> N[Top up wallet]
    N --> G
    L -->|Other| O[Handle error]
    O --> F
```

## Activity Diagram - Rental Process (Swimlane)

```mermaid
flowchart TD
    subgraph "User"
        A1[Open mobile app]
        A2[Select bike at station]
        A3[Tap NFC card or use mobile activation]
        A4[Confirm rental start]
        A5[Use bike for trip]
        A6[Return bike to station]
        A7[Use mobile app to end rental]
        A8[Confirm rental end]
        A9[Rate and review rental]
    end

    subgraph "Mobile App"
        B1[Display available bikes]
        B2[Validate user authentication]
        B3[Send rental request to API]
        B4[Show rental confirmation]
        B5[Track trip in real-time]
        B6[Send NFC unlock command]
        B7[Send end rental request]
        B8[Display rental summary]
        B9[Show rating form]
        B10[Submit rating]
    end

    subgraph "Backend API"
        C1[Validate rental request]
        C2[Check user balance]
        C3[Check bike availability]
        C4[Create rental record]
        C5[Update bike status]
        C6[Deduct wallet balance]
        C7[Send unlock command to IoT]
        C8[Validate end rental request]
        C9[Calculate final price]
        C10[Update rental record]
        C11[Credit remaining balance]
        C12[Process rating submission]
    end

    subgraph "Database"
        D1[Query bike availability]
        D2[Insert rental record]
        D3[Update bike status to RENTED]
        D4[Update user wallet balance]
        D5[Update rental with end data]
        D6[Insert rating record]
    end

    subgraph "IoT System"
        E1[Receive unlock command]
        E2[Validate bike chip ID]
        E3[Unlock bike]
        E4[Monitor bike status]
        E5[Send status updates]
    end

    A1 --> B1
    B1 --> B2
    B2 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> D1
    D1 --> C4
    C4 --> D2
    D2 --> C5
    C5 --> D3
    D3 --> C6
    C6 --> D4
    D4 --> C7
    C7 --> E1
    E1 --> E2
    E2 --> E3
    E3 --> B4
    B4 --> A4
    A4 --> A5
    A5 --> B5
    B5 --> E4
    E4 --> E5
    A6 --> A7
    A7 --> B6
    B6 --> C8
    C8 --> C9
    C9 --> C10
    C10 --> D5
    D5 --> C11
    C11 --> D4
    D4 --> B7
    B7 --> A8
    A8 --> A9
    A9 --> B9
    B9 --> B10
    B10 --> C12
    C12 --> D6
```

## Activity Diagram - Reservation Process (Swimlane)

```mermaid
flowchart TD
    subgraph "User"
        A1[Open mobile app]
        A2[Select bike for reservation]
        A3[Choose reservation time]
        A4[Select reservation type]
        A5[Confirm reservation]
        A6[Receive confirmation]
        A7[Arrive at station on time]
        A8[Tap NFC card or use mobile to activate]
        A9[Use reserved bike]
        A10[Return bike]
        A11[End rental via mobile app]
    end

    subgraph "Mobile App"
        B1[Display available bikes]
        B2[Show reservation options]
        B3[Validate reservation time]
        B4[Send reservation request]
        B5[Show reservation pending]
        B6[Update to confirmed status]
        B7[Show reservation details]
        B8[Send NFC unlock command]
        B9[Track rental progress]
        B10[Send rental end request]
    end

    subgraph "Backend API"
        C1[Validate reservation request]
        C2[Check bike availability]
        C3[Check user balance]
        C4[Create reservation record]
        C5[Update bike status to RESERVED]
        C6[Deduct prepaid amount]
        C7[Send confirmation to user]
        C8[Monitor reservation time]
        C9[Validate rental start request]
        C10[Convert reservation to rental]
        C11[Update bike status to RENTED]
        C12[Process rental end]
        C13[Calculate final charges]
        C14[Update wallet balance]
    end

    subgraph "Database"
        D1[Check bike availability]
        D2[Insert reservation record]
        D3[Update bike status]
        D4[Update wallet balance]
        D5[Query reservation details]
        D6[Update reservation to ACTIVE]
        D7[Convert to rental record]
        D8[Update rental end data]
    end

    subgraph "Notification System"
        E1[Send reservation confirmation]
        E2[Send reminder before expiry]
        E3[Send expiry warning]
        E4[Send cancellation notice]
    end

    A1 --> B1
    B1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> B2
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
    C7 --> E1
    E1 --> B5
    B5 --> A6
    A6 --> C8
    C8 --> E2
    A7 --> A8
    A8 --> B8
    B8 --> C9
    C9 --> D5
    D5 --> C10
    C10 --> D6
    D6 --> C11
    C11 --> D7
    D7 --> B9
    B9 --> A9
    A9 --> A10
    A10 --> A11
    A11 --> B10
    B10 --> C12
    C12 --> C13
    C13 --> C14
    C14 --> D8
    D8 --> D4

    C8 --> E3
    E3 -.->|If expired| C4