import { Composer } from 'grammy'
import type { Context } from '#root/bot/context.js'

const composer = new Composer<Context>()

const feature = composer.chatType("supergroup")

feature.on(":forum_topic_created", async (ctx) => {
    const chatId = -1002212073342 // replace with general or dedicated channel for announcements
    const name = ctx.update.message.forum_topic_created.name
    return await ctx.api.sendMessage(chatId, `New workroom created: ${name} `)
})

export { composer as createForumsFeature }
