import { I18n } from '@grammyjs/i18n'
import type { Context } from '#root/bot/context.js'

export const i18n = new I18n<Context>({
  defaultLocale: 'en',
  useSession: true,
  fluentBundleOptions: {
    useIsolating: false,
  },
})

export const isMultipleLocales = i18n.locales.length > 1
