# ESP32 IoT Project with MQTT

This is an ESP32-based IoT project that connects to WiFi, loads configuration from a `.env` file stored on SPIFFS, and communicates via MQTT using RabbitMQ. It publishes status updates and subscribes to commands.

## Features

- WiFi connection with credentials from `.env`
- MQTT integration (publish to `esp/status`, subscribe to `esp/commands`)
- Configurable via `.env` file (broker, credentials, etc.)
- Logging with ArduinoLog
- Professional code structure with classes and namespaces

## Prerequisites

- **PlatformIO**: Install via VS Code extension or CLI (`pip install platformio`).
- **ESP32 Board**: Connected via USB.
- **RabbitMQ**: Running with MQTT plugin enabled. Use Docker:
  ```bash
  docker run -d --name rabbitmq -p 0:0:0:05672:5672 -p 0:0:0:0:15672:15672 -p 0:0:0:0:1883:1883 \
    -e RABBITMQ_DEFAULT_USER=admin \
    -e RABBITMQ_DEFAULT_PASS=password \
    rabbitmq:management-alpine
  ```
  Enable MQTT: `docker exec rabbitmq rabbitmq-plugins enable rabbitmq_mqtt`
- **Node.js** (optional, for testing MQTT with JS script).

## Setup Instructions

### 1. Clone/Download the Project

Place the project in a folder, e.g., `/path/to/MeBike/apps/iot`.

### 2. Configure `.env` File

Create `data/.env` in the project root (PlatformIO uploads this to ESP32 SPIFFS automatically during the build/upload process).

Example content:

```
WIFI_SSID=YourWiFiName
WIFI_PASS=YourWiFiPassword
MQTT_BROKER_IP=192.168.1.20 // on linux ip addr show
MQTT_PORT=1883
MQTT_USERNAME=admin
MQTT_PASSWORD=password
```

- **WIFI_SSID/PASS**: Your WiFi network credentials.
- **MQTT_BROKER_IP**: IP of your RabbitMQ server (e.g., Docker container IP).
- **MQTT_PORT**: 1883 (default MQTT port).
- **MQTT_USERNAME/PASSWORD**: RabbitMQ credentials (match Docker env vars).

### 3. Build and Upload

- Open in VS Code with PlatformIO extension.
- Run `platformio run` to build.
- Run `platformio run --target upload` to upload to ESP32.
- Monitor serial: `platformio device monitor` (baud 74880).

Expected logs:

- Config loading from `.env`
- WiFi connection
- MQTT connection and subscription

### 4. Test MQTT

- **Via RabbitMQ UI**: Go to `http://localhost:15672` (user: admin, pass: password). Publish to `esp/commands` and check if ESP32 logs the message.
- **Via JS Script** (optional): Create `test_mqtt.js`:

  ```javascript
  import mqtt from "mqtt";

  const client = mqtt.connect("mqtt://192.168.1.20:1883", {
    username: "admin",
    password: "password"
  });

  client.on("connect", () => {
    console.log("Connected");
    client.subscribe("esp/status");
    client.publish("esp/commands", "Hello ESP32!");
  });

  client.on("message", (topic, message) => {
    console.log(`Received: ${message.toString()}`);
  });
  ```

  Run: `node test_mqtt.js`

## Project Structure

- `src/main.cpp`: Arduino setup/loop.
- `src/globals.cpp`: Global functions and MQTT setup.
- `include/globals.h`: Global declarations.
- `include/MQTTManager.h` / `src/MQTTManager.cpp`: MQTT wrapper class.
- `lib/Config/`: Config loading from `.env`.
- `data/.env`: Configuration file (uploaded to SPIFFS).
- `platformio.ini`: Build config.

## Troubleshooting

- **WiFi Not Connecting**: Check SSID/PASS in `.env` and serial logs.
- **MQTT Connection Failed**: Verify RabbitMQ IP/port/credentials. Check firewall.
- **Config Not Loading**: Ensure `data/.env` exists and is uploaded (PlatformIO does this automatically).
- **Serial Monitor Issues**: Set baud to 74880, no flow control.
- **Build Errors**: Run `platformio run --clean` to clear cache.

## Notes

- The project uses dynamic memory for `MQTTManager` to load config at runtime.
- Logs are verbose for debugging; change `LOG_LEVEL_VERBOSE` to `LOG_LEVEL_INFO` for production.
- For production, secure MQTT with TLS and avoid plain passwords.

Enjoy your IoT project! Contributions welcome.
