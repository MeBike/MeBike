# Wallet & Payment Flow

![Wallet Diagram](../images/wallet_flow.svg)

**Participants:**
- **User**: The end user.
- **WalletScreen**: `MyWalletScreen` component.
- **Backend**: The API server.
- **PaymentGateway**: External Payment Provider (e.g., VNPay/Momo - implied).

```mermaid
sequenceDiagram
    participant User
    participant WalletScreen
    participant Backend

    User->>WalletScreen: Open MyWalletScreen
    WalletScreen->>Backend: GET /wallets/me
    WalletScreen->>Backend: GET /wallets/transactions
    Backend-->>WalletScreen: Return Wallet Balance & History
    WalletScreen->>User: Show Balance & Transactions

    %% Top Up Flow (Manual Transfer)
    opt Top Up Wallet
        User->>WalletScreen: Tap "Top Up"
        WalletScreen->>User: Show Bank QR & User ID
        Note right of User: User makes external bank transfer<br/>with User ID in memo
        
        %% Async Process
        Note over Backend: Admin/System verifies transfer<br/>and credits wallet
        Backend->>Backend: Increase Balance (Admin Action)
        
        User->>WalletScreen: Pull to Refresh
        WalletScreen->>Backend: GET /wallets/me
        Backend-->>WalletScreen: Return Updated Balance
    end

    %% Withdraw Flow
    opt Withdraw Funds
        User->>WalletScreen: Tap "Withdraw"
        WalletScreen->>User: Enter Amount & Bank Info
        User->>WalletScreen: Submit Request
        WalletScreen->>Backend: POST /wallets/withdrawals
        Backend-->>WalletScreen: Request Created (Pending)
    end
```
