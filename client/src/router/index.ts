import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { public: true },
    },
    {
      path: '/auth/callback',
      component: () => import('@/views/AuthCallbackView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/views/TerminalView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/portfolio',
      component: () => import('@/views/PortfolioView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/alerts',
      component: () => import('@/views/AlertsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rooms',
      component: () => import('@/views/RoomsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/wallet',
      component: () => import('@/views/WalletView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/auth';
  if (to.path === '/auth' && auth.isAuthenticated) return '/';
});

export default router;
