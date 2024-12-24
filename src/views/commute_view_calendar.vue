<template lang="pug">
	button.btns.sm(@click="router.push('/commute-save')" style="margin-bottom: 2rem;") 출퇴근 기록하기

	FullCalendar(:options="calendarOptions")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { skapi } from '@/main';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';

const router = useRouter();
const route = useRoute();

const user = ref({ 
	name: '',
	access_group: 0,
	user_id: '',
});

// FullCalendar 옵션
const calendarOptions = ref({
  plugins: [dayGridPlugin], // DayGrid 플러그인 활성화
  initialView: 'dayGridMonth', // 초기 달력 보기
  events: [],
});

let startLocalStorage;
let endLocalStorage;

onMounted(async () => {	
	try {
		const profile = await skapi.getProfile();
		console.log('profile : ', profile);

		if (profile === null) {
			console.log('로그인이 필요합니다.');
		} else {
			user.value.name = profile.name;
			user.value.access_group = profile.access_group;
			user.value.user_id = profile.user_id;
		}
	} catch (error) {
		console.error('프로필을 가져오는 중 오류 발생:', error);
	}

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
