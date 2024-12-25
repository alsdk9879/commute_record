<template lang="pug">
.title-wrap
	h2 {{ user[0]?.name }}님의 출퇴근 기록 조회
	button.btns.sm.bg-gray(@click="router.push('/admin-commute')") 이전

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
		tr(v-for="record in commuteRecords")
			td.date {{ record.date }}
			td.start-time {{ record.startWork }}
			td.end-time {{ record.endWork }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

const router = useRouter();
const route = useRoute();
const userId = route.params.userId;

const user = ref({});
const commuteRecords = ref([]);

let startLocalStorage;
let endLocalStorage;

onMounted(() => {
	const getUser = JSON.parse(window.localStorage.getItem('usersInfo'));	// 사용자 정보 가져오기
	user.value = getUser.filter((item) => item.user_id === userId);	// 선택한 해당 사용자 정보 가져오기

	startLocalStorage = JSON.parse(window.localStorage.getItem('startTime')) || [];	// 출근 시간 가져오기
	startLocalStorage = startLocalStorage.filter((item) => item.user_id === userId);	// 선택한 사용자의 출근 시간만 필터링

	endLocalStorage = JSON.parse(window.localStorage.getItem('endTime')) || [];
	endLocalStorage = endLocalStorage.filter((item) => item.user_id === userId);

	// 출퇴근 시간 비교해서 같은 날짜의 데이터를 찾아서 저장
	startLocalStorage.forEach(startItem => {
		const startDate = startItem.date;

		endLocalStorage.forEach(item => {
			const endDate = item.date;

			if(startDate === endDate) {
				// item.startWork = item.start;
				startItem.endWork = item.endWork;
			}
		});
	});

	// for(let i = 0; i < startLocalStorage.length; i++) {
	// 	const startDate = startLocalStorage[i].date;

	// 	for(let j = 0; j < endLocalStorage.length; j++) {
	// 		const endDate = endLocalStorage[j].date;

	// 		if(startDate === endDate) {
	// 			startLocalStorage[i].endWork = endLocalStorage[j].endWork;
	// 		}
	// 	}
	// }

	commuteRecords.value = startLocalStorage;
});

</script>

<style scoped lang="less">
.table {
	td {
		text-align: center;
	}
}
</style>
