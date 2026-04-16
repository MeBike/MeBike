#ifndef APP_RUNTIME_STATE_H
#define APP_RUNTIME_STATE_H

#include <cstdint>

enum class RuntimeState : uint8_t
{
    Booting,
    Offline,
    Ready,
    ProcessingTap,
    ExecutingCommand,
    Error,
};

inline const char *runtimeStateName(RuntimeState state)
{
    switch (state)
    {
    case RuntimeState::Booting:
        return "BOOTING";
    case RuntimeState::Offline:
        return "OFFLINE";
    case RuntimeState::Ready:
        return "READY";
    case RuntimeState::ProcessingTap:
        return "PROCESSING_TAP";
    case RuntimeState::ExecutingCommand:
        return "EXECUTING_COMMAND";
    case RuntimeState::Error:
        return "ERROR";
    default:
        return "UNKNOWN";
    }
}

#endif // APP_RUNTIME_STATE_H
