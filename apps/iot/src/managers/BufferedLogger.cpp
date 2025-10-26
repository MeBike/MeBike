#include "BufferedLogger.h"

#include "MQTTManager.h"
#include <ArduinoLog.h>
#include <cstdarg>

BufferedLogger::BufferedLogger(unsigned long flushIntervalMs, size_t maxBufferedEntries)
    : _mqttManager(nullptr), _flushInterval(flushIntervalMs), _maxBufferedEntries(maxBufferedEntries), _lastFlush(0)
{
}
// này là CPP Setter giống java nhưng CPP 
void BufferedLogger::setMQTTManager(MQTTManager *manager)
{
    _mqttManager = manager;
}

void BufferedLogger::setTopic(const std::string &topic)
{
    _topic = topic;
}

void BufferedLogger::setFlushInterval(unsigned long intervalMs)
{
    _flushInterval = intervalMs;
}

void BufferedLogger::setMaxBufferedEntries(size_t maxEntries)
{
    _maxBufferedEntries = maxEntries;
}

void BufferedLogger::log(LogSeverity severity, LogDestination destination, const std::string &message)
{
    if (destination == LogDestination::Local || destination == LogDestination::Both)
    {
        logToLocal(severity, message);
    }

    if (destination == LogDestination::MQTT || destination == LogDestination::Both)
    {
        BufferedEntry entry{millis(), severity, message};
        _buffer.push_back(entry);
        ensureBufferLimit();
    }
}

void BufferedLogger::log(LogSeverity severity, LogDestination destination, const char *message)
{
    if (!message)
    {
        return;
    }
    log(severity, destination, std::string(message));
}

void BufferedLogger::logf(LogSeverity severity, LogDestination destination, const char *fmt, ...)
{
    if (!fmt)
    {
        return;
    }

    va_list args;
    va_start(args, fmt);
    char stackBuffer[128];
    va_list argsCopy;
    va_copy(argsCopy, args);
    int required = vsnprintf(stackBuffer, sizeof(stackBuffer), fmt, args);
    va_end(args);

    if (required < 0)
    {
        va_end(argsCopy);
        return;
    }

    if (static_cast<size_t>(required) < sizeof(stackBuffer))
    {
        log(severity, destination, std::string(stackBuffer));
        va_end(argsCopy);
        return;
    }

    std::vector<char> dynamicBuffer(static_cast<size_t>(required) + 1);
    vsnprintf(dynamicBuffer.data(), dynamicBuffer.size(), fmt, argsCopy);
    va_end(argsCopy);
    log(severity, destination, std::string(dynamicBuffer.data()));
}

void BufferedLogger::loop()
{
    if (_buffer.empty())
    {
        return;
    }

    unsigned long now = millis();
    if (_lastFlush == 0)
    {
        _lastFlush = now;
    }

    if ((_flushInterval > 0 && now - _lastFlush >= _flushInterval) || _buffer.size() >= _maxBufferedEntries)
    {
        flush();
    }
}

void BufferedLogger::flush()
{
    if (_buffer.empty() || !_mqttManager || _topic.empty())
    {
        return;
    }

    if (!_mqttManager->isConnected())
    {
        return;
    }

    std::vector<BufferedEntry> pending;
    pending.reserve(_buffer.size());

    for (size_t i = 0; i < _buffer.size(); ++i)
    {
        const BufferedEntry &entry = _buffer[i];
        char timestampBuffer[16];
        snprintf(timestampBuffer, sizeof(timestampBuffer), "%lu", entry.timestamp);

        std::string payload = std::string(timestampBuffer) + " " + severityLabel(entry.severity) + ": " + entry.message;

        if (!_mqttManager->publish(_topic, payload, false))
        {
            Log.warning("BufferedLogger failed to publish to %s\n", _topic.c_str());
            pending.insert(pending.end(), _buffer.begin() + i, _buffer.end());
            break;
        }
    }

    if (pending.empty())
    {
        _buffer.clear();
        _lastFlush = millis();
        Log.verbose("BufferedLogger flushed %s\n", _topic.c_str());
    }
    else
    {
        _buffer.swap(pending);
    }
}

void BufferedLogger::logToLocal(LogSeverity severity, const std::string &message)
{
    switch (severity)
    {
    case LogSeverity::Verbose:
        Log.verbose("%s\n", message.c_str());
        break;
    case LogSeverity::Info:
        Log.notice("%s\n", message.c_str());
        break;
    case LogSeverity::Warning:
        Log.warning("%s\n", message.c_str());
        break;
    case LogSeverity::Error:
        Log.error("%s\n", message.c_str());
        break;
    }
}

void BufferedLogger::ensureBufferLimit()
{
    if (_maxBufferedEntries == 0)
    {
        return;
    }

    if (_buffer.size() > _maxBufferedEntries)
    {
        _buffer.erase(_buffer.begin());
    }
}

const char *BufferedLogger::severityLabel(LogSeverity severity)
{
    switch (severity)
    {
    case LogSeverity::Verbose:
        return "VERBOSE";
    case LogSeverity::Info:
        return "INFO";
    case LogSeverity::Warning:
        return "WARNING";
    case LogSeverity::Error:
        return "ERROR";
    default:
        return "INFO";
    }
}
