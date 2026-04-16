#include "services/FeedbackController.h"

void FeedbackController::signalTapPublished()
{
    setOverride(OverrideMode::TapPublished, 900);
}

void FeedbackController::signalUnlockGranted()
{
    setOverride(OverrideMode::UnlockGranted, 1600);
}

void FeedbackController::signalAccessDenied()
{
    setOverride(OverrideMode::AccessDenied, 1400);
}

void FeedbackController::signalCommandFailed()
{
    setOverride(OverrideMode::CommandFailed, 1600);
}

void FeedbackController::update(LedController &ledController, RuntimeState baseState)
{
    const unsigned long now = millis();

    if (overrideMode != OverrideMode::None)
    {
        if (now >= overrideUntil)
        {
            overrideMode = OverrideMode::None;
        }
        else
        {
            switch (overrideMode)
            {
            case OverrideMode::TapPublished:
                ledController.setMode(LedMode::PulseAmber);
                ledController.update();
                return;
            case OverrideMode::UnlockGranted:
                ledController.setMode(LedMode::FlashGreen);
                ledController.update();
                return;
            case OverrideMode::AccessDenied:
                ledController.setMode(LedMode::FlashRed);
                ledController.update();
                return;
            case OverrideMode::CommandFailed:
                ledController.setMode(LedMode::BlinkRed);
                ledController.update();
                return;
            case OverrideMode::None:
                break;
            }
        }
    }

    switch (baseState)
    {
    case RuntimeState::Booting:
        ledController.setMode(LedMode::BlinkAmberSlow);
        break;
    case RuntimeState::Offline:
        ledController.setMode(LedMode::BlinkAmberSlow);
        break;
    case RuntimeState::Ready:
        ledController.setMode(LedMode::SolidGreen);
        break;
    case RuntimeState::ProcessingTap:
        ledController.setMode(LedMode::PulseAmber);
        break;
    case RuntimeState::ExecutingCommand:
        ledController.setMode(LedMode::BlinkAmberFast);
        break;
    case RuntimeState::Error:
        ledController.setMode(LedMode::BlinkRed);
        break;
    }

    ledController.update();
}

void FeedbackController::setOverride(OverrideMode mode, unsigned long durationMs)
{
    overrideMode = mode;
    overrideUntil = millis() + durationMs;
}
