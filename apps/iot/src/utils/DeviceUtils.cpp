#include "DeviceUtils.h"

#include <WiFi.h>
#include <cstdio>

std::string getMacAddress()
{
    uint8_t raw[6] = {0};
    WiFi.macAddress(raw);

    char macBuffer[13] = {0};
    for (size_t i = 0; i < 6; ++i)
    {
        std::snprintf(&macBuffer[i * 2], 3, "%02X", raw[i]);
    }

    return std::string(macBuffer, 12);
}

std::string makeTopicWithMac(const std::string &baseTopic)
{
    std::string sanitizedBase = baseTopic;
   
    std::string mac = getMacAddress();
    if (mac.empty())
    {
        return sanitizedBase;
    }

    if (!sanitizedBase.empty() && sanitizedBase.back() == '/')
    {
        sanitizedBase.pop_back();
    }

    sanitizedBase.reserve(sanitizedBase.size() + 1 + mac.size());
    sanitizedBase.push_back('/');
    sanitizedBase.append(mac);
    return sanitizedBase;
}
