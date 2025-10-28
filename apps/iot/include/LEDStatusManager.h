#ifndef LED_STATUS_MANAGER_H
#define LED_STATUS_MANAGER_H

#include <Arduino.h>
#include "HardwareConfig.h"

// RED and YELLOW:(HIGH = ON, LOW = OFF)
// GREEN: Sink (LOW = ON, HIGH = OFF)

enum LEDPattern
{
    LED_PATTERN_OFF,
    LED_PATTERN_SOLID,
    LED_PATTERN_SLOW_PULSE,
    LED_PATTERN_FAST_BLINK
};

enum LEDColor
{
    LED_COLOR_OFF,
    LED_COLOR_RED,
    LED_COLOR_YELLOW,
    LED_COLOR_GREEN
};

class LEDStatusManager
{
public:
    LEDStatusManager();
    void begin();
    void update();
    void setStatus(int state);

private:
    LEDColor currentColor;
    LEDPattern currentPattern;
    unsigned long lastUpdateTime;
    bool blinkState;

    void setColor(LEDColor color, uint8_t brightness = HardwareConfig::LED_FULL_BRIGHTNESS);
    void turnOffAll();
    void updatePattern();

    //  LED configu
    struct LEDConfig
    {
        LEDColor color;
        LEDPattern pattern;
    };

    LEDConfig getConfigForState(int state); // Tuwf enum ma ra
};

#endif // LED_STATUS_MANAGER_H
