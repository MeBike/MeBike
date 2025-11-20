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

    users ||--o{ rentals : "1 user has many rentals"
    users ||--o{ reservations : "1 user has many reservations"
    users ||--o{ subscriptions : "1 user has many subscriptions"
    users ||--|| wallets : "1 user has 1 wallet"
    stations ||--o{ bikes : "1 station has many bikes"
    bikes ||--o{ rentals : "1 bike used in many rentals"
    bikes ||--o{ reservations : "1 bike reserved in many reservations"
    stations ||--o{ rentals : "start_station"
    stations ||--o{ rentals : "end_station"
    stations ||--o{ reservations : "station"
    subscriptions ||--o{ rentals : "optional subscription"
    subscriptions ||--o{ reservations : "optional subscription"
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