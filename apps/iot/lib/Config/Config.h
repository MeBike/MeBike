#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

struct AppConfig {
    String wifiSsid;
    String wifiPass;
};


AppConfig loadConfig();

#endif
