import { Value } from "@sinclair/typebox/value";
import { plugin } from "./plugin";
import { TgBotEnv, tgBotEnvSchema, tgEnvValidator, GithubBotEnv, githubEnvValidator, pluginSettingsSchema, pluginSettingsValidator, isGithubBotEnv, isTgBotEnv, Context } from "./types";
import manifest from "../manifest.json";
import { createBot } from "./bot/index.js";
import { logger } from "./logger";
import { createServer } from "./server";
import { Update } from "@grammyjs/types";

async function handleTelegramWebhook(request: Request, env: TgBotEnv, payload: Update): Promise<Response> {
  const result = tgEnvValidator.test(env);
  if (!result) {
    const errors = Array.from(tgEnvValidator.errors(env));
    console.error(`Invalid tg bot env: `, errors);
  }
  const settings = Value.Decode(tgBotEnvSchema, Value.Default(tgBotEnvSchema, env));

  const bot = createBot(env.BOT_TOKEN, {
    config: settings,
    logger,
  })

  const app = createServer({
    bot,
    config: settings,
    logger
  })

  // to prevent receiving updates before the bot is ready
  await bot.init()

  // set webhook
  await bot.api.setWebhook(settings.BOT_WEBHOOK, {
    // allowed_updates: settings.BOT_ALLOWED_UPDATES,
    secret_token: settings.BOT_WEBHOOK_SECRET,
  })

  return app.fetch(request, settings);
}

async function handleGithubWebhook(request: Request, env: GithubBotEnv, payload_: Context["payload"]): Promise<Response> {
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.pathname === "/manifest.json") {
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

    const webhookPayload = await request.json();
    const settings = Value.Decode(pluginSettingsSchema, Value.Default(pluginSettingsSchema, webhookPayload.settings));

    if (!pluginSettingsValidator.test(settings)) {
      const errors: string[] = [];
      for (const error of pluginSettingsValidator.errors(settings)) {
        console.error(error);
        errors.push(`${error.path}: ${error.message}`);
      }
      return new Response(JSON.stringify({ error: `Error: "Invalid settings provided. ${errors.join("; ")}"` }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (!githubEnvValidator.test(env)) {
      const errors: string[] = [];
      for (const error of githubEnvValidator.errors(env)) {
        console.error(error);
        errors.push(`${error.path}: ${error.message}`);
      }
      return new Response(JSON.stringify({ error: `Error: "Invalid environment provided. ${errors.join("; ")}"` }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    webhookPayload.settings = settings;
    await plugin(webhookPayload, env);
    return new Response(JSON.stringify("OK"), { status: 200, headers: { "content-type": "application/json" } });
  } catch (error) {
    return handleUncaughtError(error);
  }
}


function isTelegramPayload(payload: any): payload is Update {
  return payload.update_id !== undefined;
}

function isGithubPayload(payload: any): payload is Context["payload"] {
  return payload.action !== undefined;
}


export default {
  async fetch(request: Request, env: TgBotEnv): Promise<Response> {
    const payload = await request.clone().json();

    if (isGithubPayload(payload)) {
      await handleGithubWebhook(request, env, payload);
    } else if (isTelegramPayload(payload)) {
      await handleTelegramWebhook(request, env, payload);
    } else {
      return new Response(JSON.stringify({ error: "Invalid environment provided" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("OK", { status: 200, headers: { "content-type": "application/json" } });
  },
};

function handleUncaughtError(error: unknown) {
  console.error(error);
  const status = 500;
  return new Response(JSON.stringify({ error }), { status: status, headers: { "content-type": "application/json" } });
}
