import mqtt from "mqtt";

const client = mqtt.connect("mqtt://192.168.1.20:1883", {
  username: "admin",
  password: "password",
});

client.on("connect", () => {
  console.warn("Connected to MQTT broker");

  client.subscribe("esp/status", (err) => {
    if (err) {
      console.error("Subscribe error:", err);
    }
    else {
      console.warn("Subscribed to esp/status");
    }
  });

  client.publish("esp/commands", "Hello from JS!", (err) => {
    if (err) {
      console.error("Publish error:", err);
    }
    else {
      console.warn("Message sent to esp/commands");
    }
  });
});

client.on("message", (topic, message) => {
  console.warn(`Received on ${topic}: ${message.toString()}`);
});

client.on("error", (err) => {
  console.error("Connection error:", err);
});
