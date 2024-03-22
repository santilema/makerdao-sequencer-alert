import { sendAlert } from "../../utils/alerts";
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("sendAlert", () => {
  const webhookUrl = "https://discord.com/api/webhooks/somewebhook";
  const message = "Test message";
  it("should send an alert message to a specified webhook URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });
    await sendAlert(webhookUrl, message);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: message }),
    });
  });
  it("should log an error if the request fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    await sendAlert(webhookUrl, message);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("Failed to send discord alert");
    consoleSpy.mockRestore();
  });
});
