import { Value } from "@sinclair/typebox/value";
import { envValidator, Env } from "../../types";
import { getTelegramBot } from "#root/utils/get-telegram-bot.js";

export async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
    const result = envValidator.test(env);
    if (!result) {
        const errors = Array.from(envValidator.errors(env));
        console.error(`Invalid tg bot env: `, errors);
    }
    const settings = Value.Decode(envValidator.schema, Value.Default(envValidator.schema, env));

    const { server } = await getTelegramBot(env);

    return server.fetch(request, settings);
}