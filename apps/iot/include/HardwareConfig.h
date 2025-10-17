#ifndef HARDWARE_CONFIG_H
#define HARDWARE_CONFIG_H

#include <cstdint>

namespace HardwareConfig {
constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t PN532_IRQ_PIN = 4;
constexpr uint8_t PN532_RESET_PIN = 5;
} // namespace HardwareConfig

#endif // HARDWARE_CONFIG_H
