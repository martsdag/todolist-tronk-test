export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp();
  const config = useRuntimeConfig();

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest ({ request, options, error }) {

      if (nuxtApp.$auth.token.value) {
        options.headers.set('Authorization', `Bearer ${nuxtApp.$auth.token.value}`);
      }
    },
    async onResponseError ({ response }) {
      if (response.status === 401) {
        await nuxtApp.runWithContext(() => navigateTo('/login'))
      }
    },
  })

  return {
    provide: {
      api,
    },
  }
})