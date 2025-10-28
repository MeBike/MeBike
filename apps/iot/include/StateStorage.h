#ifndef STATE_STORAGE_H
#define STATE_STORAGE_H

#include "globals.h"

namespace StateStorage
{
    void begin();
    void save(DeviceState state);
    DeviceState load(DeviceState defaultState);
}

#endif // STATE_STORAGE_H
