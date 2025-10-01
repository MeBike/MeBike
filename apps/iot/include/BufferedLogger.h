#ifndef BUFFEREDLOGGER_H
#define BUFFEREDLOGGER_H

#include <Arduino.h>
#include <string>
#include <vector>

class MQTTManager;

enum class LogSeverity
{
    Verbose,
    Info,
    Warning,
    Error
};

enum class LogDestination
{
    Local,
    MQTT,
    Both
};

class BufferedLogger
{
public:
    BufferedLogger(unsigned long flushIntervalMs = 5000, size_t maxBufferedEntries = 10);

    void setMQTTManager(MQTTManager *manager);
    void setTopic(const std::string &topic);
    void setFlushInterval(unsigned long intervalMs);
    void setMaxBufferedEntries(size_t maxEntries);

    void log(LogSeverity severity, LogDestination destination, const std::string &message);
    void log(LogSeverity severity, LogDestination destination, const char *message);
    void logf(LogSeverity severity, LogDestination destination, const char *fmt, ...);

    void loop();
    void flush();

private:
    struct BufferedEntry
    {
        unsigned long timestamp;
        LogSeverity severity;
        std::string message;
    };

    void logToLocal(LogSeverity severity, const std::string &message);
    void ensureBufferLimit();
    static const char *severityLabel(LogSeverity severity);

    MQTTManager *_mqttManager;
    std::string _topic;
    unsigned long _flushInterval;
    size_t _maxBufferedEntries;
    unsigned long _lastFlush;
    std::vector<BufferedEntry> _buffer;
};

#endif // BUFFEREDLOGGER_H
