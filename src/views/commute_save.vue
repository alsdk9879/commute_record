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
		//- button.btns.sm.outline(@click="router.push('/commute-view-calendar')") 출퇴근 기록 캘린더
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
				//- col(style="width: 10%")

			thead
				tr
					th 날짜
					th 출근시간
					th 퇴근시간
					//- th 근무시간

			tbody
				tr(v-for="record in commuteRecords")
					td.date {{ record.date }}
					td.start-time {{ record.startWork }}
					td.end-time {{ record.endWork }}
					//- td.work-time {{ record.workTime }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { skapi } from '@/main';
import { getDate, getTime } from '@/utils/time';
import { getUserInfo, getUserList } from '@/hooks/getUser';

// : 마스터가 default 출퇴근 시간 설정 가능.
// : 직원이 출근 (최초 1회만 기록됨) 찍고, 이후 16시간동안은 퇴근 여러번 찍어도 마지막 퇴근기록만 기록됨.
//     (하루 기준을 날짜로 정하지 않고, 출근기록으로부터 16시간동안으로 생각하면 됨.)
// : 만약 직원이 default 출근시간 내에 안 찍었으면, 출근은 지각처리됨.
// : 만약 직원이 default 퇴근시간 내에 안 찍었을 경우, 공백으로 처리됨.
// : 만약 출퇴근 둘 다 안 찍었을 경우, 공백으로 남겨둠.

// (상황 예시)
// : 마스터가 default 출퇴근 시간으로 출근: 8~10시 / 퇴근: 17~19시 설정해둠.
// : 직원이 12/26 10시 출근 찍고, 이후 12/27 02시까지는 퇴근 여러번 찍어도 마지막 퇴근기록만 기록됨. (하루 근무 기준)
// : 만약 직원이 8~10시 내에 출근 안 찍었으면, ‘지각’으로 처리됨.
// : 만약 직원이 12/26 17~19시 내에 안 찍었을 경우, 공백으로 처리됨. (대신 출근시간이후부터 16시간동안은 퇴근 언제든 찍기 가능.)
// : 만약 출퇴근 둘 다 안 찍었을 경우, 공백으로 남겨둠.
  
const router = useRouter();
const route = useRoute();

const user = ref({});
const commuteRecords = ref([]);
const timeRecords = ref({
	start: '',
	end: '',
	date: '',
});
// 마스터가 정한 기본 출퇴근 시간 (시간은 임시작성)
const defaultCommute = ref({
	minStart: '08:00:00',
	maxStart: '10:00:00',
	minEnd: '17:00:00',
	maxEnd: '19:00:00'
});

let userLocalStorage = JSON.parse(window.localStorage.getItem('usersInfo')) || [];	// 직원 정보 저장
let commuteLocalStorage;	// 직원별 출퇴근 정보 저장소

// 출근시간 기록
const startWork = () => {
	// const date = getDate();
	const time = getTime();
	const date = '2024-12-26';
	// const time = '08:23:00';

	timeRecords.value.date = date;

	commuteLocalStorage = JSON.parse(window.localStorage.getItem(`commuteRecords : ${user.value.user_id}`)) || [];

	if(commuteLocalStorage.length === 0 || !commuteLocalStorage.find(record => record.date === date)) {
		timeRecords.value.start = time;

		const newEvent = {
			date: date,
			startWork: time,
			endWork: '',
			// user_id: user.value.user_id,
			// 이하 fullCalendar에 사용되는 옵션 (캘린더 사용 안할 시 삭제)
			// title: `출근 : ${time}`,
			// start: date,
			// end: date,
			// backgroundColor: '#087c08',
		};	
		commuteLocalStorage.push(newEvent);

		let dateFound = false; // 날짜가 이미 존재하는지 체크하는 변수

		// 만약 오늘과 다른 날짜가 되었다면
		if (!dateFound) {
			commuteRecords.value.push(newEvent); // 새로운 날짜에 대한 출근 시간 추가
		}

		window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
	} 
	else {
		alert('출근시간이 이미 기록되어 있습니다.');
		return;
	}
}

// 퇴근시간 기록
const endWork = () => {
	// const date = getDate();
	// const time = getTime();
	const date = '2024-12-26';
	const time = '23:56:23';

	timeRecords.value.date = date;

	// 만약 직원이 출근시간을 기록하지 않았다면
	if(commuteLocalStorage.length === 0 || !commuteLocalStorage.find(record => record.date === date)) {
		alert('출근시간이 기록되지 않았습니다. 출근시간을 먼저 기록해주세요.');
		return;
	}

	// if (!startLocalStorage.some(record => record.start === date && record.user_id === user.value.user_id)) {
	// 	alert('출근시간이 기록되지 않았습니다. 출근시간을 먼저 기록해주세요.');
	// 	return;
	// }

	// endLocalStorage = JSON.parse(window.localStorage.getItem('endTime')) || [];

	

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

		// 같은 날짜에 대한 퇴근시간 추가
		let dateFound = false; // 날짜가 이미 존재하는지 체크하는 변수

		for (let i = 0; i < commuteRecords.value.length; i++) {
			if (commuteRecords.value[i].date === date) {
				commuteRecords.value[i].endWork = time; // 같은 날 출근시간에 퇴근시간 추가
				dateFound = true;
				break;
			}
		}

		// 함수 사용 참고
		// let wt = workTime(newEvent); // 00시간 00분
		// newEvent.workTime = wt;

		// 만약 오늘과 다른 날짜가 되었다면
		if (!dateFound) {
			commuteRecords.value.push(newEvent); // 새로운 날짜에 대한 퇴근시간 추가
		}

		window.localStorage.setItem('endTime', JSON.stringify(endLocalStorage));
	} else {
		alert('퇴근시간이 이미 기록되어 있습니다.');
		return;
	}

}

// 일일 근무시간 기록
// const workTime = (item) => {
// 	let workTime = ''
// 	// commuteRecords.value.forEach(item => {
// 		console.log('item : ', item);
// 		const start = item.startWork.split(':');
// 		const end = item.endWork.split(':');
// 		const startHour = parseInt(start[0]);
// 		const startMin = parseInt(start[1]);
// 		const endHour = parseInt(end[0]);
// 		const endMin = parseInt(end[1]);
// 		const workHour = endHour - startHour;
// 		const workMin = endMin - startMin;

// 		console.log('workHour : ', workHour);

// 		workTime = `${workHour}시간 ${workMin}분`;
// 	// });
// 	return workTime;
// }

// 로그아웃
const logout = async () => {
	try {
		await skapi.logout();
		router.push('/');
		// window.localStorage.clear();
	} catch (error) {
		console.error('로그아웃 중 오류 발생 : ', error);
	}
};

// 출퇴근 시간 기록 저장
const onRecord = () => {
	commuteLocalStorage = JSON.parse(window.localStorage.getItem(`commuteRecords : ${user.value.user_id}`)) || [];

	// 만약 출근시간 기록이 있다면
	if (commuteLocalStorage.length > 0) {
		console.log('출근기록 있음');
		console.log('commuteLocalStorage : ', commuteLocalStorage);
		// const startFilter = startLocalStorage.filter((item) => item.user_id === user.value.user_id);	// 현재 사용자 출근시간 필터

		// startFilter.forEach((item) => {
		// 	if (item.date === timeRecords.value.date) {
		// 		timeRecords.value.start = item.title.replace('출근 : ', '');	// 오늘의 출근시간 기록
		// 	}
		// });
		// commuteRecords.value = startLocalStorage;

		// // 만약 날짜가 바뀌었다면 출근시간 초기화
		// if ((startLocalStorage[startLocalStorage.length - 1].date !== timeRecords.value.date) && startLocalStorage.user_id !== user.value.user_id) {
		// 	timeRecords.value.start = '';
		// }
	} else {
		console.log('출근기록 없음');
		console.log('commuteLocalStorage : ', commuteLocalStorage);
	}

	// 만약 퇴근시간 기록이 있다면
	// if (endLocalStorage.length > 0) {
	// 	const endFilter = endLocalStorage.filter((item) => item.user_id === user.value.user_id);

	// 	endFilter.forEach((item) => {
	// 		if (item.date === timeRecords.value.date) {
	// 			timeRecords.value.end = item.title.replace('퇴근 : ', '');	// 오늘의 퇴근시간 기록
	// 		}
	// 	});

	// 	// 출근시간만 찍고 퇴근은 안 찍었을 수 있으니까, 출퇴근 시간 매칭
	// 	commuteRecords.value.forEach(item => {
	// 		endFilter.forEach(endItem => {
	// 			if (item.date === endItem.date) {
	// 				item.endWork = endItem.endWork;
	// 			}
	// 		});
	// 	});

	// 	// 만약 날짜가 바뀌었다면 퇴근시간 초기화
	// 	if ((endLocalStorage[endLocalStorage.length - 1].date !== timeRecords.value.date) && startLocalStorage.user_id !== user.value.user_id) {
	// 		timeRecords.value.end = '';
	// 	}
	// }
}

onMounted(async () => {
	// timeRecords.value.date = getDate();
	timeRecords.value.date = '2024-12-26';

	const res = await getUserInfo();

	if (!res) return;
	user.value = res;

	if(user.value.access_group > 98 && userLocalStorage.length === 0) {
		const res = await getUserList();
	}

	// onRecord();
	// // startLocalStorage = startLocalStorage.filter((item) => item.user_id === user.value.user_id);
	// commuteRecords.value = commuteLocalStorage;

	// const text = document.querySelector("h1");

	// function getTime(){
	// 	const Dday = new Date("2021-08-29:00:00:00+0900");
	// 	const today = new Date();
	// 	const diff = Dday.getTime() - today.getTime(),
	// 		// Ms 단위로 변환
	// 		secInMs = Math.floor(difference / 1000),
	// 		minInMs = Math.floor(secInMs / 60),
	// 		hourInMs = Math.floor(minInMs / 60),
	// 		days = Math.floor(hourInMs / 24),
	// 		// 남은 시간 계산
	// 		seconds = secInMs % 60,
	// 		minutes = minInMs % 60,
	// 		hours = minutes % 24;

	// 	text.innerHTML = `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`
	// }
});
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
