#include "DeviceUtils.h"

#include <WiFi.h>

std::string getMacAddress()
{
    String mac = WiFi.macAddress();
    mac.replace(":", "");
    mac.toUpperCase();
    return std::string(mac.c_str());
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
