#ifndef DRIVERS_LED_CONTROLLER_H
#define DRIVERS_LED_CONTROLLER_H

#include <Arduino.h>

enum class LedMode : uint8_t
{
    Off,
    SolidGreen,
    SolidAmber,
    BlinkAmberSlow,
    BlinkAmberFast,
    BlinkRed,
    PulseAmber,
    FlashGreen,
    FlashRed,
};

class LedController
{
public:
    void begin();
    void setMode(LedMode mode);
    void update();

private:
    void turnOffAll();
    void setRed(uint8_t brightness);
    void setYellow(uint8_t brightness);
    void setGreen(uint8_t brightness);

    LedMode currentMode = LedMode::Off;
    unsigned long lastUpdateAt = 0;
    bool blinkOn = false;
};

#endif // DRIVERS_LED_CONTROLLER_H
