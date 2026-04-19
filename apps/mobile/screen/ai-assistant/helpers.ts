export function getAiAssistantErrorMessage(error: Error | undefined) {
  if (!error) {
    return null;
  }

  const message = error.message.toLowerCase();

  if (message.includes("abort") || message.includes("cancel")) {
    return null;
  }

  if (
    message.includes("connectexception")
    || message.includes("failed to connect")
    || message.includes("network request failed")
    || message.includes("fetch failed")
  ) {
    return "Không thể kết nối đến trợ lý lúc này. Vui lòng kiểm tra mạng hoặc thử lại sau.";
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return "Trợ lý phản hồi chậm hơn bình thường. Vui lòng thử lại sau ít phút.";
  }

  return "Trợ lý hiện không thể phản hồi. Vui lòng thử lại sau ít phút.";
}
