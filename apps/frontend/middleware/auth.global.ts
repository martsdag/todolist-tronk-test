export default defineNuxtRouteMiddleware((to) => {
  const { $auth } = useNuxtApp();
  
  const publicRoute = '/login';
  
  if ($auth.token.value || to.path === publicRoute) {
    return
  }
  
  return navigateTo('/login');
});