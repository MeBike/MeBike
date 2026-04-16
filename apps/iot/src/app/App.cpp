#include "app/App.h"

#include <ArduinoJson.h>
#include <ArduinoLog.h>
#include <Wire.h>

#include "Config.h"
#include "DeviceUtils.h"
#include "HardwareConfig.h"
#include "NFCManager.h"
#include "services/CommandConsumer.h"
#include "services/ConnectivityService.h"
#include "services/FeedbackController.h"
#include "services/TapPublisher.h"

namespace
{
constexpr unsigned long STATUS_HEARTBEAT_INTERVAL_MS = 15000;
}

App::~App() = default;

void App::setup()
{
    Serial.begin(74880);
    Log.begin(LOG_LEVEL_VERBOSE, &Serial);

    ledController.begin();
    feedbackController = std::make_unique<FeedbackController>();

    setRuntimeState(RuntimeState::Booting);

    deviceContext = makeDeviceContext(getMacAddress());
    Log.notice("Device adapter booting as %s\n", deviceContext.deviceId.c_str());

    const AppConfig config = loadConfig();
    if (config.wifiSsid.empty() || config.mqttBrokerIP.empty() || config.mqttPort <= 0)
    {
        Log.error("Missing required WiFi or MQTT configuration\n");
        setupFailed = true;
        setRuntimeState(RuntimeState::Error);
        return;
    }

    Wire.begin(HardwareConfig::I2C_SDA_PIN, HardwareConfig::I2C_SCL_PIN);

    nfcManager = std::make_unique<NFCManager>(HardwareConfig::PN532_IRQ_PIN, HardwareConfig::PN532_RESET_PIN);
    if (!nfcManager->begin())
    {
        Log.warning("PN532 not available at boot; recovery will continue in background\n");
    }

    connectivityService = std::make_unique<ConnectivityService>(config, deviceContext);
    connectivityService->setCommandTopic(deviceContext.topics.commandTopic);

    commandConsumer = std::make_unique<CommandConsumer>(deviceContext);
    commandConsumer->attach(connectivityService->mqtt());

    tapPublisher = std::make_unique<TapPublisher>(*nfcManager, deviceContext);

    connectivityService->begin();
    setRuntimeState(RuntimeState::Offline);
}

void App::loop()
{
    RuntimeState nextState = RuntimeState::Offline;

    if (setupFailed || feedbackController == nullptr)
    {
        nextState = RuntimeState::Error;
    }
    else
    {
        connectivityService->loop();

        if (connectivityService->isReady())
        {
            nextState = RuntimeState::Ready;

            if (commandConsumer->processPending(connectivityService->mqtt(), *feedbackController))
            {
                nextState = RuntimeState::ExecutingCommand;
            }

            if (tapPublisher->pollAndPublish(connectivityService->mqtt()))
            {
                feedbackController->signalTapPublished();
                nextState = RuntimeState::ProcessingTap;
            }

            if (nfcManager != nullptr && !nfcManager->isHealthy() && !nfcManager->isRecovering())
            {
                nextState = RuntimeState::Error;
            }

            setRuntimeState(nextState);
            publishStatusIfNeeded();
        }
        else if (nfcManager != nullptr && !nfcManager->isHealthy())
        {
            nextState = RuntimeState::Error;
            setRuntimeState(nextState);
        }
        else
        {
            setRuntimeState(nextState);
        }
    }

    if (feedbackController != nullptr)
    {
        feedbackController->update(ledController, runtimeState);
    }
    else
    {
        ledController.setMode(LedMode::BlinkRed);
        ledController.update();
    }

    delay(5);
}

void App::setRuntimeState(RuntimeState state)
{
    runtimeState = state;
}

void App::publishStatusIfNeeded(bool force)
{
    if (connectivityService == nullptr || !connectivityService->isReady())
    {
        return;
    }

    const unsigned long now = millis();
    const bool stateChanged = runtimeState != lastPublishedState;
    const bool heartbeatDue = lastStatusPublishAt == 0 || now - lastStatusPublishAt >= STATUS_HEARTBEAT_INTERVAL_MS;
    if (!force && !stateChanged && !heartbeatDue)
    {
        return;
    }

    StaticJsonDocument<192> doc;
    doc["deviceId"] = deviceContext.deviceId.c_str();
    doc["runtimeState"] = runtimeStateName(runtimeState);
    doc["wifiConnected"] = connectivityService->isWifiConnected();
    doc["mqttConnected"] = connectivityService->isReady();
    doc["nfcHealthy"] = nfcManager != nullptr && nfcManager->isHealthy();
    doc["timestampMs"] = now;

    char payload[192];
    const size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || payloadLength >= sizeof(payload))
    {
        Log.error("Failed to serialize runtime status\n");
        return;
    }

    if (connectivityService->mqtt().publish(deviceContext.topics.statusTopic, payload, true))
    {
        lastPublishedState = runtimeState;
        lastStatusPublishAt = now;
        Log.verbose("Published runtime status %s\n", runtimeStateName(runtimeState));
    }
}
