<template lang="pug">
.title-wrap
	h2 직원 출퇴근 기록 조회
	button.btns.sm(@click="router.push('/commute-save')") 내 출퇴근 기록 조회

.table-wrap
	table.table.tb-admin-commute-record
		colgroup
			col(style="width: 10%")
			col(style="width: 10%")
			col(style="width: 10%")

		thead
			tr
				th NO
				th 이름
				th 이메일

		tbody
			tr(v-for="(user, index) in user" @click.stop="(e) => goToEditEmp(e, user.user_id)")
				td {{ index + 1 }}
				td {{ user.name }}
				td {{ user.email }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

const router = useRouter();
const route = useRoute();

const user = ref({});

const goToEditEmp = (e, userId) => {
	router.push({ name: 'admin-commute-detail', params: { userId } });
};

onMounted(() => {
	const getUser = JSON.parse(window.localStorage.getItem('usersInfo'));
	user.value = getUser.filter((item) => item.access_group < 99);
});
</script>

<style scoped lang="less">
.table {
	tbody {
		tr {
			cursor: pointer;
	
			&:hover {
				background-color: #2c3e5017;
			}
		}
	}
}
</style>
