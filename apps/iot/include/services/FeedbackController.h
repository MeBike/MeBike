#ifndef SERVICES_FEEDBACK_CONTROLLER_H
#define SERVICES_FEEDBACK_CONTROLLER_H

#include <Arduino.h>

#include "app/RuntimeState.h"
#include "drivers/LedController.h"

class FeedbackController
{
public:
    void signalTapPublished();
    void signalUnlockGranted();
    void signalAccessDenied();
    void signalCommandFailed();
    void update(LedController &ledController, RuntimeState baseState);

private:
    enum class OverrideMode : uint8_t
    {
        None,
        TapPublished,
        UnlockGranted,
        AccessDenied,
        CommandFailed,
    };

    void setOverride(OverrideMode mode, unsigned long durationMs);

    OverrideMode overrideMode = OverrideMode::None;
    unsigned long overrideUntil = 0;
};

#endif // SERVICES_FEEDBACK_CONTROLLER_H
