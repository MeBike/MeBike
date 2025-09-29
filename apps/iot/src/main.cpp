#include <Arduino.h>
#include <PubSubClient.h>


#define WIFI_NAME_STR WIFI_NAME  
#define WIFI_PASSWORD_STR WIFI_PASSWORD
int myFunction(int, int);
void setup()
{
  PubSubClient client;
  // put your setup code here, to run once:
  
  int result = myFunction(2, 3);
}

void loop()
{
}

// put function definitions here:
int myFunction(int x, int y)
{
  return x + y;
}