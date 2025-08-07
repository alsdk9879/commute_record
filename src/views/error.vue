<template lang="pug">
#error
    h2.title 404 페이지를 찾을 수 없습니다.
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { skapi } from "@/main";

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">
.title {
    text-align: center;
    padding-bottom: 2rem;
    border-bottom: 1px solid #ccc;
}
</style>
