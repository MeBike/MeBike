#ifndef DEVICEUTILS_H
#define DEVICEUTILS_H

#include <string>

std::string getMacAddress();

// Example: base "esp/status" -> "esp/status/AA11BB22CC33".
std::string makeTopicWithMac(const std::string &baseTopic);

#endif // DEVICEUTILS_H
