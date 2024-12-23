<template lang="pug">
    h2 회원가입

    form#signup(@submit.prevent="signup")
        label
            span 이메일
            input.email(type="email" name="email" placeholder="user@email.com" required)

        label
            span 비밀번호
            input.password(type="password" name="password" placeholder="At least 6 characters" minlength="6" required)

        label
            span 이름
            input.name(type="text" name="name" placeholder="name" required) 

        input(type="submit" value="Sign-Up")
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
        // console.log(res);
        alert('Signup confirmation e-mail has been sent');
        router.push('/confirmation-required');
    } catch (error) {
        console.error('Signup failed:', {error});
        alert('Signup failed. Please try again.');
    }
}
</script>

<style scoped lang="less">

</style>
