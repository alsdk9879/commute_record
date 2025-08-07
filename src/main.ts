import "./assets/less/main.less";

import { createApp, ref } from "vue";
import App from "./App.vue";
import router from "./router";
import { Skapi } from "skapi-js";

const app = createApp(App);

const skapi = new Skapi(
    "ap21ssrro9Hqw4DDvzbj",
    "47d0592d-ab98-4b1a-b43d-2e59c73c25e3",
    { autoLogin: true },
    { hostDomain: "skapi.app", target_cdn: "d1wrj5ymxrt2ir" }
); // 개발환경 test5 계정 > service3

// const skapi = new Skapi('ap22Xhpv3l8UI7PJ0zmZ', '80b7a637-0258-4701-9cef-68ad6ed43b7f');

app.use(router);
app.mount("#app");

export { skapi };
