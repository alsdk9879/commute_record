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
	.title-wrap
		span.title(style="font-size: 1.125rem; font-weight: 700; display: inline-block;") 이전 출퇴근 기록
		span.monthlyWorkTime 총 근무시간 : {{ monthlyWorkTime }}
	.table-wrap
		table.table.tb-commute-record
			colgroup
				col(style="width: 10%")
				col(style="width: 10%")
				col(style="width: 10%")
				col(style="width: 10%")

			thead
				tr
					th 날짜
					th 출근시간
					th 퇴근시간
					th 근무시간

			tbody
				tr(v-for="record in commuteRecords")
					td.date {{ record.date }}
					td.start-time {{ record.startWork }}
					td.end-time {{ record.endWork }}
					td.work-time {{ record.workTime }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { skapi } from '@/main';
import { getDate, getTime } from '@/utils/time';
import { getUserInfo, getUserList } from '@/hooks/getUser'

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


// 8~10시 사이엔 퇴근 먼저 찍을시 안됨, 출근 먼저 찍은 후 가능.
// 이후엔 퇴근 먼저 찍기 가능, 출근도 찍기는 가능. (but, 근무시간)
  
const router = useRouter();
const route = useRoute();

const user = ref({});
const commuteRecords = ref([]);
const timeRecords = ref({
	start: '',
	end: '',
	date: '',
});
const monthlyWorkTime = ref('');
// 마스터가 정한 기본 출퇴근 시간 (시간은 임시작성)
const defaultCommute = ref({
	minStart: '15:00:00',
	maxStart: '16:00:00',
	minEnd: '17:00:00',
	maxEnd: '19:00:00'
});

const maxCommuteTime = ref({
	minStart: null,
	maxStart: null,
	minEnd: null,
	maxEnd: null
});

let userLocalStorage = JSON.parse(window.localStorage.getItem('usersInfo')) || [];	// 직원 정보 저장
let commuteLocalStorage;	// 직원별 출퇴근 정보 저장소

const date = new Date();
const isoDate = date.toISOString().split('T')[0]; // 날짜를 ISO 형식으로 변환. 예: '2024-12-20'

// 기본 출퇴근시간에서 16시간 뒤 계산
const minStartTime = new Date(`${isoDate}T${defaultCommute.value.minStart}`);
minStartTime.setHours(minStartTime.getHours() + 12);

console.log('minStart + 16 : ', minStartTime);


const hours = minStartTime.getHours().toString().padStart(2, '0');
const minutes = minStartTime.getMinutes().toString().padStart(2, '0');
const seconds = minStartTime.getSeconds().toString().padStart(2, '0');
const calcMinStartTime = `${hours}:${minutes}:${seconds}`;
console.log('minStartTime : ', `${hours}:${minutes}:${seconds}`);

// 출근시간 기록
const startWork = () => {
	// const date = getDate();
	const time = getTime();
	const date = '2024-12-20';
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
	} else if(monthlyWorkTime.minStart < commuteLocalStorage.find(record => record.date === date).startWork < monthlyWorkTime.maxStart) {
		console.log('출근 찍음');
	} else {
		alert('출근시간이 이미 기록되어 있습니다.');
		return;
	}
}

// 퇴근시간 기록
const endWork = () => {
	// const date = getDate();
	const time = getTime();
	const date = '2024-12-20';
	// const time = '19:23:34';

	timeRecords.value.date = date;

	// 만약 직원이 출근시간을 기록하지 않았다면
	if(commuteLocalStorage.length === 0 || !commuteLocalStorage.find(record => record.date === date)) {
		// 기본 출근시간 범위 내에 퇴근시간을 찍는 경우, 출근시간을 먼저 기록하라는 알림
		if(defaultCommute.value.minStart < (commuteLocalStorage.endWork = time) && (commuteLocalStorage.endWork = time) < defaultCommute.value.maxStart) {
			alert('출근시간이 기록되지 않았습니다. 출근시간부터 기록해주세요.');
			return;
		}

		alert('출근시간이 기록되지 않았습니다. 퇴근시간만 기록됩니다.');

		commuteLocalStorage = JSON.parse(window.localStorage.getItem(`commuteRecords : ${user.value.user_id}`)) || [];

		const newEvent = {
			date: date,
			startWork: '',
			endWork: time,
		};	
		commuteLocalStorage.push(newEvent);

		let dateFound = false; // 날짜가 이미 존재하는지 체크하는 변수

		// 만약 오늘과 다른 날짜가 되었다면
		if (!dateFound) {
			commuteRecords.value.push(newEvent); // 새로운 날짜에 대한 출근 시간 추가
		}

		window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
	}


	// 퇴근시간 기록
	if(commuteLocalStorage.length > 0) {
		commuteLocalStorage.find(record => record.date === date).endWork = time;
		timeRecords.value.end = time;
		window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));

		calcWorkTime();
	} else if(commuteLocalStorage.find(record => record.date === date) <= calcMinStartTime) {
		console.log('퇴근 찍음');
	} else {
		alert('퇴근시간이 이미 기록되어 있습니다.');
		return;
	}
}

// 근무시간 계산 함수
const calcWorkTime = () => {
	let totalWorkTime = 0; // 한 달 총 근무시간

	// const record = commuteRecords.value.find(record => {
	// 	return record.date === timeRecords.value.date;
	// });

	// if(record) {
	// 	const startWork = record.startWork;
	// 	const endWork = record.endWork;
	// 	const date = record.date;

	// 	// 출퇴근 기록이 없거나 지각인 경우
	// 	if (!startWork || !endWork || startWork === '지각') {
	// 		return;
	// 	}

	// 	// 시간 계산
	// 	const startTime = new Date(`${date}T${startWork}`).getTime();
	// 	const endTime = new Date(`${date}T${endWork}`).getTime();

	// 	const dailyWorkTime = endTime - startTime; // 일일 근무시간
	// 	totalWorkTime += dailyWorkTime; // 한 달 총 근무시간

	// 	const dailyWorkTimeH = Math.floor(dailyWorkTime / (1000 * 60 * 60)); // 시간
	// 	const dailyWorkTimeM = Math.floor((dailyWorkTime % (1000 * 60 * 60)) / (1000 * 60)); // 분

	// 	record.workTime = `${dailyWorkTimeH}시간 ${dailyWorkTimeM}분`; // 근무시간 기록
	// }

	commuteRecords.value.forEach(record => {
		const startWork = record.startWork;
		const endWork = record.endWork;
		const date = record.date;

		// 출퇴근 기록이 없거나 지각인 경우
		if (!startWork || !endWork || startWork === '지각') {
			return;
		}

		// 시간 계산
		const startTime = new Date(`${date}T${startWork}`).getTime();
		const endTime = new Date(`${date}T${endWork}`).getTime();

		const dailyWorkTime = endTime - startTime; // 일일 근무시간
		totalWorkTime += dailyWorkTime; // 한 달 총 근무시간

		const dailyWorkTimeH = Math.floor(dailyWorkTime / (1000 * 60 * 60)); // 시간
		const dailyWorkTimeM = Math.floor((dailyWorkTime % (1000 * 60 * 60)) / (1000 * 60)); // 분

		record.workTime = `${dailyWorkTimeH}시간 ${dailyWorkTimeM}분`; // 근무시간 기록	
	})

	// 한 달 총 근무시간 계산
	const totalHours = Math.floor(totalWorkTime / (1000 * 60 * 60)); // 시간
	const totalMinutes = Math.floor((totalWorkTime % (1000 * 60 * 60)) / (1000 * 60)); // 분

	monthlyWorkTime.value = `${totalHours}시간 ${totalMinutes}분`;

	window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteRecords.value));
};

// 로그아웃
const logout = async () => {
	try {
		await skapi.logout();
		router.push('/');
	} catch (error) {
		console.error('로그아웃 중 오류 발생 : ', error);
	}
};

// 출퇴근 시간 기록 저장
const onRecord = () => {
	commuteLocalStorage = JSON.parse(window.localStorage.getItem(`commuteRecords : ${user.value.user_id}`)) || [];

	// 만약 출근시간 기록이 있다면
	if (commuteLocalStorage.length > 0) {
		commuteRecords.value = commuteLocalStorage;

		if(commuteLocalStorage.find(record => record.date === timeRecords.value.date)) {
			timeRecords.value.start = commuteLocalStorage.find(record => record.date === timeRecords.value.date).startWork;
		} else {
			timeRecords.value.start = '';
		}
	}

	// 만약 퇴근시간 기록이 있다면
	if(commuteLocalStorage.length > 0) {
		commuteRecords.value = commuteLocalStorage;

		if(commuteLocalStorage.find(record => record.date === timeRecords.value.date)) {
			timeRecords.value.end = commuteLocalStorage.find(record => record.date === timeRecords.value.date).endWork;
		} else {
			timeRecords.value.end = '';
		}
	}

	calcWorkTime();
}

onMounted(async () => {
	// timeRecords.value.date = getDate();
	timeRecords.value.date = '2024-12-20';

	const res = await getUserInfo();

	if (!res) return;
	user.value = res;

	if(user.value.access_group > 98 && userLocalStorage.length === 0) {
		const res = await getUserList();
	}

	onRecord();
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
