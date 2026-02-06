import fetchHttpClient from "../lib/httpClient";

export async function testBackendConnection() {
  try {
    console.log("Testing backend connection...");
    const response = await fetchHttpClient.get("/");
    console.log("Backend connection successful:", response.data);
    return true;
  }
  catch (error) {
    console.error("Backend connection failed:", error);
    return false;
  }
}

export async function testLoginEndpoint() {
  try {
    console.log("Testing login endpoint...");
    // Test with dummy data to see if endpoint responds
    const response = await fetchHttpClient.post("/users/login", {
      email: "test@test.com",
      password: "test123",
    });
    console.log("Login endpoint response:", response.status);
    return true;
  }
  catch (error: any) {
    if (error.response) {
      console.log("Login endpoint exists but returned error:", error.response.status, error.response.data);
      return true; // Endpoint exists
    }
    else {
      console.error("Login endpoint connection failed:", error.message);
      return false; // Network error
    }
  }
}
