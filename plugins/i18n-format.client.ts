// Drží jazyk formátování čísel (useFormat) v synchronizaci s aktivním i18n jazykem.
import { setFormatLocale } from '~/composables/useFormat'

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { locale: { value: string } }
  setFormatLocale(i18n.locale.value)
  watch(
    () => i18n.locale.value,
    (l) => setFormatLocale(l)
  )
})
