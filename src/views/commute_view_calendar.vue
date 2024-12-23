<template lang="pug">
	//- button.btns.btn-start-work(@click="startWork") 출근
	//- button.btns.btn-end-work(@click="endWork") 퇴근

	button.btns(@click="router.push('/commute-save')") 출퇴근 기록하기

	FullCalendar(:options="calendarOptions")
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onUnmounted, onMounted, nextTick, watch, computed } from 'vue';
import { skapi } from '@/main';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';

const router = useRouter();
const route = useRoute();

const originTimeRecords = ref({});
const timeRecords = ref({
	title: '',
	start: '',
	end: '',
	backgroundColor: '',
	date: '',
	startTime: '',
	endTime: '',
});
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

// 날짜 가져오기
const today = new Date(); // 오늘 날짜
// const year = today.getFullYear(); // 년
// const month = (today.getMonth() + 1).toString().padStart(2, '0'); // 월 / padStart(2, '0') : 문자열 길이가 2보다 작으면 앞에 '0'을 채움.
// const day = today.getDate().toString().padStart(2, '0'); // 일
// const yyyymmdd = `${year}-${month}-${day}`;

const tomorrow = new Date(today.setDate(today.getDate() + 1)); // 내일 날짜
const year = tomorrow.getFullYear(); // 년
const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0'); // 월 / padStart(2, '0') : 문자열 길이가 2보다 작으면 앞에 '0'을 채움.
const day = tomorrow.getDate().toString().padStart(2, '0'); // 일
const tomorrowYyyymmdd = `${year}-${month}-${day}`;

const getDate = () => {
	const date = new Date();
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
};

// 시간 가져오기
const getTime = () => {
	const date = new Date();
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
};

// 출근시간 기록
const startWork = () => {
	const date = getDate();
	// const date = '2024-12-21';
	const time = getTime();

	if((!startLocalStorage || !startLocalStorage.includes(date))) {
		const newEvent = { title: `출근 : ${time}`, start: date, end: date, backgroundColor: '#087c08' };
		calendarOptions.value.events.push(newEvent); // 기존 캘린더 이벤트 배열에 추가

		const arrNewEvent = calendarOptions.value.events;
		const filters = arrNewEvent.filter((item) => {return item.title.includes('출근')});

		window.localStorage.setItem('startTime', JSON.stringify(filters));
		startLocalStorage = window.localStorage.getItem('startTime');	
	} else {
		alert('출근 시간이 이미 기록되어 있습니다.');
		return;
	}
};

// 퇴근시간 기록
const endWork = () => {
	const date = getDate();
	// const date = '2024-12-21';
	const time = getTime();

	// 만약 직원이 직접 출근 시간을 기록하지 않았다면
	if(!startLocalStorage || !startLocalStorage.includes(date)) {
		alert('출근 시간이 기록되지 않았습니다.');
		return;
	}

	if(!endLocalStorage || (!endLocalStorage.includes(date))) {
		const newEvent = { title: `퇴근 : ${time}`, start: date, end: date, backgroundColor: '#c01515' };
		calendarOptions.value.events.push(newEvent); // 기존 캘린더 이벤트 배열에 추가

		const arrNewEvent = calendarOptions.value.events;
		const filters = arrNewEvent.filter((item) => {return item.title.includes('퇴근')});

		window.localStorage.setItem('endTime', JSON.stringify(filters));
		endLocalStorage = window.localStorage.getItem('endTime');
	} else {
		alert('퇴근 시간이 이미 기록되어 있습니다.');
	}
}

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
.btns {
	outline: none;
	border: none;
	cursor: pointer;
	height: 36px;
	padding: 0 24px;
	border-radius: 4px;
	background-color: #eee;
	margin-right: 8px;
	margin-bottom: 24px;

	&:hover {
		background-color: #ddd;
	}
}

.tb-commute-record {
	td {
		text-align: center;
	}
}
</style>
