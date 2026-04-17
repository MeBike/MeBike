#ifndef APP_APP_H
#define APP_APP_H

#include <memory>

#include "Config.h"
#include "NFCManager.h"
#include "app/DeviceContext.h"
#include "app/RuntimeState.h"
#include "drivers/LedController.h"
#include "services/CommandConsumer.h"
#include "services/ConnectivityService.h"
#include "services/FeedbackController.h"
#include "services/ProvisioningService.h"
#include "services/RuntimeStatusPublisher.h"
#include "services/TapPublisher.h"

class App
{
public:
    ~App();

    void setup();
    void loop();

private:
    void initializeLogging();
    bool loadRuntimeConfig();
    void initializeRuntimeServices();
    void applyFeedback();
    void setRuntimeState(RuntimeState state);

    AppConfig config;
    RuntimeState runtimeState = RuntimeState::Booting;
    DeviceContext deviceContext;
    LedController ledController;
    std::unique_ptr<NFCManager> nfcManager;
    std::unique_ptr<ConnectivityService> connectivityService;
    std::unique_ptr<TapPublisher> tapPublisher;
    std::unique_ptr<CommandConsumer> commandConsumer;
    std::unique_ptr<FeedbackController> feedbackController;
    std::unique_ptr<ProvisioningService> provisioningService;
    std::unique_ptr<RuntimeStatusPublisher> statusPublisher;
    bool setupFailed = false;
};

#endif // APP_APP_H
