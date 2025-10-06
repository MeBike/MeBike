#ifndef LED_STATUS_MANAGER_H
#define LED_STATUS_MANAGER_H

#include <Arduino.h>

// RED and YELLOW:(HIGH = ON, LOW = OFF)
// GREEN: Sink (LOW = ON, HIGH = OFF)
#define LED_RED_PIN 16
#define LED_YELLOW_PIN 17
#define LED_GREEN_PIN 18

// PWM pulsiating
#define LED_PWM_FREQ 25000   // 25 kHz
#define LED_PWM_RESOLUTION 8 //  (0-255)

// PWM channels
#define LED_RED_CHANNEL 0
#define LED_YELLOW_CHANNEL 1
#define LED_GREEN_CHANNEL 2

#define LED_FULL_BRIGHTNESS 255
#define LED_OFF 0
#define LED_GREEN_DUTY 35 //  nhỏ lại ko nó 3.3V cùng làm hư pin của esp32

// MIN MAX  PULSE LIGH
#define LED_PULSE_MIN_BRIGHTNESS 60
#define LED_PULSE_MAX_BRIGHTNESS 255

#define LED_FAST_BLINK_INTERVAL 200
#define LED_SLOW_PULSE_PERIOD 2000
#define LED_SOLID_UPDATE_INTERVAL 100

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

    void setColor(LEDColor color, uint8_t brightness = LED_FULL_BRIGHTNESS);
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
