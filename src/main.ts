#!/usr/bin/env tsx

import process from 'node:process'
import { type RunnerHandle, run } from '@grammyjs/runner'
import { logger } from '#root/logger.js'
import { createBot } from '#root/bot/index.js'
import { createServer } from '#root/server/index.js'
import { Context } from './types'


// might be able to use this is in a workflow
// async function startPolling(config: PollingConfig) {
//   const bot = createBot(config.botToken, {
//     config,
//     logger,
//   })
//   let runner: undefined | RunnerHandle

//   // graceful shutdown
//   onShutdown(async () => {
//     logger.info('Shutdown')
//     await runner?.stop()
//   })

//   await Promise.all([
//     bot.init(),
//     bot.api.deleteWebhook(),
//   ])

//   // start bot
//   runner = run(bot, {
//     runner: {
//       fetch: {
//         allowed_updates: config.botAllowedUpdates,
//       },
//     },
//   })

//   logger.info({
//     msg: 'Bot running...',
//     username: bot.botInfo.username,
//   })
// }

async function startWebhook(config: Context["env"]) {
  const bot = createBot(config.BOT_TOKEN, {
    config,
    logger,
  })
  const server = createServer({
    bot,
    config,
    logger,
  })
  const serverManager = createServerManager(server, {
    host: config.serverHost,
    port: config.serverPort,
  })

  // graceful shutdown
  onShutdown(async () => {
    logger.info('Shutdown')
    await serverManager.stop()
  })

  // to prevent receiving updates before the bot is ready
  await bot.init()

  // start server
  const info = await serverManager.start()
  logger.info({
    msg: 'Server started',
    url: info.url,
  })

  // set webhook

  logger.info({
    msg: 'Webhook was set',
    url: config.botWebhook,
  })
}

try {
  if (config.isWebhookMode)
    await startWebhook(config)
  else if (config.isPollingMode)
    await startPolling(config)
}
catch (error) {
  logger.error(error)
  process.exit(1)
}

// Utils

function onShutdown(cleanUp: () => Promise<void>) {
  let isShuttingDown = false
  const handleShutdown = async () => {
    if (isShuttingDown)
      return
    isShuttingDown = true
    await cleanUp()
  }
  process.on('SIGINT', handleShutdown)
  process.on('SIGTERM', handleShutdown)
}
