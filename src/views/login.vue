<template lang="pug">
#login
	h2.title 로그인

	form#loginForm(@submit.prevent="login")
		label.input-wrap
			span.label 이메일
			input.input.email(type="email" name="email" placeholder="user@email.com" required)

		label.input-wrap
			span.label 비밀번호
			input.input.password(type="password" name="password" placeholder="At least 6 characters" minlength="6" required)

		.btn-wrap
			router-link.btn-join(to="/signup") 회원가입
			button.btns.btn-login(type="submit") 로그인
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();

const login = async (event) => {
    const email = event.target.elements.email.value;
    const password = event.target.elements.password.value;

	const parms = {
		email: email,
		password: password,
		name: name,
	};
    
    try {
        const res = await skapi.login(parms);
        router.push('/commute-save');
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    }
}
</script>

<style scoped lang="less">
#login {
	max-width: 500px;
	margin: 0 auto;
	padding: 5rem 0;
}

.title {
	text-align: center;
	padding-bottom: 2rem;
	border-bottom: 1px solid #ccc;
}

#loginForm {
	margin-top: 2rem;

	.btn-wrap {
		justify-content: space-between;
	}

	.btn-join {
		color: #2c3e50;
		margin-left: auto;
		margin-right: 1rem;

		&:hover {
			text-decoration: underline;
		}
	}
}
</style>
