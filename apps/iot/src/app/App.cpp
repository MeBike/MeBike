#include "app/App.h"

#include <Arduino.h>
#include <ArduinoLog.h>
#include <Wire.h>

#include "Config.h"
#include "HardwareConfig.h"

App::~App() = default;

void App::setup()
{
    initializeLogging();
    provisioningService = std::make_unique<ProvisioningService>(Serial);

    ledController.begin();
    feedbackController = std::make_unique<FeedbackController>();

    setRuntimeState(RuntimeState::Booting);

    if (!loadRuntimeConfig())
    {
        Log.error("Missing required bike, WiFi, or MQTT configuration\n");
        setupFailed = true;
        setRuntimeState(RuntimeState::Error);
        return;
    }

    initializeRuntimeServices();
    setRuntimeState(RuntimeState::Offline);
}

void App::loop()
{
    if (provisioningService != nullptr)
    {
        provisioningService->poll(config);
    }

    RuntimeState nextState = RuntimeState::Offline;

    if (setupFailed || feedbackController == nullptr || connectivityService == nullptr || commandConsumer == nullptr || tapPublisher == nullptr)
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
            if (statusPublisher != nullptr)
            {
                statusPublisher->publishIfNeeded(connectivityService->mqtt(),
                                                runtimeState,
                                                connectivityService->isWifiConnected(),
                                                connectivityService->isReady(),
                                                nfcManager != nullptr && nfcManager->isHealthy());
            }
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

    applyFeedback();
    delay(5);
}

void App::initializeLogging()
{
    Serial.begin(115200);
    Log.begin(LOG_LEVEL_VERBOSE, &Serial);
}

bool App::loadRuntimeConfig()
{
    config = loadConfig();
    return isConfigValid(config);
}

void App::initializeRuntimeServices()
{
    deviceContext = makeDeviceContext(config.bikeId);
    Log.notice("Device adapter booting as bike %s\n", deviceContext.deviceId.c_str());

    statusPublisher = std::make_unique<RuntimeStatusPublisher>(deviceContext);

    Wire.begin(HardwareConfig::I2C_SDA_PIN, HardwareConfig::I2C_SCL_PIN);

    nfcManager = std::make_unique<NFCManager>();
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
}

void App::applyFeedback()
{
    if (feedbackController != nullptr)
    {
        feedbackController->update(ledController, runtimeState);
    }
    else
    {
        ledController.setMode(LedMode::BlinkRed);
        ledController.update();
    }
}

void App::setRuntimeState(RuntimeState state)
{
    runtimeState = state;
}
