#ifndef HARDWARE_CONFIG_H
#define HARDWARE_CONFIG_H

#include <cstdint>

namespace HardwareConfig {
constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t PN532_IRQ_PIN = 4;
constexpr uint8_t PN532_RESET_PIN = 5;
constexpr uint8_t LED_RED_PIN = 16;
constexpr uint8_t LED_YELLOW_PIN = 17;
constexpr uint8_t LED_GREEN_PIN = 18;
constexpr uint32_t LED_PWM_FREQ = 25000;
constexpr uint8_t LED_PWM_RESOLUTION = 8;
constexpr uint8_t LED_RED_CHANNEL = 0;
constexpr uint8_t LED_YELLOW_CHANNEL = 1;
constexpr uint8_t LED_GREEN_CHANNEL = 2;
constexpr uint8_t LED_FULL_BRIGHTNESS = 255;
constexpr uint8_t LED_OFF = 0;
constexpr uint8_t LED_GREEN_DUTY = 35;
constexpr uint8_t LED_PULSE_MIN_BRIGHTNESS = 60;
constexpr uint8_t LED_PULSE_MAX_BRIGHTNESS = 255;
constexpr unsigned long LED_FAST_BLINK_INTERVAL = 200;
constexpr unsigned long LED_SLOW_PULSE_PERIOD = 2000;
constexpr unsigned long LED_SOLID_UPDATE_INTERVAL = 100;
} // namespace HardwareConfig

#endif // HARDWARE_CONFIG_H
