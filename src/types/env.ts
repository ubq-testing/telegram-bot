import { Type as T } from "@sinclair/typebox";
import { StaticDecode } from "@sinclair/typebox";
import "dotenv/config";
import { StandardValidator } from "typebox-validators";

const allowedUpdates = T.Object({
    message: T.String(),
    poll: T.String(),
    edited_message: T.String(),
    channel_post: T.String(),
    edited_channel_post: T.String(),
    business_connection: T.String(),
    business_message: T.String(),
    edited_business_message: T.String(),
    deleted_business_messages: T.String(),
    message_reaction_count: T.String(),
});

export const tgBotEnvSchema = T.Object({
    BOT_TOKEN: T.String(),
    BOT_MODE: T.String(),
    LOG_LEVEL: T.String(),
    DEBUG: T.Transform(T.String()).Decode((str) => str === "true").Encode((bool) => bool ? "true" : "false"),
    BOT_WEBHOOK: T.String(),
    BOT_WEBHOOK_SECRET: T.String(),
    SERVER_HOST: T.String(),
    SERVER_PORT: T.Transform(T.String()).Decode((str) => parseInt(str)).Encode((num) => num.toString()),
    BOT_ADMINS: T.Transform(T.String()).Decode((str) => JSON.parse(str)).Encode((arr) => JSON.stringify(arr)),
    ALLOWED_UPDATES: T.Optional(T.Array(T.KeyOf(allowedUpdates)))
});

/**
 * 
 * Maybe it's the same but most likely not if the github entry
 * needs to fire gh events so it'll probs rely on org/repo secrets
 * but we cannot infer these from plugins in anyway other than parsing the
 * code which is a no-go.
 * 
 * So this should probably be a collection of env schemas for commands which
 * are supported by the tg bot.
 * 
 * For now we'll keep it simple and just have a single schema for the github bot.
 */
export const githubBotEnvSchema = T.Object({
    BOT_TOKEN: T.String(),
    BOT_MODE: T.String(),
    LOG_LEVEL: T.String(),
    DEBUG: T.Transform(T.String()).Decode((str) => str === "true").Encode((bool) => bool ? "true" : "false"),
    BOT_WEBHOOK: T.String(),
    BOT_WEBHOOK_SECRET: T.String(),
    SERVER_HOST: T.String(),
    SERVER_PORT: T.Transform(T.String()).Decode((str) => parseInt(str)).Encode((num) => num.toString()),
    BOT_ADMINS: T.Transform(T.String()).Decode((str) => JSON.parse(str)).Encode((arr) => JSON.stringify(arr))
});

export const tgEnvValidator = new StandardValidator(tgBotEnvSchema);
export type TgBotEnv = StaticDecode<typeof tgBotEnvSchema>;

export const githubEnvValidator = new StandardValidator(githubBotEnvSchema);
export type GithubBotEnv = StaticDecode<typeof githubBotEnvSchema>;

/**
 * These are the same right now but they will diverge in the future.
 */
export const env = T.Union([tgBotEnvSchema, githubBotEnvSchema])

export type Env = StaticDecode<typeof env>;
export const envValidator = new StandardValidator(env);

export function isTgBotEnv(env: any): env is TgBotEnv {
    const result = tgEnvValidator.test(env);
    if (!result) {
        const errors = Array.from(tgEnvValidator.errors(env));
        console.error(`Invalid tg bot env: `, errors);
    }

    return result;
}

export function isGithubBotEnv(env: any): env is GithubBotEnv {
    return githubEnvValidator.test(env);
}