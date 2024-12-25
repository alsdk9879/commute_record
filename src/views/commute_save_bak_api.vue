<template lang="pug">
.title-wrap
	h2.title 안녕하세요. #[span.name {{ user?.name }}]님!

	.btn-wrap(style="margin-top: 0;")
		template(v-if="user?.access_group > 98")
			button.btns.sm.bg-gray(@click="router.push('/admin-commute')") 직원 출퇴근 기록 조회
		form#logout(@submit="logout")
			button.btns.sm.outline.btn-logout(type="submit") 로그아웃

.itembox
	.title-wrap(style="margin-bottom: 0;")
		h3.title 오늘의 출퇴근 기록을 남겨주세요.
		button.btns.sm.outline(@click="router.push('/commute-view-calendar')") 출퇴근 기록 캘린더
	span.today 
		.icon
			svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-clock")
		| {{ timeRecords.date }}

.itembox
	span.time 출근 : {{ timeRecords.start }}
	button.btns.sm.btn-work(@click="startWork") 출근

.itembox
	span.time 퇴근 : {{ timeRecords.end }}
	button.btns.sm.btn-work(@click="endWork") 퇴근

.itembox
	span.title(style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem; display: inline-block;") 이전 출퇴근 기록
	.table-wrap
		table.table.tb-commute-record
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
import { ref, onMounted, createStaticVNode } from 'vue';
import { skapi } from '@/main';
import { getDate, getTime } from '@/utils/time';
import { getUserInfo, getUserList } from '@/hooks/getUser';
import { getUserWorkList, createStartWork, addStartWork } from '@/hooks/getWorkList';
  
const router = useRouter();
const route = useRoute();

const commuteRecords = ref([]);
const timeRecords = ref({
	start: '',
	end: '',
	date: '',
});
const user = ref(null);

let userLocalStorage = JSON.parse(window.localStorage.getItem('usersInfo')) || [];
let startLocalStorage;
let endLocalStorage;

// 출근시간 기록
const startWork = async () => {
	const date = '2024-12-28';
	// const date = getDate();
	const time = getTime();

	timeRecords.value.date = date;

	startLocalStorage = JSON.parse(window.localStorage.getItem('startTime')) || [];

	if (!startLocalStorage.some(record => record.start === date && record.user_id === user.value.user_id)) {	// .some() : 배열의 특정 조건을 만족하는 요소가 있는지 확인
		timeRecords.value.start = time;

		const newEvent = {
			title: `출근 : ${time}`,
			start: date,
			end: date,
			backgroundColor: '#087c08',
			date: date,
			startWork: time,
			endWork: '',
			user_id: user.value.user_id
		};	// fullCalendar에 사용되는 옵션도 포함
		startLocalStorage.push(newEvent);

		// 같은 날짜에 대한 출근 시간 추가
		let dateFound = false; // 날짜가 이미 존재하는지 체크하는 변수

		// for (let i = 0; i < commuteRecords.value.length; i++) {
		// 	if (commuteRecords.value[i].date === date) {
		// 		// 같은 날 퇴근 시간에 출근 시간 추가
		// 		commuteRecords.value[i].startWork = time; 
		// 		dateFound = true; // 날짜가 존재함을 표시
		// 		break; // 날짜가 발견되면 루프 종료
		// 	}
		// }

		// 만약 오늘과 다른 날짜가 되었다면
		if (!dateFound) {
			commuteRecords.value.push(newEvent); // 새로운 날짜에 대한 출근 시간 추가
		}

		// window.localStorage.setItem('startTime', JSON.stringify(startLocalStorage));

		const data = {
		    startWork: [...startLocalStorage]
		}

		const workList = window.localStorage.getItem('startTime');

		console.log('== workList == : ', workList)

		if (!workList) {
			await createStartWork({ data, user_id: user.user_id })
		} else {
			await addStartWork({ data })
		}
		
	} else {
		alert('출근 시간이 이미 기록되어 있습니다.');
		return;
	}
}

// 퇴근시간 기록
const endWork = () => {
	const date = '2024-12-28';
	// const date = getDate();
	const time = getTime();

	timeRecords.value.date = date;

	// 만약 직원이 직접 출근 시간을 기록하지 않았다면
	if (!startLocalStorage.some(record => record.start === date && record.user_id === user.value.user_id)) {
		alert('출근 시간이 기록되지 않았습니다. 출근시간을 먼저 기록해주세요.');
		return;
	}

	endLocalStorage = JSON.parse(window.localStorage.getItem('endTime')) || [];

	if (!endLocalStorage.some(record => record.end === date && record.user_id === user.value.user_id)) {
		timeRecords.value.end = time;

		const newEvent = { 
			title: `퇴근 : ${time}`, 
			start: date, 
			end: date,
			backgroundColor: '#c01515', 
			date: date, 
			startWork: '', 
			endWork: time, 
			user_id: user.value.user_id 
		};	// fullCalendar에 사용되는 옵션도 포함
		endLocalStorage.push(newEvent);

		// 같은 날짜에 대한 퇴근 시간 추가
		let dateFound = false; // 날짜가 이미 존재하는지 체크하는 변수

		for (let i = 0; i < commuteRecords.value.length; i++) {
			if (commuteRecords.value[i].date === date) {
				commuteRecords.value[i].endWork = time; // 같은 날 출근 시간에 퇴근 시간 추가
				dateFound = true;
				break;
			}
		}

		// 만약 오늘과 다른 날짜가 되었다면
		if (!dateFound) {
			commuteRecords.value.push(newEvent); // 새로운 날짜에 대한 퇴근 시간 추가
		}

		window.localStorage.setItem('endTime', JSON.stringify(endLocalStorage));

		// const data = {
		// 	endWork: endLocalStorage
		// }

		// const config = {
		// 	table: 'my_endtWork_time',
		// 	access_group: 99,
		// 	record_id: user.user_id
		// }

		// skapi.postRecord(data, config).then(record=>{
		// 	console.log('퇴근 === postRecord === record : ', record);
		// });
	} else {
		alert('퇴근 시간이 이미 기록되어 있습니다.');
		return;
	}
}



// 로그아웃
const logout = async () => {
	try {
		await skapi.logout();
		router.push('/');
		// window.localStorage.clear();
	} catch (error) {
		console.error('로그아웃 중 오류 발생:', error);
	}
};

// 출퇴근 시간 기록 저장
const onRecord = () => {
	startLocalStorage = JSON.parse(window.localStorage.getItem('startTime')) || [];
	endLocalStorage = JSON.parse(window.localStorage.getItem('endTime')) || [];

	// 만약 출근시간 기록이 있다면
	if (startLocalStorage.length > 0) {
		const startFilter = startLocalStorage.filter((item) => item.user_id === user.value.user_id);	// 현재 사용자 출근시간 필터

		startFilter.forEach((item) => {
			console.log('item : ', item);
			if (item.date === timeRecords.value.date) {
				timeRecords.value.start = item.title.replace('출근 : ', '');	// 오늘의 출근시간 기록
			}
		});
		commuteRecords.value = startLocalStorage;

		// 만약 날짜가 바뀌었다면 출근시간 초기화
		if ((startLocalStorage[startLocalStorage.length - 1].date !== timeRecords.value.date) && startLocalStorage.user_id !== user.value.user_id) {
			timeRecords.value.start = '';
		}
	}

	// 만약 퇴근시간 기록이 있다면
	if (endLocalStorage.length > 0) {
		const endFilter = endLocalStorage.filter((item) => item.user_id === user.value.user_id);

		endFilter.forEach((item) => {
			if (item.date === timeRecords.value.date) {
				timeRecords.value.end = item.title.replace('퇴근 : ', '');	// 오늘의 퇴근시간 기록
			}
		});

		// 출근시간만 찍고 퇴근은 안 찍었을 수 있으니까, 출퇴근 시간 매칭
		commuteRecords.value.forEach(item => {
			endFilter.forEach(endItem => {
				if (item.date === endItem.date) {
					item.endWork = endItem.endWork;
				}
			});
		});

		// for (let i = 0; i < commuteRecords.value.length; i++) {
		// 	const originDate = commuteRecords.value[i].date;

		// 	for (let j = 0; j < endLocalStorage.length; j++) {
		// 		const endDate = endLocalStorage[j].date;

		// 		if (originDate === endDate && commuteRecords.value[i].user_id === endLocalStorage[j].user_id) {
		// 			commuteRecords.value[i].endWork = endLocalStorage[j].endWork;
		// 			break;	
		// 		} else {
		// 			commuteRecords.value[i].endWork = '';	// 출근만 찍고 퇴근은 안 찍었을 때
		// 		}
		// 	}
		// }

		// 만약 날짜가 바뀌었다면 퇴근시간 초기화
		if ((endLocalStorage[endLocalStorage.length - 1].date !== timeRecords.value.date) && startLocalStorage.user_id !== user.value.user_id) {
			timeRecords.value.end = '';
		}
	}
}

onMounted(async () => {
	// timeRecords.value.date = getDate();
	timeRecords.value.date = '2024-12-28';

  const res = await getUserInfo();

	if (!res) return;
	user.value = res;

	if(user.value.access_group > 98 && userLocalStorage.length === 0) {
		const res = await getUserList();
	}

	onRecord();
	startLocalStorage = startLocalStorage.filter((item) => item.user_id === user.value.user_id);
	commuteRecords.value = startLocalStorage;

	console.log('startLocalStorage : ', startLocalStorage);	
});

onMounted(async () => {
	const workList = await getUserWorkList();

	if (!workList) return;

	window.localStorage.setItem('startTime', JSON.stringify(workList));
})
</script>

<style scoped lang="less">
.title {
	word-break: keep-all;
	line-height: 1.2;

	.name {
		color: #2c3e50;
		font-weight: 900;
	}
}

.itembox {
		box-shadow: 1px 1px 10px 0px rgba(0, 0, 0, 0.15);
    border-radius: 16px;
    padding: 1.5rem;
    margin-top: 1.5rem;
		line-height: 1.2;

		.time {
			display: inline-block;
			width: 100%;
			font-size: 1.25rem;
			font-weight: 600;
			color: #2c3e50;
			border-bottom: 1px solid #ccc;
			padding-bottom: 1.5rem;
		}

		.btn-work {
			width: 100%;
			margin-top: 1.5rem;
		}
}

.today {
	font-size: 1rem;
	color: #777;
	margin-top: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.25rem;
}
</style>
