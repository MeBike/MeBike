# Staff Operations Flow

![Staff Diagram](../images/staff_flow.svg)

**Participants:**
- **Staff**: The staff user.
- **StaffDashboard**: `StaffDashboardScreen` component.
- **Scanner**: `QRScannerScreen` component.
- **Backend**: The API server.

```mermaid
sequenceDiagram
    participant Staff
    participant StaffDashboard
    participant QRScannerScreen
    participant StaffPhoneLookupScreen
    participant StaffRentalDetailScreen
    participant Backend

    %% QR Scan Flow
    Staff->>StaffDashboard: Tap "Scan QR"
    StaffDashboard->>QRScannerScreen: Open Camera
    Staff->>QRScannerScreen: Scan Rental QR
    QRScannerScreen->>StaffRentalDetailScreen: Navigate (rentalId)

    %% Phone Lookup Flow
    Staff->>StaffDashboard: Tap "Phone Lookup"
    StaffDashboard->>StaffPhoneLookupScreen: Navigate
    Staff->>StaffPhoneLookupScreen: Enter Phone Number
    StaffPhoneLookupScreen->>Backend: GET /rentals/by-phone/:number/active
    Backend-->>StaffPhoneLookupScreen: Return Active Rentals List
    Staff->>StaffPhoneLookupScreen: Select Rental
    StaffPhoneLookupScreen->>StaffRentalDetailScreen: Navigate (rentalId)

    %% Rental Management Flow
    StaffRentalDetailScreen->>Backend: GET /rentals/:id
    Backend-->>StaffRentalDetailScreen: Return Rental Details
    
    opt End Rental
        Staff->>StaffRentalDetailScreen: Tap "End Rental"
        StaffRentalDetailScreen->>Staff: Request Confirmation (Station, Reason)
        Staff->>StaffRentalDetailScreen: Confirm
        StaffRentalDetailScreen->>Backend: PUT /rentals/:id/end
        Backend-->>StaffRentalDetailScreen: Success
        StaffRentalDetailScreen->>Staff: Show Success Alert
        StaffRentalDetailScreen->>StaffRentalDetailScreen: Refresh Data
    end
```
