<template lang="pug">
h2 {{ user[0]?.name }}님의 출퇴근 기록 조회

button.btns(@click="router.push('/admin-commute')") 이전

table.table.tb-admin-commute-record
	colgroup
		col(style="width: 10%")
		col(style="width: 10%")
		col(style="width: 10%")

	thead
		tr
			th 날짜
			th 출근시간
			th 퇴근시간

	tbody
		tr(v-for="record in originTimeRecords")
			td.date {{ record.date }}
			td.start-time {{ record.startWork }}
			td.end-time {{ record.endWork }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onUnmounted, onMounted, nextTick, watch, computed } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();
const userId = route.params.userId;

const user = ref({});
const originTimeRecords = ref([]);

let startLocalStorage;
let endLocalStorage;


onMounted(() => {
	const getUser = JSON.parse(window.localStorage.getItem('usersInfo'));
	user.value = getUser.filter((item) => item.user_id === userId);

	startLocalStorage = JSON.parse(window.localStorage.getItem('startTime')) || [];
	startLocalStorage = startLocalStorage.filter((item) => item.user_id === userId);

	endLocalStorage = JSON.parse(window.localStorage.getItem('endTime')) || [];
	endLocalStorage = endLocalStorage.filter((item) => item.user_id === userId);

	console.log('=== startLocalStorage ===', startLocalStorage);
	console.log('=== endLocalStorage ===', endLocalStorage);

	for(let i = 0; i < startLocalStorage.length; i++) {
		const startDate = startLocalStorage[i].date;

		for(let j = 0; j < endLocalStorage.length; j++) {
			const endDate = endLocalStorage[j].date;

			if(startDate === endDate) {
				startLocalStorage[i].endWork = endLocalStorage[j].endWork;
			}
		}
	}

	originTimeRecords.value = startLocalStorage;
});

</script>

<style scoped lang="less">
.table {
	td {
		text-align: center;
	}
}
</style>
