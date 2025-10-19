### **MeBike Project - Progress Report**

**Overall Summary:**

The project is a complex, multi-faceted system with a monorepo architecture, including a backend, frontend, mobile app, and IoT components. The backend is the most mature part of the project, with many core features already implemented, especially for the **Bikes**, **Users**, and **Rentals** modules. The frontend has a solid structure with pages and components for many features, but some parts still rely on mock data, indicating that backend integration is ongoing. The IoT and IoT-Service components seem to be in the early to mid-stages of development, with foundational code in place for communication and state management.

---

### **1. Users Module**

| Role | Feature | Status | Backend Implementation | Frontend Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **USER** | Login (Email/Password) | ✅ **Completed** | `users.controllers.ts` -> `loginController` | `app/(auth)/auth/login/page.tsx` |
| **USER** | Login (Google OAuth) | ❌ **Not Started** | No OAuth routes or strategies found. | No UI for Google login. |
| **USER** | Register Account | ✅ **Completed** | `users.controllers.ts` -> `registerController` | `app/(auth)/auth/register/page.tsx` |
| **USER** | Logout | ✅ **Completed** | `users.controllers.ts` -> `logoutController` | Implemented in dashboard layouts. |
| **USER** | Forgot/Reset Password | ✅ **Completed** | `users.controllers.ts` -> `forgotPasswordController`, `resetPasswordController` | `app/(auth)/auth/forgot-password/page.tsx`, `reset-password/page.tsx` |
| **USER** | Change Password | ✅ **Completed** | `users.controllers.ts` -> `changePasswordController` | `app/.../profile/change-password/page.tsx` for all roles. |
| **USER** | View/Update Profile | ✅ **Completed** | `users.controllers.ts` -> `getMeController`, `updateMeController` | `app/.../profile/page.tsx` for all roles. |
| **USER** | Verify Phone (OTP) | ❌ **Not Started** | No OTP generation or verification logic found for phone numbers. | Registration form has an optional phone field. |
| **ADMIN** | Manage User List | ❌ **Not Started** | No admin-specific user management routes found. | No admin UI for user list. |
| **ADMIN** | View User Details | ❌ **Not Started** | No admin-specific user detail routes found. | No admin UI for user details. |
| **ADMIN** | Ban/Unban User | ❌ **Not Started** | No routes for updating user status by admin. | No admin UI for this action. |
| **ADMIN** | User Statistics | ❌ **Not Started** | No user reporting or statistics endpoints found. | No admin UI for user stats. |
| **STAFF** | User Information Lookup | ❌ **Not Started** | No staff-specific user lookup routes found. | No staff UI for this action. |

**Users Module Summary:** Core user authentication and profile management are complete. However, all administrative and staff-level user management features are not yet started. Phone number verification via OTP is a missing feature.

---

### **2. Stations Module**

| Role | Feature | Status | Backend Implementation | Frontend Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **USER** | List/View Stations | 🟡 **Partially Implemented** | No dedicated station endpoints (CRUD) found. | `app/station/page.tsx` exists but uses mock data. |
| **USER** | Find Nearest Station | ❌ **Not Started** | No geolocation-based search logic found. | No UI for this feature. |
| **USER** | Map & Directions | ❌ **Not Started** | No map-related endpoints. | UI has a placeholder for a map. |
| **ADMIN** | Manage Stations (CRUD) | ❌ **Not Started** | No endpoints for creating, updating, or deleting stations. | No admin UI for station management. |
| **ADMIN** | Monitor Station Status | 🟡 **Partially Implemented** | `rentals.controllers.ts` -> `getStationActivityController` provides some stats. | No dedicated real-time monitoring UI. |
| **ADMIN** | Bike Coordination | ❌ **Not Started** | No logic for bike coordination alerts or actions. | No UI for this feature. |
| **STAFF** | Manual Return at Station | ✅ **Completed** | `rentals.controllers.ts` -> `endRentalByAdminOrStaffController` | No specific UI, but backend logic exists. |
| **STAFF** | Move Bikes Between Stations | ✅ **Completed** | `bikes.controllers.ts` -> `adminUpdateBikeController` allows changing `station_id`. | No specific UI, but backend logic exists. |

**Stations Module Summary:** This module is in its early stages. While the frontend has a basic UI for viewing stations, the backend lacks the necessary APIs for managing and retrieving station data. Some related features are implemented within other modules (like `Rentals` and `Bikes`).

---

### **3. Bikes Module**

| Role | Feature | Status | Backend Implementation | Frontend Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **USER** | View Bike Info at Station | ✅ **Completed** | `bikes.controllers.ts` -> `getBikesController` filters by station. | `app/staff/bikes/page.tsx` shows a bike list (can be adapted for users). |
| **USER** | Rent Bike (QR Scan) | ✅ **Completed** | Logic is in `rentals.controllers.ts`. | Frontend would handle QR scan and call the API. |
| **USER** | Report Broken Bike | ✅ **Completed** | `bikes.controllers.ts` -> `reportBrokenBikeController`. | No specific UI found, but backend is ready. |
| **USER** | Rate Bike | ❌ **Not Started** | No rating-related routes or database schemas found. | No UI for rating. |
| **ADMIN** | Manage Bikes (CRUD) | ✅ **Completed** | `bikes.controllers.ts` has `create`, `adminUpdate`, and `delete` controllers. | `app/staff/bikes/page.tsx` provides a management interface. |
| **ADMIN** | Track Bike Activity/Stats | ✅ **Completed** | `getRentalsByBikeIdController` and `getBikeStatsByIdController` exist. | No specific UI for individual bike stats. |
| **STAFF** | Manual Return | ✅ **Completed** | Part of the `rentals` module. | No specific UI, but backend logic exists. |
| **STAFF** | Check & Maintain Bike | ✅ **Completed** | `adminUpdateBikeController` allows status changes. | The bike list UI can be used for this. |

**Bikes Module Summary:** This is one of the most complete modules. The backend supports almost all specified features for users, admins, and staff. The main missing piece is the ability for users to rate bikes.

---

### **4. Rentals & Reservations Module**

| Role | Feature | Status | Backend Implementation | Frontend Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **USER** | Create/End Rental | ✅ **Completed** | `rentals.controllers.ts` -> `createRentalSessionController`, `endRentalSessionController`. | No specific UI found, but hooks exist (`useCreateBikeMutation`). |
| **USER** | View Rental History | ✅ **Completed** | `rentals.controllers.ts` -> `getMyRentalsController`. | `app/user/booking-history/page.tsx` is a placeholder. |
| **USER** | Reserve Bike | 🟡 **Partially Implemented** | `rentals.controllers.ts` has a `getReservationsStatisticController`. `reservation.schema.ts` exists. Full CRUD logic is unclear. | No UI for creating reservations. |
| **ADMIN** | Manage All Rentals | ✅ **Completed** | `rentals.controllers.ts` -> `getAllRentalsController`, `updateDetailRentalController`. | `app/staff/rentals/page.tsx` provides a management interface. |
| **ADMIN** | Rental Statistics | ✅ **Completed** | `getRentalRevenueController`, `getStationActivityController`, `getReservationsStatisticController`. | No dedicated stats dashboard found. |
| **STAFF** | Manual End Rental | ✅ **Completed** | `rentals.controllers.ts` -> `endRentalByAdminOrStaffController`. | No specific UI, but backend logic exists. |

**Rentals & Reservations Module Summary:** The core rental process (create, end, view history) is well-implemented on the backend. Reservation functionality is partially in place but needs full CRUD implementation. The frontend has a management table for staff but needs pages for users to view their history and create reservations.

---

### **5. Payments, Wallets & Refunds Module**

| Role | Feature | Status | Backend Implementation | Frontend Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **USER** | Pay for Rental | 🟡 **Partially Implemented** | `payment.schemas.ts` exists, but no controller to create payments. Assumes wallet is used. | No payment UI found. |
| **USER** | Manage Wallet | ✅ **Completed** | `wallet.controllers.ts` handles balance, history, and withdrawal requests. | No UI for wallet management. |
| **USER** | View Payment History | ✅ **Completed** | `wallet.controllers.ts` -> `getUserTransactionWalletController`. | No UI for payment history. |
| **USER** | Request Refund | ✅ **Completed** | `wallet.controllers.ts` -> `refundController`. | No UI for requesting refunds. |
| **ADMIN** | Manage Transactions | ✅ **Completed** | `wallet.controllers.ts` allows balance adjustments. | No admin UI for transaction management. |
| **ADMIN** | Process Refunds | ✅ **Completed** | `wallet.controllers.ts` -> `updateRefundController`. | No admin UI for processing refunds. |
| **ADMIN** | Process Withdrawals | ✅ **Completed** | `wallet.controllers.ts` -> `updateWithdrawStatusController`. | No admin UI for processing withdrawals. |

**Payments Module Summary:** The backend has strong support for a user wallet system, including deposits, withdrawals, and refunds. However, the direct payment processing for a rental session (e.g., via VNPay, Momo) is not explicitly implemented. The frontend is missing UIs for all payment-related features.

---

### **6. Reports & Ratings Module**

| Role | Feature | Status | Backend Implementation | Frontend Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **USER** | Report Broken Bike/Station | ✅ **Completed** | `reports.controllers.ts` -> `createReportController`. | No UI for creating reports. |
| **USER** | Send SOS | ✅ **Completed** | `createReportController` handles SOS types with location data. | No UI for sending SOS. |
| **USER** | View Report Status | ✅ **Completed** | `reports.controllers.ts` -> `getAllUserReportController`. | No UI for viewing report status. |
| **USER** | Rate Bike/Service | ❌ **Not Started** | No rating routes, controllers, or database schemas found. | No UI for ratings. |
| **ADMIN** | Manage All Reports | ✅ **Completed** | `reports.controllers.ts` -> `getAllReportController`, `updateReportStatusController`. | No admin UI for report management. |
| **ADMIN** | Manage Ratings | ❌ **Not Started** | No rating management features found. | No admin UI for ratings. |

**Reports & Ratings Module Summary:** The reporting system is well-implemented on the backend, covering various report types including SOS. The entire rating system, however, is not yet started. The frontend lacks UI for both reporting and rating features.

---

### **7. Suppliers Module**

| Role | Feature | Status | Backend Implementation | Frontend Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Manage Suppliers (CRUD) | ✅ **Completed** | `suppliers.controllers.ts` has full CRUD functionality. | No admin UI for supplier management. |
| **ADMIN** | Manage Contracts | 🟡 **Partially Implemented** | Supplier schema includes `contract_fee`, but no full contract management. | No UI for contract management. |
| **ADMIN** | Track Bikes by Supplier | ✅ **Completed** | `supplier.services.ts` has `getAllSupplierBikeStats`. | No UI for these stats. |
| **ADMIN** | Link Bike to Supplier | ✅ **Completed** | `bikes.controllers.ts` handles `supplier_id` on create/update. | No UI for this action. |

**Suppliers Module Summary:** The backend has strong support for managing suppliers and tracking their associated bikes. The frontend currently lacks any UI for these administrative features.

---

### **8. IoT & IoT-Service Module**

| Feature | Status | Implementation Details |
| :--- | :--- | :--- |
| **Device State Machine** | ✅ **Completed** | `apps/iot/src/handlers/CommandHandler.cpp` defines clear state transition rules (e.g., `AVAILABLE` -> `BOOKED`). The device can change states based on commands. |
| **MQTT Communication** | ✅ **Completed** | Both `iot-service` and `iot` have MQTT managers (`MqttConnectionManager`, `MQTTManager.cpp`) to connect, publish, and subscribe to topics. |
| **Command Handling (IoT Device)** | ✅ **Completed** | `CommandHandler.cpp` processes commands for state, booking, reservation, and maintenance received from the `iot-service`. |
| **Command Publishing (IoT Service)** | ✅ **Completed** | `apps/iot-service/src/publishers/commands.ts` can send commands to devices. The service exposes HTTP endpoints to trigger these commands. |
| **Device Discovery & Status** | 🟡 **Partially Implemented** | `DeviceDiscovery` and `DeviceManager` in the `iot-service` track device status changes, but the system appears to rely on devices publishing their status rather than active discovery. |
| **Hardware Integration (LED)** | ✅ **Completed** | `apps/iot/src/managers/LEDStatusManager.cpp` manages the device's LED to reflect its current state (e.g., solid green for `AVAILABLE`, blinking yellow for `RESERVED`). |

**IoT Module Summary:** The foundational IoT communication and state management are well-established. The `iot-service` can send commands, and the `iot` device can receive and act on them, including providing visual feedback via an LED.