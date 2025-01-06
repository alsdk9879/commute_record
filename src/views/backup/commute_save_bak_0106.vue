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
	span.time 출근 : {{ timeRecords.startTime }}
	button.btns.sm.btn-work(@click="startWork") 출근

.itembox
	span.time 퇴근 : {{ timeRecords.endTime }}
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
					td.start-time {{ extractTimeFromDateTime(record.startTime) }}
					td.end-time {{ extractTimeFromDateTime(record.endTime) }}
					td.work-time {{ record.totalCommuteTime}}
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, watch } from "vue";
import { skapi } from "@/main";
import {
  getDate,
  getTime,
  convertToTimestamp,
  convertTimeToTimestamp,
  isTimeInRangeTimestramp,
  addTimeToTimestamp,
  extractTimeFromDateTime,
  convertMsToTime,
} from "@/utils/time";
import { generateUniqueId } from "@/utils/functions";
import { getUserInfo, getUserList } from "@/hooks/getUser";
import { initWorkFormat } from "@/constants/consts";

const router = useRouter();
const route = useRoute();

const currentDate = getDate();	// 오늘 날짜
const maxHour = 16;	// 퇴근 기록 가능한 최대 시간

// 마스터가 정한 출근 시간
const masterStartTime = {
  min: "15:00:00",
  max: "18:00:00",
  minTime: `${currentDate} 15:00:00`,
  maxTime: `${currentDate} 18:00:00`,
  minTimestamp: convertToTimestamp(`${currentDate} 15:00:00`),
  maxTimestamp: convertToTimestamp(`${currentDate} 18:00:00`),
};

// 마스터가 정한 퇴근 시간
const masterEndTime = {
  min: "23:00:00",
  max: "02:00:00",
  minTime: `${getDate()} 23:00:00`,
  maxTime: `${getDate()} 02:00:00`,
  minTimestamp: convertTimeToTimestamp(`${getDate()} 23:00:00`),
  maxTimestamp: convertTimeToTimestamp(`${getDate()} 02:00:00`),
};

const user = ref({});	// 유저 정보
const commuteRecords = ref([]);	// 출퇴근 기록
const timeRecords = ref(initWorkFormat); // 출퇴근 시간 기록
const monthlyWorkTime = ref("");	// 한 달 총 근무시간

let userLocalStorage = JSON.parse(window.localStorage.getItem("usersInfo")) || []; // 직원 정보 저장
let commuteLocalStorage; // 직원별 출퇴근 정보 저장소

// 출근시간 기록 저장소 초기화
const generateWorkTime = () => {
  const currentDate = getDate();
  const currentTime = getTime();
  const startTime = `${currentDate} ${currentTime}`;
  const startTimeStamp = convertToTimestamp(startTime);

	// 마지막 출근 이력
  const lastCommute =
    commuteLocalStorage &&
    commuteLocalStorage.length > 0 &&
    commuteLocalStorage[commuteLocalStorage.length - 1];

	// 새로운 출근 이력
  const newCommuteData = {
    ...initWorkFormat,	// 기존 출퇴근 기록 템플릿 복사
    id: generateUniqueId(),
    date: currentDate,
    startTime,
    startTimeStamp,
    totalCommuteTime: '',
    ord: lastCommute?.ord + 1 || 1,	// 출퇴근 순서 (기본값 1)
  };

  return newCommuteData;
};

// 퇴근시간 기록 저장소 초기화
const generateWorkEndTime = () => {
  const value = commuteLocalStorage[commuteLocalStorage.length - 1];	// 마지막 출근 이력

	if (value === undefined) {
    return;
  }

  const endTimeStamp = convertToTimestamp(`${getDate()} ${getTime()}`);
  const totalCommuteTime = convertMsToTime(endTimeStamp - value.startTimeStamp);	

  const newCommuteData = {
    ...value,
    endTime: `${getDate()} ${getTime()}`,
    endTimeStamp: convertToTimestamp(`${getDate()} ${getTime()}`),
    totalCommuteTime,
  };

  return newCommuteData;	
};

// 출근시간 기록
const startWork = () => {
  const value = generateWorkTime();

  // 출근 이력이 있는지 확인
  const isCommuted =
    commuteLocalStorage &&
    commuteLocalStorage.length > 0 &&
    commuteLocalStorage[commuteLocalStorage.length - 1].date === value.date;

	// 마지막 출근 이력
  const lastCommute =
    commuteLocalStorage &&
    commuteLocalStorage.length > 0 &&
    commuteLocalStorage[commuteLocalStorage.length - 1].startTimeStamp;

  // 이미 오늘 출근한 이력이 있을 경우
  if (isCommuted) {
    const checkMaxHour = addTimeToTimestamp(lastCommute, {
      // hours: maxHour,
      seconds: 5,
    });

		// 출근시간으로부터 16시간이 지나기 전까지는 출근 재기록 불가
    if (checkMaxHour >= value.startTimeStamp) {
      alert("이미 출근한 이력이 있습니다.");
      return;
    }
  }

  // 마스터가 정한 출근시간 범위 안에 있는 지 확인
  const isCommute =
    masterStartTime.minTimestamp <= value.startTimeStamp &&
    value.startTimeStamp <= masterStartTime.maxTimestamp;

  // 마스터가 정한 출근시간 범위 지났을 경우
  if (!isCommute) {
    alert("마스터가 정한 출근시간 범위를 벗어났습니다. 출근 기록이 불가합니다.");
		return;
  }

  // 마스터가 정한 출근시간 범위 안에 있을 경우
  if (!commuteLocalStorage) {
    commuteLocalStorage = [];
  }

  commuteLocalStorage.push({ ...value });	// 출근 이력 저장소에 추가
  commuteRecords.value = commuteLocalStorage;

  timeRecords.value = value;

  window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
};

// 퇴근시간 기록
const endWork = () => {
  const value = generateWorkEndTime();

  if(!value || value === undefined) {
		console.log('value : ', value);
		console.log('아무런 출퇴근 기록 없음');

		const currentDate = getDate();
		const currentTime = getTime();
		const endTime = `${currentDate} ${currentTime}`;
		const endTimeStamp = convertToTimestamp(endTime);

		// 마지막 출근 이력
		const lastCommute =
			commuteLocalStorage &&
			commuteLocalStorage.length > 0 &&
			commuteLocalStorage[commuteLocalStorage.length - 1];

		// 새로운 출근 이력
		const newCommuteData = {
			...initWorkFormat,	// 기존 출퇴근 기록 템플릿 복사
			id: generateUniqueId(),
			date: currentDate,
			endTime,
			endTimeStamp,
			totalCommuteTime: '',
			ord: lastCommute?.ord + 1 || 1,	// 출퇴근 순서 (기본값 1)
		};

		commuteLocalStorage.push({ ...newCommuteData });	// 출근 이력 저장소에 추가
		commuteRecords.value = commuteLocalStorage;

		timeRecords.value = newCommuteData;

		window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
		
		return;
  }

	// 퇴근 기록 가능한 최대 시간 (출근시간으로부터 16시간이 기준)
  const maxEndTime = addTimeToTimestamp(value.startTimeStamp, {
    // hours: maxHour,
    seconds: 5,
  });

	// 새로운 퇴근 기록 가능한 시간
	const newEndTime = addTimeToTimestamp(maxEndTime, {
    // hours: maxHour,
    seconds: 5,
  });

	// 마스터가 정한 출근시간 범위 안에 있는 지 확인
  const isCommute =
    masterStartTime.minTimestamp <= value.endTimeStamp &&
    value.endTimeStamp <= masterStartTime.maxTimestamp;

  // 마스터가 정한 출근시간 범위 내에서 퇴근시간을 먼저 기록할 경우
  if (isCommute && !value.startTime) {
    alert("현재 마스터가 정한 출근시간 입니다. 출근을 먼저 해주세요.");
    return;
  }

  const isEndWork = value.endTimeStamp <= maxEndTime;	// 마스터가 정한 퇴근시간 범위 안에 있는 지 확인
	const newEndWork = value.endTimeStamp >= newEndTime; // 새로운 퇴근 기록 가능한 시간인 지 확인
	
	// 마스터가 정한 퇴근시간 범위를 벗어날 경우
  if (!isEndWork) {
    const maxTimeStr = new Date(maxEndTime).toLocaleTimeString();

		if(newEndWork) {
			alert('새로운 출퇴근 기록이 시작됩니다. ');

			if (isCommute) {
				alert("현재 마스터가 정한 출근시간 입니다. 출근을 먼저 해주세요.");
				return;
			}

			const lastCommute =
			commuteLocalStorage &&
			commuteLocalStorage.length > 0 &&
			commuteLocalStorage[commuteLocalStorage.length - 1];

			const endTimeStamp = convertToTimestamp(`${getDate()} ${getTime()}`);

			const data = {
				...initWorkFormat,
				id: generateUniqueId(),
				date: getDate(),
				ord: lastCommute?.ord + 1 || 1,
				endTime: getTime(),
				endTimeStamp,
			};

			commuteLocalStorage = [...commuteLocalStorage, data];	// 저장소 맨 뒤에 data 추가
			commuteRecords.value = commuteLocalStorage;

			timeRecords.value = value;

			window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));

			return;
		}

    alert(`마스터가 정한 퇴근시간 범위(${maxTimeStr}까지)를 벗어났습니다.`);
    return;
  }

  const notLastCommutes = commuteLocalStorage.slice(0, commuteLocalStorage.length - 1);	// 마지막 이력 제외

  const commutes = [...notLastCommutes, value].sort((a, b) => a.ord - b.ord);	// 이력 추가 후 기록 순서대로 정렬

  commuteLocalStorage = commutes;
  commuteRecords.value = commuteLocalStorage;

  timeRecords.value = value;

  window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));

  calcWorkTime();
};

// 근무시간 계산 함수
const calcWorkTime = () => {
  let totalWorkTime = 0; // 한 달 총 근무시간

	const startTimeStamp = commuteRecords.value[commuteRecords.value.length - 1].startTimeStamp;
	const endTimeStamp = commuteRecords.value[commuteRecords.value.length - 1].endTimeStamp;

	// 출퇴근 기록이 없을 경우
	if (!startTimeStamp || !endTimeStamp || startTimeStamp === "" || endTimeStamp === "") {
		return;
	}

	// 마지막 출퇴근 기록에서의 시간 계산
	const dailyWorkTime = endTimeStamp - startTimeStamp; // 일일 근무시간
	totalWorkTime += dailyWorkTime; // 한 달 총 근무시간

	// 근무시간을 분 단위로 변환
	const workHours = Math.floor(dailyWorkTime / 1000 / 60 / 60);
	const workMinutes = Math.floor((dailyWorkTime / 1000 / 60) % 60);
	const totalHours = Math.floor(totalWorkTime / 1000 / 60 / 60);
	const totalMinutes = Math.floor((totalWorkTime / 1000 / 60) % 60);

	// 근무시간을 "X시간 Y분" 형식으로 출력
	const workTime = `${workHours}시간 ${workMinutes}분`;
	monthlyWorkTime.value = `${totalHours}시간 ${totalMinutes}분`;

	console.log("오늘의 근무시간:", workTime);
	console.log("한 달 총 근무시간:", `${totalHours}시간 ${totalMinutes}분`);

	window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteRecords.value));
};

// 자동 출근 기록
const autoStartWork = () => {
	let value = generateWorkTime();
	const currentDate = getDate();
  const currentTime = getTime();
	const currentTimeStamp = convertToTimestamp(`${currentDate} ${currentTime}`);
  const startTime = `${currentDate} ${masterStartTime.max}`;
  const startTimeStamp = convertToTimestamp(startTime);

	// 마지막 출근 이력
  const lastCommute =
    commuteLocalStorage &&
    commuteLocalStorage.length > 0 &&
    commuteLocalStorage[commuteLocalStorage.length - 1];

	const checkMaxHour = addTimeToTimestamp(lastCommute, {
		// hours: maxHour,
		seconds: 5,
	});

	let newCommuteData = {
    ...initWorkFormat,	// 기존 출퇴근 기록 템플릿 복사
    id: generateUniqueId(),
    date: currentDate,
    startTime,
    startTimeStamp,
    totalCommuteTime: '',
    ord: lastCommute?.ord + 1 || 1,	// 출퇴근 순서 (기본값 1)
  };

	// 출근 안 찍음 && 마스터가 정한 출근시간 범위 지난 경우
	if(masterStartTime.maxTimestamp < currentTimeStamp && newCommuteData.startTimeStamp > checkMaxHour) {
		value = newCommuteData;
		commuteLocalStorage.push({ ...value });
		commuteRecords.value = commuteLocalStorage;
		
		timeRecords.value = value;
	}

	window.localStorage.setItem(`commuteRecords : ${user.value.user_id}`, JSON.stringify(commuteLocalStorage));
};

// 로그아웃
const logout = async () => {
  try {
    await skapi.logout();
    router.push("/");
  } catch (error) {
    console.error("로그아웃 중 오류 발생 : ", error);
  }
};

// 출퇴근 시간 기록 저장
const onRecord = () => {
  // 만약 출퇴근 기록이 있다면
  if (commuteLocalStorage.length > 0) {
    commuteRecords.value = commuteLocalStorage;	

		// 오늘 출퇴근 기록이 있다면
    if (commuteLocalStorage[commuteLocalStorage.length - 1].date === timeRecords.value.date) {
      timeRecords.value.start = commuteLocalStorage[commuteLocalStorage.length - 1].startWork;
      timeRecords.value.end = commuteLocalStorage[commuteLocalStorage.length - 1].endWork;
    } else {
      timeRecords.value.start = "";
      timeRecords.value.end = "";
    }
  }
};

onMounted(async () => {
  timeRecords.value.date = getDate();

  const res = await getUserInfo();

  if (!res) return;
  user.value = res;

  if (user.value.access_group > 98 && userLocalStorage.length === 0) {
    const res = await getUserList();
  }

  commuteLocalStorage = JSON.parse(window.localStorage.getItem(`commuteRecords : ${user.value.user_id}`)) || [];
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