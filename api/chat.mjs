import { AIRequestError, completeChat, getProviderStatus } from "../server/ai.mjs";

function sendJson(response, status, body) {
  response.status(status).json(body);
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    return sendJson(response, 200, getProviderStatus(process.env));
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  try {
    const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const result = await completeChat(payload, process.env);
    return sendJson(response, 200, result);
  } catch (error) {
    const status = error instanceof AIRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to complete the request.";
    return sendJson(response, status, { error: message });
  }
}
