<template lang="pug">
	h2 Signup confirmation is required
	p Please check your e-mail to complete the process.

	p Did not get the e-mail?
		button.btns(@click="resend") 이메일 재전송

	router-link(to="/") 로그인
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onUnmounted, onMounted, nextTick, watch, computed } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();

const resend = () => {
	skapi.resendSignupConfirmation().then(() => {
		alert('Signup confirmation e-mail has been sent');
		this.disabled = true;
	}).catch(err => {
		alert(err.message);
	});
}
</script>

<style scoped lang="less">

</style>
