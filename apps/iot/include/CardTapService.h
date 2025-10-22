#ifndef CARD_TAP_SERVICE_H
#define CARD_TAP_SERVICE_H

#include <string>

#include "CardTapWatcher.h"
#include "NFCManager.h"

class CardTapService {
public:
  explicit CardTapService(NFCManager& manager);

  void begin(const std::string& chipId);

  void loop();

private:
  CardTapWatcher watcher;
  std::string deviceChipId;

  void publishCardTap(const std::string& cardUid);
};

#endif // CARD_TAP_SERVICE_H
