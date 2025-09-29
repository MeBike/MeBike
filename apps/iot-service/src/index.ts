import mqtt from "mqtt";

const client = mqtt.connect("mqtt://admin:password@localhost:1883");
client.on("connect", () => {
  console.warn("Connected to MQTT broker");
});
