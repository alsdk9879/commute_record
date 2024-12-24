<template lang="pug">
	.main
		router-view
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

</script>

<style scoped lang="less">
.main {
	width: 100%;
	max-width: 880px;
	padding: 3rem 2rem;
	margin: 0 auto;
}
</style>
