import { Value } from "@sinclair/typebox/value";
import { Env, envValidator } from "../types";
import { createBot } from "../bot";
import { createServer } from "../server";
import { logger } from "../logger";

export async function getTelegramBot(env: Env) {
    const result = envValidator.test(env);
    if (!result) {
        const errors = Array.from(envValidator.errors(env));
        console.error(`Invalid tg bot env: `, errors);
    }
    const settings = Value.Decode(envValidator.schema, Value.Default(envValidator.schema, env));

    const bot = createBot(env.BOT_TOKEN, {
        config: settings,
        logger,
    })

    const server = createServer({
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

    return {
        server, bot
    }
}
