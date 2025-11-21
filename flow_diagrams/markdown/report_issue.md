# Report Issue Flow

![Report Issue Diagram](../images/report_issue.svg)

**Participants:**
- **User**: The end user.
- **ReportScreen**: `ReportScreen` component.
- **Backend**: The API server.
- **TomTom**: External Map API (for address suggestions).

```mermaid
sequenceDiagram
    participant User
    participant ReportScreen
    participant TomTom
    participant Backend

    User->>ReportScreen: Open ReportScreen
    ReportScreen->>User: Show report form
    
    alt User inputs location
        User->>ReportScreen: Type address
        ReportScreen->>TomTom: Fetch address suggestions
        TomTom-->>ReportScreen: Return suggestions
        User->>ReportScreen: Select address
    end

    alt User adds images
        User->>ReportScreen: Tap "Add Image"
        ReportScreen->>User: Open Image Picker
        User->>ReportScreen: Select images
    end

    User->>ReportScreen: Tap "Send Report"
    ReportScreen->>Backend: POST /api/reports (JSON Payload)
    Backend-->>ReportScreen: Success response
    
    ReportScreen->>User: Show "Report Sent" alert
    ReportScreen->>User: Navigate back
```
