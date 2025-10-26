#include "StateStorage.h"

#include <ArduinoLog.h>
#include <Preferences.h>

namespace
{
    Preferences preferences;
    bool initialized = false;
    constexpr const char *kNamespace = "device_state";
    constexpr const char *kKey = "state";
    DeviceState lastStoredState = STATE_INIT;

    bool isValidState(uint32_t raw)
    {
        return raw <= static_cast<uint32_t>(STATE_UNAVAILABLE);
    }
}

void StateStorage::begin()
{
    if (initialized)
    {
        return;
    }

    initialized = preferences.begin(kNamespace, false);

    if (!initialized)
    {
        Log.error("Failed to open preferences namespace: %s\n", kNamespace);
    }
}

void StateStorage::save(DeviceState state)
{
    if (!initialized)
    {
        begin();
    }

    if (!initialized || state == lastStoredState)
    {
        return;
    }

    const uint32_t rawState = static_cast<uint32_t>(state);
    size_t written = preferences.putUInt(kKey, rawState);

    if (written == sizeof(uint32_t))
    {
        lastStoredState = state;
        Log.notice("Persisted state: %s (%u)\n", getStateName(state), rawState);
    }
    else
    {
        Log.error("Failed to persist state %s (%u)\n", getStateName(state), rawState);
    }
}

DeviceState StateStorage::load(DeviceState defaultState)
{
    if (!initialized)
    {
        begin();
    }

    if (!initialized)
    {
        return defaultState;
    }

    uint32_t rawState = preferences.getUInt(kKey, static_cast<uint32_t>(defaultState));

    if (!isValidState(rawState))
    {
        Log.warning("Invalid persisted state value: %u\n", rawState);
        return defaultState;
    }

    DeviceState state = static_cast<DeviceState>(rawState);
    lastStoredState = state;
    return state;
}
