import type { MiddlewareHandler } from 'hono'
import type { Logger } from '#root/logger.js'

export function setLogger(logger: Logger): MiddlewareHandler {
  return async (c, next) => {
    c.set(
      'logger',
      logger
    )

    await next()
  }
}
