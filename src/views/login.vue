<template lang="pug">
	h2 로그인

	br
	br
	br

	form#login(@submit.prevent="login")
		label
			span 이메일
			input.email(type="email" name="email" placeholder="user@email.com" required)

		label
			span 비밀번호
			input.password(type="password" name="password" placeholder="At least 6 characters" minlength="6" required)

		label
			span 이름
			input.name(type="text" name="name" placeholder="name" required)

		input(type="submit" value="Login")

	router-link(to="/signup") 회원가입

</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onUnmounted, onMounted, nextTick, watch, computed } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();

const login = async (event) => {
    const email = event.target.elements.email.value;
    const password = event.target.elements.password.value;
    const name = event.target.elements.name.value;

	const parms = {
		email: email,
		password: password,
		name: name,
	};
    
    try {
        const res = await skapi.login(parms);
        console.log(res);
        router.push('/commute-save');
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    }
}
</script>

<style scoped lang="less">

</style>
