import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/login.vue';
import Signup from '@/views/signup.vue';
import Confirm from '@/views/confirmation_required.vue';
import CommuteSave from '@/views/commute_save.vue';
import AdminCommute from '@/views/admin_commute.vue';
import AdminCommuteDetail from '@/views/admin_commute_detail.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
    },
    {
      path: '/signup',
      name: 'signup',
      component: Signup,
    },
    {
      path: '/confirmation-required',
      name: 'confirmation-required',
      component: Confirm,
    },
    {
      path: '/commute-save',
      name: 'commute-save',
      component: CommuteSave,
    },
    {
      path: '/commute-view-calendar',
      name: 'commute-view-calendar',
      component: () => import('@/views/commute_view_calendar.vue'),
    },
    {
      path: '/admin',
      children: [
        {
          path: '/admin-commute',
          name: 'admin-commute',
          component: AdminCommute,
        },
        {
          path: '/admin-commute-detail/:userId',
          name: 'admin-commute-detail',
          component: AdminCommuteDetail,
        },
      ],
    },
  ],
});

export default router;
