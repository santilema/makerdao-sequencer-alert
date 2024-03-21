"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAlert = void 0;
/**
 * Sends an alert message to a specified webhook URL.
 *
 * This function asynchronously sends a POST request to the webhook URL
 * provided in the `webhookUrl` parameter. The message content is specified in
 * the `message` parameter. It logs the success or failure of the message delivery.
 *
 * @param webhookUrl The webhook URL to which the alert message is sent.
 * @param message The content of the alert message to be sent.
 */
const sendAlert = async (webhookUrl, message) => {
    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: message }),
        });
        if (!response.ok) {
            console.error("Failed to send discord alert");
        }
        else {
            console.log("Discord alert sent");
        }
    }
    catch (error) {
        console.error("Failed to send discord alert", error);
    }
};
exports.sendAlert = sendAlert;
