<template lang="pug">
#signup
    h2.title 회원가입

    form#signupForm(@submit.prevent="signup")
        label.input-wrap
            span.label 이메일
            input.input.email(type="email" name="email" placeholder="user@email.com" required)

        label.input-wrap
            span.label 비밀번호
            input.input.password(type="password" name="password" placeholder="At least 6 characters" minlength="6" required)

        label.input-wrap
            span.label 이름
            input.input.name(type="text" name="name" placeholder="name" required) 

        .btn-wrap
            button.btns.bg-gray.btn-prev(@click="router.go(-1)") 이전
            button.btns.btn-signup(type="submit") 회원가입
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();

const signup = async (event) => {
    const email = event.target.elements.email.value;
    const password = event.target.elements.password.value;
    const name = event.target.elements.name.value;

	const parms = {
		email: email,
		password: password,
		name: name,
	};
    
    try {
        const res = await skapi.signup(parms);
        alert('회원가입이 완료되었습니다.');
        router.push('/confirmation-required');
    } catch (error) {
        console.error('회원가입 실패 : ', {error});
        alert('회원가입에 실패하였습니다. 다시 시도해주세요.');
    }
}
</script>

<style scoped lang="less">
#signup {
    max-width: 500px;
    margin: 0 auto;
    padding: 5rem 0;
}

.title {
	text-align: center;
	padding-bottom: 2rem;
	border-bottom: 1px solid #ccc;
}

#signupForm {
	margin-top: 2rem;

    .btn-wrap {
		justify-content: space-between;
	}

    .btn-signup {
        margin-left: auto;
    }
}
</style>
