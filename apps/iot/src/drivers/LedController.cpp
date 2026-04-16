#include "drivers/LedController.h"

#include <cmath>

#include "HardwareConfig.h"

namespace
{
constexpr unsigned long SLOW_BLINK_INTERVAL_MS = 500;
constexpr unsigned long FAST_BLINK_INTERVAL_MS = 180;
constexpr unsigned long FLASH_INTERVAL_MS = 120;
}

void LedController::begin()
{
    ledcSetup(HardwareConfig::LED_RED_CHANNEL, HardwareConfig::LED_PWM_FREQ, HardwareConfig::LED_PWM_RESOLUTION);
    ledcSetup(HardwareConfig::LED_YELLOW_CHANNEL, HardwareConfig::LED_PWM_FREQ, HardwareConfig::LED_PWM_RESOLUTION);
    ledcSetup(HardwareConfig::LED_GREEN_CHANNEL, HardwareConfig::LED_PWM_FREQ, HardwareConfig::LED_PWM_RESOLUTION);

    ledcAttachPin(HardwareConfig::LED_RED_PIN, HardwareConfig::LED_RED_CHANNEL);
    ledcAttachPin(HardwareConfig::LED_YELLOW_PIN, HardwareConfig::LED_YELLOW_CHANNEL);
    ledcAttachPin(HardwareConfig::LED_GREEN_PIN, HardwareConfig::LED_GREEN_CHANNEL);

    turnOffAll();
}

void LedController::setMode(LedMode mode)
{
    if (currentMode == mode)
    {
        return;
    }

    currentMode = mode;
    lastUpdateAt = millis();
    blinkOn = false;
}

void LedController::update()
{
    const unsigned long now = millis();

    switch (currentMode)
    {
    case LedMode::Off:
        turnOffAll();
        break;
    case LedMode::SolidGreen:
        setGreen(HardwareConfig::LED_GREEN_DUTY);
        break;
    case LedMode::SolidAmber:
        setYellow(HardwareConfig::LED_FULL_BRIGHTNESS);
        break;
    case LedMode::BlinkAmberSlow:
        if (now - lastUpdateAt >= SLOW_BLINK_INTERVAL_MS)
        {
            blinkOn = !blinkOn;
            lastUpdateAt = now;
        }
        blinkOn ? setYellow(HardwareConfig::LED_FULL_BRIGHTNESS) : turnOffAll();
        break;
    case LedMode::BlinkAmberFast:
        if (now - lastUpdateAt >= FAST_BLINK_INTERVAL_MS)
        {
            blinkOn = !blinkOn;
            lastUpdateAt = now;
        }
        blinkOn ? setYellow(HardwareConfig::LED_FULL_BRIGHTNESS) : turnOffAll();
        break;
    case LedMode::BlinkRed:
        if (now - lastUpdateAt >= FAST_BLINK_INTERVAL_MS)
        {
            blinkOn = !blinkOn;
            lastUpdateAt = now;
        }
        blinkOn ? setRed(HardwareConfig::LED_FULL_BRIGHTNESS) : turnOffAll();
        break;
    case LedMode::PulseAmber:
    {
        const float phase = static_cast<float>(now % HardwareConfig::LED_SLOW_PULSE_PERIOD) /
                            static_cast<float>(HardwareConfig::LED_SLOW_PULSE_PERIOD);
        const float intensity = (std::sin(phase * 2.0F * PI - PI / 2.0F) + 1.0F) / 2.0F;
        const uint8_t brightness = static_cast<uint8_t>(
            HardwareConfig::LED_PULSE_MIN_BRIGHTNESS +
            intensity * (HardwareConfig::LED_PULSE_MAX_BRIGHTNESS - HardwareConfig::LED_PULSE_MIN_BRIGHTNESS));
        setYellow(brightness);
        break;
    }
    case LedMode::FlashGreen:
        if (now - lastUpdateAt >= FLASH_INTERVAL_MS)
        {
            blinkOn = !blinkOn;
            lastUpdateAt = now;
        }
        blinkOn ? setGreen(HardwareConfig::LED_GREEN_DUTY) : turnOffAll();
        break;
    case LedMode::FlashRed:
        if (now - lastUpdateAt >= FLASH_INTERVAL_MS)
        {
            blinkOn = !blinkOn;
            lastUpdateAt = now;
        }
        blinkOn ? setRed(HardwareConfig::LED_FULL_BRIGHTNESS) : turnOffAll();
        break;
    }
}

void LedController::turnOffAll()
{
    ledcWrite(HardwareConfig::LED_RED_CHANNEL, HardwareConfig::LED_OFF);
    ledcWrite(HardwareConfig::LED_YELLOW_CHANNEL, HardwareConfig::LED_OFF);
    ledcWrite(HardwareConfig::LED_GREEN_CHANNEL, HardwareConfig::LED_FULL_BRIGHTNESS);
}

void LedController::setRed(uint8_t brightness)
{
    turnOffAll();
    ledcWrite(HardwareConfig::LED_RED_CHANNEL, brightness);
}

void LedController::setYellow(uint8_t brightness)
{
    turnOffAll();
    ledcWrite(HardwareConfig::LED_YELLOW_CHANNEL, brightness);
}

void LedController::setGreen(uint8_t brightness)
{
    turnOffAll();
    ledcWrite(HardwareConfig::LED_GREEN_CHANNEL, HardwareConfig::LED_FULL_BRIGHTNESS - brightness);
}
