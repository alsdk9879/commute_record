<template lang="pug">
	button.btns.sm(@click="router.push('/commute-save')" style="margin-bottom: 2rem;") 출퇴근 기록하기

	FullCalendar(:options="calendarOptions")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { skapi } from '@/main';
import { getUserInfo } from '@/hooks/getUser';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';

const router = useRouter();
const route = useRoute();

const user = ref(null);

// FullCalendar 옵션
const calendarOptions = ref({
  plugins: [dayGridPlugin], // DayGrid 플러그인 활성화
  initialView: 'dayGridMonth', // 초기 달력 보기
  events: [],
});

let startLocalStorage;
let endLocalStorage;

onMounted(async () => {	
	const res = await getUserInfo();
	user.value = res;

	if((window.localStorage.getItem('startTime') || window.localStorage.getItem('endTime'))) {
		startLocalStorage = JSON.parse(window.localStorage.getItem('startTime'));
		endLocalStorage = JSON.parse(window.localStorage.getItem('endTime'));

		let startEvents = [];
		let endEvents = [];

		if (startLocalStorage) {
			startEvents = startLocalStorage.filter(item => item.user_id === user.value.user_id);
		}

		if (endLocalStorage) {
			endEvents = endLocalStorage.filter(item => item.user_id === user.value.user_id);
		}

		// fullcalendar event 출퇴근 시간 결합
		calendarOptions.value.events = startEvents.concat(endEvents);
	}
});
</script>

<style scoped lang="less">

</style>
