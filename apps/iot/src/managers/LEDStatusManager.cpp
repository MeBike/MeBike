#include "LEDStatusManager.h"
#include "globals.h"
#include <ArduinoLog.h>

LEDStatusManager::LEDStatusManager()
    : currentColor(LED_COLOR_OFF),
      currentPattern(LED_PATTERN_OFF),
      lastUpdateTime(0),
      blinkState(false)
{
}

void LEDStatusManager::begin()
{
    ledcSetup(HardwareConfig::LED_RED_CHANNEL, HardwareConfig::LED_PWM_FREQ, HardwareConfig::LED_PWM_RESOLUTION);
    ledcSetup(HardwareConfig::LED_YELLOW_CHANNEL, HardwareConfig::LED_PWM_FREQ, HardwareConfig::LED_PWM_RESOLUTION);
    ledcSetup(HardwareConfig::LED_GREEN_CHANNEL, HardwareConfig::LED_PWM_FREQ, HardwareConfig::LED_PWM_RESOLUTION);

    ledcAttachPin(HardwareConfig::LED_RED_PIN, HardwareConfig::LED_RED_CHANNEL);
    ledcAttachPin(HardwareConfig::LED_YELLOW_PIN, HardwareConfig::LED_YELLOW_CHANNEL);
    ledcAttachPin(HardwareConfig::LED_GREEN_PIN, HardwareConfig::LED_GREEN_CHANNEL);

    turnOffAll();

    Log.info("LED Status Manager initialized (R=%d(source), Y=%d(source), G=%d(sink))\n",
             HardwareConfig::LED_RED_PIN, HardwareConfig::LED_YELLOW_PIN, HardwareConfig::LED_GREEN_PIN);
}

void LEDStatusManager::turnOffAll()
{
    ledcWrite(HardwareConfig::LED_RED_CHANNEL, HardwareConfig::LED_OFF);
    ledcWrite(HardwareConfig::LED_YELLOW_CHANNEL, HardwareConfig::LED_OFF);
    ledcWrite(HardwareConfig::LED_GREEN_CHANNEL, HardwareConfig::LED_FULL_BRIGHTNESS); // nay nguoc laij sink
}

void LEDStatusManager::setColor(LEDColor color, uint8_t brightness)
{
    turnOffAll();

    switch (color)
    {
    case LED_COLOR_RED:

        ledcWrite(HardwareConfig::LED_RED_CHANNEL, brightness);
        break;

    case LED_COLOR_YELLOW:

        ledcWrite(HardwareConfig::LED_YELLOW_CHANNEL, brightness);
        break;

    case LED_COLOR_GREEN:

        ledcWrite(HardwareConfig::LED_GREEN_CHANNEL, 255 - brightness);
        break;

    case LED_COLOR_OFF:
    default:

        break;
    }
}

void LEDStatusManager::setStatus(int state)
{
    DeviceState deviceState = static_cast<DeviceState>(state);
    LEDConfig config = getConfigForState(deviceState);
    currentColor = config.color;
    currentPattern = config.pattern;
    lastUpdateTime = millis();
    blinkState = false;

    Log.info("LED Status: Color=%d, Pattern=%d for state=%s\n",
             currentColor, currentPattern, getStateName(deviceState));
}

LEDStatusManager::LEDConfig LEDStatusManager::getConfigForState(int state)
{
    DeviceState deviceState = static_cast<DeviceState>(state);
    LEDConfig config;

    switch (deviceState)
    {
    case STATE_AVAILABLE:

        config.color = LED_COLOR_GREEN;
        config.pattern = LED_PATTERN_SOLID;
        break;

    case STATE_RESERVED:
        config.color = LED_COLOR_YELLOW;
        config.pattern = LED_PATTERN_SLOW_PULSE;
        break;

    case STATE_BOOKED:
        config.color = LED_COLOR_YELLOW;
        config.pattern = LED_PATTERN_SOLID;
        break;

    case STATE_BROKEN:
    case STATE_MAINTAINED:
    case STATE_UNAVAILABLE:
        config.color = LED_COLOR_RED;
        config.pattern = LED_PATTERN_SOLID;
        break;

    case STATE_INIT:
    case STATE_CONNECTING_WIFI:
    case STATE_CONNECTED:

        config.color = LED_COLOR_YELLOW;
        config.pattern = LED_PATTERN_FAST_BLINK;
        break;

    case STATE_ERROR:

        config.color = LED_COLOR_RED;
        config.pattern = LED_PATTERN_FAST_BLINK;
        break;

    default:
        config.color = LED_COLOR_OFF;
        config.pattern = LED_PATTERN_OFF;
        break;
    }

    return config;
}

void LEDStatusManager::updatePattern()
{
    unsigned long currentTime = millis();

    switch (currentPattern)
    {
    case LED_PATTERN_SOLID:

        if (currentColor == LED_COLOR_GREEN)
        {
            setColor(currentColor, HardwareConfig::LED_GREEN_DUTY);
        }
        else
        {
            setColor(currentColor, HardwareConfig::LED_FULL_BRIGHTNESS);
        }
        break;

    case LED_PATTERN_FAST_BLINK:
        if (currentTime - lastUpdateTime >= HardwareConfig::LED_FAST_BLINK_INTERVAL)
        {
            blinkState = !blinkState;
            if (blinkState)
            {
                if (currentColor == LED_COLOR_GREEN)
                {
                    setColor(currentColor, HardwareConfig::LED_GREEN_DUTY);
                }
                else
                {
                    setColor(currentColor, HardwareConfig::LED_FULL_BRIGHTNESS);
                }
            }
            else
            {
                turnOffAll();
            }
            lastUpdateTime = currentTime;
        }
        break;

    case LED_PATTERN_SLOW_PULSE:

    {
        float phase = (float)((currentTime % HardwareConfig::LED_SLOW_PULSE_PERIOD)) / HardwareConfig::LED_SLOW_PULSE_PERIOD;
        // Sine wave:
        float intensity = (sin(phase * 2 * PI - PI / 2) + 1.0) / 2.0;

        uint8_t brightness;
        if (currentColor == LED_COLOR_GREEN)
        {

            uint8_t minBright = HardwareConfig::LED_PULSE_MIN_BRIGHTNESS * HardwareConfig::LED_GREEN_DUTY / HardwareConfig::LED_FULL_BRIGHTNESS;
            brightness = (uint8_t)(minBright + intensity * (HardwareConfig::LED_GREEN_DUTY - minBright));
        }
        else
        {
            brightness = (uint8_t)(HardwareConfig::LED_PULSE_MIN_BRIGHTNESS + intensity * (HardwareConfig::LED_PULSE_MAX_BRIGHTNESS - HardwareConfig::LED_PULSE_MIN_BRIGHTNESS));
        }

        setColor(currentColor, brightness);
    }
    break;

    case LED_PATTERN_OFF:
    default:
        turnOffAll();
        break;
    }
}

void LEDStatusManager::update()
{
    updatePattern();
}
