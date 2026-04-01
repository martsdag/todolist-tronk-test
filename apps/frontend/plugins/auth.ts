export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const tokenRef = ref<string | null>(
    import.meta.client ? localStorage.getItem('access_token') : null
  );

  const token = computed({
    get: () => tokenRef.value,
    set: (value: string | null) => {
      if (value) {
        localStorage.setItem('access_token', value);
        tokenRef.value = value;
      } else {
        localStorage.removeItem('access_token');
        tokenRef.value = null;
      }
    }
  });

  const login = async (credentials: { email: string; password: string }) => {
    const response = await $fetch<{ message: string; user: { token: string; user: object } }>('/auth/login', {
    method: 'POST',
    body: credentials,
    baseURL: config.public.apiBase,
    });

    token.value = response.user.token; 
    await navigateTo('/');
  };

  const logout = () => {
    token.value = null;
    navigateTo('/login');
  };

  return {
    provide: {
      auth: { login, logout, token }
    }
  };
});