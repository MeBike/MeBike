# Authentication Flow

![Authentication Diagram](../images/authentication_flow.svg)

**Participants:**
- **User**: The end user.
- **Screens**: `LoginScreen`, `RegisterScreen`, `EmailVerificationScreen`, `ForgotPasswordScreen`, `ResetPasswordOTP`.
- **Backend**: The API server.

```mermaid
sequenceDiagram
    participant User
    participant LoginScreen
    participant RegisterScreen
    participant EmailVerificationScreen
    participant ForgotPasswordScreen
    participant ResetPasswordOTP
    participant Backend

    %% Login Flow
    User->>LoginScreen: Enter Email & Password
    LoginScreen->>Backend: POST /users/login
    alt Success
        Backend-->>LoginScreen: Return Access Token & User Info
        LoginScreen->>User: Navigate to Home
    else Failure
        Backend-->>LoginScreen: Error (401 Unauthorized)
        LoginScreen->>User: Show Error Message
    end

    %% Register Flow
    User->>RegisterScreen: Enter Details (Name, Email, Pass, Phone)
    RegisterScreen->>Backend: POST /users/register
    Backend-->>RegisterScreen: Success (User Created)
    RegisterScreen->>EmailVerificationScreen: Navigate with Email
    
    User->>EmailVerificationScreen: Enter OTP from Email
    EmailVerificationScreen->>Backend: POST /users/verify-email-otp
    Backend-->>EmailVerificationScreen: Success
    EmailVerificationScreen->>LoginScreen: Navigate to Login

    %% Forgot Password Flow
    User->>LoginScreen: Tap "Forgot Password"
    LoginScreen->>ForgotPasswordScreen: Navigate
    User->>ForgotPasswordScreen: Enter Email
    ForgotPasswordScreen->>Backend: POST /users/forgot-password
    Backend-->>ForgotPasswordScreen: Email Sent
    ForgotPasswordScreen->>ResetPasswordOTP: Navigate
    
    User->>ResetPasswordOTP: Enter OTP & New Password
    ResetPasswordOTP->>Backend: POST /users/reset-password
    Backend-->>ResetPasswordOTP: Success
    ResetPasswordOTP->>LoginScreen: Navigate to Login
```
