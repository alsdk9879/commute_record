import "./assets/less/main.less";

import { createApp, ref } from "vue";
import App from "./App.vue";
import router from "./router";
import { Skapi } from "skapi-js";

const app = createApp(App);

// const skapi = new Skapi(
//     "ap21st4xzXoHhiOdvzbj",
//     "47d0592d-ab98-4b1a-b43d-2e59c73c25e3",
//     { autoLogin: true },
//     { hostDomain: "skapi.app", target_cdn: "d1wrj5ymxrt2ir" }
// ); // 개발환경 test5 계정 > service4

const skapi = new Skapi(
    "ap21tePv6xlhOycziifn",
    "62f7c0be-31f5-45a7-8e6c-dd0bf99c874e",
    { autoLogin: true },
    { hostDomain: "skapi.app", target_cdn: "d1wrj5ymxrt2ir" }
); // 개발환경 test1 계정 > test03_delete+7 서비스

// const skapi = new Skapi('ap22Xhpv3l8UI7PJ0zmZ', '80b7a637-0258-4701-9cef-68ad6ed43b7f');

app.use(router);
app.mount("#app");

export { skapi };
