import { Env, PluginInputs } from "./types";
import { isGithubPayload, isTelegramPayload } from "./types/typeguards";
import { handleGithubWebhook } from "./handlers/github/webhook";
import { handleTelegramWebhook } from "./handlers/telegram/webhook";
import manifest from "../manifest.json";
import { handleUncaughtError } from "./utils/errors";
import { TelegramBotSingleton } from "./utils/telegram-bot-single";
import { PluginContext } from "./utils/plugin-context-single";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.pathname === "/manifest.json") {
        console.log("manifest.json requested", manifest);
        return new Response(JSON.stringify(manifest), {
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: `Only POST requests are supported.` }), {
        status: 405,
        headers: { "content-type": "application/json", Allow: "POST" },
      });
    }
    const contentType = request.headers.get("content-type");
    if (contentType !== "application/json") {
      return new Response(JSON.stringify({ error: `Error: ${contentType} is not a valid content type` }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    let payload;

    try {
      payload = await request.clone().json();
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    TelegramBotSingleton.initialize(env);

    try {
      if (isGithubPayload(payload)) {
        PluginContext.initialize(payload, env);
        await handleGithubWebhook(request, env);
      } else if (isTelegramPayload(payload)) {
        await handleTelegramWebhook(request, env);
      } else {
        return new Response(JSON.stringify({ error: "Invalid environment provided" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response("OK", { status: 200, headers: { "content-type": "application/json" } });
    } catch (err) {
      return handleUncaughtError(err);
    }
  },
};

