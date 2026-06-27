const PROVIDERS = [
  {
    id: "groq",
    label: "Groq",
    apiKeyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "openai/gpt-oss-120b",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    modelEnv: "DEEPSEEK_MODEL",
    defaultModel: "deepseek-v4-flash",
    endpoint: "https://api.deepseek.com/chat/completions",
  },
];

const ALLOWED_ROLES = new Set(["system", "user", "assistant"]);

function configuredProviders(env) {
  return PROVIDERS.filter((provider) => Boolean(env[provider.apiKeyEnv]?.trim()));
}

export function getProviderStatus(env = process.env) {
  const providers = configuredProviders(env).map(({ id, label, modelEnv, defaultModel }) => ({
    id,
    label,
    model: env[modelEnv]?.trim() || defaultModel,
  }));

  return {
    ready: providers.length > 0,
    providers,
    primary: providers[0] || null,
  };
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) {
    throw new AIRequestError(400, "Messages must be an array.");
  }

  const normalized = messages
    .slice(-40)
    .filter((message) => message && ALLOWED_ROLES.has(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 30000),
    }))
    .filter((message) => message.content.trim());

  if (!normalized.some((message) => message.role === "user")) {
    throw new AIRequestError(400, "Add a user message before sending.");
  }

  return normalized;
}

async function requestProvider(provider, messages, env, signal) {
  const model = env[provider.modelEnv]?.trim() || provider.defaultModel;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });

  const body = {
    model,
    messages,
    temperature: 0.6,
    stream: false,
  };

  if (provider.id === "groq") {
    body.max_completion_tokens = 4096;
  } else {
    body.max_tokens = 4096;
  }

  try {
    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env[provider.apiKeyEnv].trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(`${provider.label}: ${detail}`);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error(`${provider.label} returned an empty response.`);
    }

    return { content, provider: provider.id, providerLabel: provider.label, model };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export class AIRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "AIRequestError";
    this.status = status;
  }
}

export async function completeChat(payload, env = process.env, signal) {
  const providers = configuredProviders(env);
  if (providers.length === 0) {
    throw new AIRequestError(
      503,
      "AI is not configured. Add GROQ_API_KEY to .env.local and restart the server.",
    );
  }

  const messages = normalizeMessages(payload?.messages);
  const failures = [];

  for (const provider of providers) {
    try {
      return await requestProvider(provider, messages, env, signal);
    } catch (error) {
      if (signal?.aborted || error?.name === "AbortError") throw error;
      failures.push(error instanceof Error ? error.message : `${provider.label} failed`);
    }
  }

  throw new AIRequestError(502, `All configured AI providers failed. ${failures.join(" ")}`);
}
