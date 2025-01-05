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
import { getDate, getTime, convertTimeToTimestamp } from '@/utils/time';
import { getUserInfo, getUserList } from '@/hooks/getUser'
  
const router = useRouter();
const route = useRoute();

const testMinTime = convertTimeToTimestamp('16:00:00');
const testMaxTime = convertTimeToTimestamp('16:00:00');

const user = ref({});
const commuteRecords = ref([]);
const timeRecords = ref({
	start: '',
	end: '',
	date: '',
});
const monthlyWorkTime = ref('');

const addHoursToTime = (time, hoursToAdd) => {
  const [hours, minutes, seconds] = time.split(':').map(Number); // 시간 문자열 파싱
  const date = new Date(); // 임시 날짜 생성
  date.setHours(hours + hoursToAdd, minutes, seconds, 0); // 시간 추가

  // 새로운 시간을 "HH:mm:ss" 형식으로 반환
  const newHours = String(date.getHours()).padStart(2, '0');
  const newMinutes = String(date.getMinutes()).padStart(2, '0');
  const newSeconds = String(date.getSeconds()).padStart(2, '0');
  return `${newHours}:${newMinutes}:${newSeconds}`;
};

// 마스터가 정한 기본 출퇴근 시간 (시간은 임시작성)
const defaultCommute = ref({
	minStart: testMinTime,	// 8시
	maxStart: testMaxTime,	// 10시
	minEnd: addHoursToTime(testMinTime, 8),	// 17시
	maxEnd: addHoursToTime(testMaxTime, 8)	// 19시
});

// 기본 출퇴근 시간에서 16시간 뒤 시간
const maxCommuteTime = ref({
	minStart: addHoursToTime(testMinTime, 16),	// 다음날 0시
	maxStart: addHoursToTime(testMaxTime, 16),	// 다음날 2시
	minEnd: addHoursToTime(addHoursToTime(testMinTime, 8), 16),	// 다음날 9시
	maxEnd: addHoursToTime(addHoursToTime(testMaxTime, 8), 16)	// 다음날 11시
});

let userLocalStorage = JSON.parse(window.localStorage.getItem('usersInfo')) || [];	// 직원 정보 저장
let commuteLocalStorage;	// 직원별 출퇴근 정보 저장소

// 출근시간 기록
const startWork = () => {
	// const date = getDate();
  const date = '2024-12-11';
  const time = getTime();
	const newCommute = {
		date: date,
		startWork: time,
		endWork: '',
	};	// 새로운 출근 기록

  timeRecords.value.date = date;

  // 출근 기록이 없거나 다른 날짜의 기록일 경우 새로운 출근 기록 추가
  if (commuteLocalStorage.length === 0 || (commuteLocalStorage.length > 0 && commuteLocalStorage[commuteLocalStorage.length - 1].date !== date)) {
    timeRecords.value.start = time;

    commuteLocalStorage.push(newCommute);
    commuteRecords.value = commuteLocalStorage;

    window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
		console.log('출근 AA : 출근 기록 아예 없거나, 다른 날짜가 돼서 새로 출근 찍음 ===============');
  } else {
    const startWorkTime = commuteLocalStorage[commuteLocalStorage.length - 1].startWork;	// 기존 출근 기록 확인
    const currentDate = new Date(); // 현재 날짜 가져오기

    // 기존 출근 시간 설정
    const [hours, minutes, seconds] = startWorkTime.split(':').map(Number);
    currentDate.setHours(hours, minutes, seconds, 0);

    const startWorkTimestamp = currentDate.getTime(); // 기존 출근 시간의 타임스탬프
    const currentTimestamp = Date.now(); // 현재 시간의 타임스탬프

		console.log('출근 BB : AA의 else(증긴확인) ===============');

    // 출근기록으로부터 16시간 이내에 출근 시간을 찍으려는 경우
		// if ((currentTimestamp - startWorkTimestamp) / (1000 * 60 * 60) < 16) {
    if ((currentTimestamp - startWorkTimestamp) / 1000 <= 10) {	// test 10초로 변경
			alert('출근시간이 이미 기록되어 있습니다.');
			console.log('출근 CC : 10초 이내 또 찍음 ===============');
      return;
    }

    // 16시간 이상 지나서 새로운 출근 시간 기록
    timeRecords.value.start = time;

    commuteLocalStorage.push(newCommute);
    commuteRecords.value = commuteLocalStorage;

    window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
		console.log('출근 DD : 10초 이상 지나고 찍음 ===============');
  }
};


// 퇴근시간 기록
const endWork = () => {
	// const date = getDate();
	const time = getTime();
	const date = '2024-12-11';
	// const time = '19:23:34';

	const newCommute = {
		date: date,
		startWork: '',
		endWork: time,
	};	// 새로운 퇴근 기록

	timeRecords.value.date = date;

	// 만약 직원이 출근시간을 기록하지 않았다면
	if(commuteLocalStorage.length === 0 || (commuteLocalStorage.length > 0 && commuteLocalStorage[commuteLocalStorage.length - 1].date !== date)) {
		console.log('퇴근 AA : 출근 찍어라 ==================');

		// 기본 출근시간 범위 내에 퇴근시간을 찍는 경우, 출근시간을 먼저 기록하라는 알림
		if(defaultCommute.value.minStart < (commuteLocalStorage.endWork = time) && (commuteLocalStorage.endWork = time) < defaultCommute.value.maxStart) {
			alert('출근시간이 기록되지 않았습니다. 출근시간부터 기록해주세요.');
			return;
		}

		alert('출근시간이 기록되지 않았습니다. 퇴근시간만 기록됩니다.');

		commuteLocalStorage = JSON.parse(window.localStorage.getItem(`commuteRecords : ${user.value.user_id}`)) || [];

		timeRecords.value.end = time;
		commuteLocalStorage.push(newCommute);
		commuteRecords.value = commuteLocalStorage;

		window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
		console.log('출근 안찍혀서 퇴근만 찍기 완료');
		return;
	}

	// 퇴근시간 기록
	if(commuteLocalStorage.length > 0 && commuteLocalStorage[commuteLocalStorage.length - 1].date === date) {
		console.log('퇴근 기록 있음');
		console.log('=== endWork === commuteLocalStorage : ', commuteLocalStorage);

		// 기존 출근 기록 확인
    const startWorkTime = commuteLocalStorage[commuteLocalStorage.length - 1].startWork;
    const currentDate = new Date(); // 현재 날짜 가져오기

    // 기존 출근 시간 설정
    const [hours, minutes, seconds] = startWorkTime.split(':').map(Number);
    currentDate.setHours(hours, minutes, seconds, 0);
    // currentDate.setHours(houre, minutee, seconde, 0);

    const startWorkTimestamp = currentDate.getTime(); // 기존 출근 시간의 타임스탬프
    const currentTimestamp = Date.now(); // 현재 시간의 타임스탬프

		console.log('=== endWork === startWorkTime : ', startWorkTime);

		// (test) 출근기록으로부터 20초 이내에 출근 시간을 찍으려는 경우
		// if ((currentTimestamp - startWorkTimestamp) / (1000 * 60 * 60) < 16) {
    if (startWorkTime && ((currentTimestamp - startWorkTimestamp) / 1000 <= 10)) {
			console.log('아직 출근으로부터 16시간 안 지나서 퇴근 찍을 수 있음');

			timeRecords.value.end = time;

			commuteLocalStorage[commuteLocalStorage.length - 1].endWork = time;
			commuteRecords.value = commuteLocalStorage;

			window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
			console.log('퇴근 AA ===============');
			
			// if((startWorkTime && ((currentTimestamp - startWorkTimestamp) / 1000 > 10))) {
			// 	alert('퇴근시간이 이미 기록되어 있습니다.');
			// 	return;
			// }
    } else {
			console.log('=== 확확확인인인 ===');

			if(maxCommuteTime.value.maxEnd < (commuteLocalStorage.endWork = time)) {
				console.log('=== endWork === startWorkTimestamp : ', startWorkTimestamp);
				console.log('=== endWork === commuteLocalStorage.endWork : ', commuteLocalStorage.endWork);
				console.log('=== endWork === maxCommuteTime.value.maxEnd : ', maxCommuteTime.value.maxEnd);
				timeRecords.value.end = time;
				commuteLocalStorage.push(newCommute);
				commuteRecords.value = commuteLocalStorage;

				window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
				console.log('전날 퇴근만 -> 다음날도 퇴근만 ===============');
				return;
			} else if(maxCommuteTime.value.maxEnd > (commuteLocalStorage.endWork = time)) {
				alert('퇴근시간이 이미 기록되어 있습니다.');
				return;	
			}

			if((startWorkTime && ((currentTimestamp - startWorkTimestamp) / 1000 > 10)) && defaultCommute.value.minStart < (commuteLocalStorage.endWork = time) && (commuteLocalStorage.endWork = time) < defaultCommute.value.maxStart) {
				alert('출근시간이 기록되지 않았습니다. 출근시간부터 기록해주세요.');
				console.log('퇴근욤욤 ===============');
				return;
			}

			if((startWorkTime && ((currentTimestamp - startWorkTimestamp) / 1000 > 10)) && (commuteLocalStorage.endWork = time) > defaultCommute.value.maxStart) {
				// 다음날 출근일임 (새로운 날짜로 출퇴근 기록해줘야함)
				timeRecords.value.end = time;
				commuteLocalStorage.push(newCommute);
				commuteRecords.value = commuteLocalStorage;

				window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
				console.log('퇴근새로이 ===============');
				return;
			}

			// 다음날 출근일임 (새로운 날짜로 출퇴근 기록해줘야함)
			timeRecords.value.end = time;
			commuteLocalStorage.push(newCommute);
			commuteRecords.value = commuteLocalStorage;

			window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));

			console.log('퇴근 BB ===============');
			return;
		}

		// 10초 이상 지난 경우 새로운 출근 시간 기록
		timeRecords.value.end = time;

		commuteLocalStorage[commuteLocalStorage.length - 1].endWork = time;
		commuteRecords.value = commuteLocalStorage;
		window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));

		console.log('=== endWork === defaultCommute.value : ', defaultCommute.value);
		console.log('=== endWork === maxCommuteTime.value : ', maxCommuteTime.value);
		
		console.log('퇴근 CC ===============');
	} else {
		alert('퇴근시간이 이미 기록되어 있습니다.');
		console.log('퇴근 DD ===============');
		return;
	}

	calcWorkTime();
}

// 근무시간 계산 함수
const calcWorkTime = () => {
	let totalWorkTime = 0; // 한 달 총 근무시간

	commuteRecords.value.forEach(record => {
		const startWork = record.startWork;
		const endWork = record.endWork;
		const date = record.date;

		// 출퇴근 기록이 없거나 지각인 경우
		if (!startWork || !endWork || startWork === '' || endWork === '') {
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

// 자동 출퇴근 처리
const autoCommute = () => {
  const date = '2024-12-11'; // 현재 날짜 (임시 설정)
  const time = getTime();    // 현재 시간 가져오기

  const startWorkTime = commuteLocalStorage[commuteLocalStorage.length - 1]?.startWork || ''; // 기존 출근 기록 확인
  const currentDate = new Date(); // 현재 날짜 가져오기

  if (!startWorkTime) {
    console.log('출근 기록이 없습니다.');
    return;
  }

  // 기존 출근 시간 설정
  const [hours, minutes, seconds] = startWorkTime.split(':').map(Number);
  currentDate.setHours(hours, minutes, seconds, 0);

  const startWorkTimestamp = currentDate.getTime(); // 기존 출근 시간의 타임스탬프
  const currentTimestamp = Date.now(); // 현재 시간의 타임스탬프

  // 만약 기본 출근 시간 범위 내에 출근하지 않은 경우
  if (
    startWorkTime < defaultCommute.value.minStart || 
    startWorkTime > defaultCommute.value.maxStart
  ) {
    console.log('출근 시간이 기본 범위에서 벗어남');
    commuteLocalStorage[commuteLocalStorage.length - 1].startWork = '-'; // 출근 시간을 '-'로 표시
  } else {
    console.log('출근 시간이 정상 범위에 있음');
  }

  // 로컬 스토리지 갱신
  window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
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
	// 만약 출근시간 기록이 있다면
	if (commuteLocalStorage.length > 0) {
		commuteRecords.value = commuteLocalStorage;

		if(commuteLocalStorage[commuteLocalStorage.length - 1].date === timeRecords.value.date) {
			timeRecords.value.start = commuteLocalStorage[commuteLocalStorage.length - 1].startWork;
			timeRecords.value.end = commuteLocalStorage[commuteLocalStorage.length - 1].endWork;
		} else {
			timeRecords.value.start = '';
			timeRecords.value.end = '';
		}
	}
}

onMounted(async () => {
	// timeRecords.value.date = getDate();
	timeRecords.value.date = '2024-12-11';

	const res = await getUserInfo();

	if (!res) return;
	user.value = res;

	if(user.value.access_group > 98 && userLocalStorage.length === 0) {
		const res = await getUserList();
	}

	commuteLocalStorage = JSON.parse(window.localStorage.getItem(`commuteRecords : ${user.value.user_id}`)) || [];

	onRecord();
	// autoCommute();

	console.log('=== defaultCommute.value.minStart === : ', defaultCommute.value.minStart);
	console.log('=== maxCommuteTime.value.maxEnd === : ', maxCommuteTime.value.maxEnd);
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
