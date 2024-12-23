import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { Skapi } from 'skapi-js';

const app = createApp(App);

// const skapi = new Skapi(
//   'ap21XhrgjG0KlulkR98Z',
//   'f498d188-1fa5-43e5-a32d-904d3e125983',
//   { autoLogin: true },
//   { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
// );

const skapi = new Skapi('ap22Xhpv3l8UI7PJ0zmZ', '80b7a637-0258-4701-9cef-68ad6ed43b7f');

app.use(router);
app.mount('#app');

export { skapi };
