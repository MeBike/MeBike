# MeBike Rental/Reservation System Diagrams

## Class Diagram

```mermaid
classDiagram
    class User {
        +_id
        +name
        +email
        +role
        +rentals
        +reservations
        +subscriptions
    }

    class Bike {
        +_id
        +station_id
        +status
        +chip_id
        +rentals
        +reservations
    }

    class Station {
        +_id
        +name
        +address
        +bikes
    }

    class Rental {
        +_id
        +user_id
        +bike_id
        +start_station
        +end_station
        +status
        +start_time
        +end_time
        +total_price
        +subscription_id
    }

    class Reservation {
        +_id
        +user_id
        +bike_id
        +station_id
        +status
        +start_time
        +end_time
        +prepaid
        +subscription_id
    }

    class Subscription {
        +_id
        +user_id
        +status
        +package
    }

    class Wallet {
        +_id
        +user_id
        +balance
        +status
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