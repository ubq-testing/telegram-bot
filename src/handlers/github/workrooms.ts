import { getTelegramBot } from "#root/utils/get-telegram-bot.js";
import { Context } from "../../types";

export async function createChatroom(context: Context) {
    const { env, logger, config } = context;
    const { bot } = await getTelegramBot(env);
    const title = context.payload.issue.title

    logger.info(`Creating chatroom for issue ${title}`);

    let forum;
    try {
        forum = await bot.api?.createForumTopic(config.supergroupChatId, title);
        logger.info(`Created chatroom for issue ${title}: ${forum?.message_thread_id}`);
    } catch (er) {
        logger.error(`Failed to create chatroom for issue ${title}`, { er });
    }

    return forum;
}

