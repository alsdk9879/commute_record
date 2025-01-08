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
				col(style="width: 10%")

			thead
				tr
					th 날짜
					th 출근시간
					th 퇴근시간
					th 근무시간
					th 비고

			tbody
				tr(v-for="record in commuteRecords")
					td.date {{ record.data.date }}
					td.start-time {{ extractTimeFromDateTime(record.data.startTime) }}
					td.end-time {{ extractTimeFromDateTime(record.data.endTime) }}
					td.work-time {{ record.data.dailyCommuteTime }}
					td.remark
						input(type="text" v-model="record.data.remark" @blur="updateDesc(record)")
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
// import { generateUniqueId } from "@/utils/functions";
import { getUserInfo, getUserList } from "@/hooks/getUser";
import { initWorkFormat } from "@/constants/consts";

const router = useRouter();
const route = useRoute();

const currentDate = getDate();	// 오늘 날짜
const maxHour = 16;	// 퇴근 기록 가능한 최대 시간

// 마스터가 정한 출근 시간
const masterStartTime = {
  min: "14:00:00",
  max: "18:19:59",
  minTime: `${currentDate} 14:00:00`,
  maxTime: `${currentDate} 18:19:59`,
  minTimestamp: convertToTimestamp(`${currentDate} 14:00:00`),
  maxTimestamp: convertToTimestamp(`${currentDate} 18:19:59`),
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
let commuteStorage = []; // 직원별 출퇴근 정보 저장소

const makeSafe = (str) => {
    return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
}

// 출근시간 기록 저장소 초기화
const generateWorkTime = () => {
  const currentDate = getDate();
  const currentTime = getTime();
  const startTime = `${currentDate} ${currentTime}`;
  const startTimeStamp = convertToTimestamp(startTime);

	// 마지막 출근 이력
  const lastCommute =
    commuteStorage &&
    commuteStorage.length > 0 &&
    commuteStorage[commuteStorage.length - 1];

	// 새로운 출근 이력
  const newCommuteData = {
    ...initWorkFormat,	// 기존 출퇴근 기록 템플릿 복사
    // id: generateUniqueId(),
    date: currentDate,
    startTime,
    startTimeStamp,
    dailyCommuteTime: '',
  };

  return newCommuteData;
};

// 퇴근시간 기록 저장소 초기화
const generateWorkEndTime = () => {
  const value = commuteStorage[commuteStorage.length - 1];	// 마지막 출근 이력

	if (!value || !value.data) {
    return;
  }

  const endTimeStamp = convertToTimestamp(`${getDate()} ${getTime()}`);
  // const dailyCommuteTime = convertMsToTime(endTimeStamp - value.data.startTimeStamp);
	// const dailyCommuteTimeStamp = endTimeStamp - value.data.startTimeStamp;
  const dailyCommuteTimeStamp = value.data.startTimeStamp ? endTimeStamp - value.data.startTimeStamp : 0;
  const dailyCommuteTime = value.data.startTimeStamp ? convertMsToTime(dailyCommuteTimeStamp): '';
	const totalCommuteTime = (value.data.totalCommuteTime || 0) + dailyCommuteTimeStamp;

  console.log('=== generateWorkEndTime === dailyCommuteTimeStamp : ', dailyCommuteTimeStamp);
  console.log('=== generateWorkEndTime === dailyCommuteTime : ', dailyCommuteTime);

  const newCommuteData = {
    ...value,
    data: {
      ...value.data,
      endTime: `${getDate()} ${getTime()}`,
      endTimeStamp: convertToTimestamp(`${getDate()} ${getTime()}`),
      dailyCommuteTime,
      totalCommuteTime,
      calculated: false, // 계산 여부 플래그  
    }
  };

  return newCommuteData;	
};

// 출퇴근 기록 데이터베이스 저장 함수
const saveCommuteRecord = async (record, isUpdate = false) => {
  console.log('=== saveCommuteRecord === record : ', record);
  console.log('=== saveCommuteRecord === isUpdate : ', isUpdate);
  console.log('======================')

  try {
    const config = {
      table: 'commute_records',
      access_group: 'private',
      // index: {
      //   name: 'user_id',
      //   value: makeSafe(record.user_id),
      // }
    };

    const response = await skapi.postRecord(record, config);
    console.log('=== saveCommuteRecord === response : ', response);

    return response.list ? response.list[0] : response;  // list가 있으면 첫 번째 항목 반환, 아니면 response 그대로 반환
  } catch (error) {
    console.log('=== saveCommuteRecord === error : ', {error});
    throw error;
  }
};

// 출근시간 기록
const startWork = async () => {
  const value = generateWorkTime();

  // 출근 이력이 있는지 확인
  const isCommuted =
    commuteStorage &&
    commuteStorage.length > 0 &&
    commuteStorage[commuteStorage.length - 1].data.date === value.date;

  // 마지막 출근 이력
  const lastCommute =
    commuteStorage &&
    commuteStorage.length > 0 &&
    commuteStorage[commuteStorage.length - 1].data.startTimeStamp;

  // 이미 오늘 출근한 이력이 있을 경우
  if (isCommuted) {
    console.log('=== startWork === 확인 : ');
    
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

  // 마스터가 정한 출근시간 범위 안에 있는지 확인
  const isCommute =
    masterStartTime.minTimestamp <= value.startTimeStamp &&
    value.startTimeStamp <= masterStartTime.maxTimestamp;

  // 마스터가 정한 출근시간 범위 지났을 경우
  if (!isCommute) {
    alert("마스터가 정한 출근시간 범위를 벗어났습니다. 출근 기록이 불가합니다.");
    return;
  }

  // 마스터가 정한 출근시간 범위 안에 있을 경우
  if (!commuteStorage) {
    commuteStorage = [];
  }

  try {
    // DB에 저장
    const savedRecord = await saveCommuteRecord({ 
      ...value,
      // type: 'start',
      // user_id: makeSafe(user.value.user_id)
    });

    // 상태 업데이트
    commuteStorage.push({ ...savedRecord });
    commuteRecords.value = commuteStorage;
    timeRecords.value = savedRecord.data;

  } catch (error) {
    alert('출근 기록 저장에 실패했습니다.');
    console.log('=== startWork === error : ', {error});
  }
};

// 퇴근시간 기록
const endWork = async () => {
  const value = generateWorkEndTime();
  
  if (!value) {
    const currentDate = getDate();
    const currentTime = getTime();
    const endTime = `${currentDate} ${currentTime}`;
    const endTimeStamp = convertToTimestamp(endTime);

    // 마지막 출근 이력
    const lastCommute =
      commuteStorage &&
      commuteStorage.length > 0 &&
      commuteStorage[commuteStorage.length - 1];

    // 새로운 출근 이력
    const newCommuteData = {
      ...initWorkFormat,  // 기존 출퇴근 기록 템플릿 복사
      date: currentDate,
      endTime,
      endTimeStamp,
      dailyCommuteTime: '',
    };

    try {
      console.log('AAA')
      const savedRecord = await saveCommuteRecord({
        ...newCommuteData,
        // type: 'end',
        user_id: makeSafe(user.value.user_id)
      });

      commuteStorage.push({ ...savedRecord });
      commuteRecords.value = commuteStorage;
      timeRecords.value = savedRecord.data;

    } catch (error) {
      alert('퇴근 기록 저장에 실패했습니다.');
      console.log('=== endWork === error : ', {error});
    }
    
    return;
  }

  // 퇴근 기록 가능한 최대 시간 (출근시간으로부터 16시간이 기준)
  const maxEndTime = addTimeToTimestamp(value.data.startTimeStamp, {
    // hours: maxHour,
    seconds: 70,
  });

  // 새로운 퇴근 기록 가능한 시간
  const newEndTime = addTimeToTimestamp(maxEndTime, {
    // hours: maxHour,
    seconds: 5,
  });

  // 마스터가 정한 출근시간 범위 안에 있는지 확인
  const isCommute =
    masterStartTime.minTimestamp <= value.data.endTimeStamp &&
    value.data.endTimeStamp <= masterStartTime.maxTimestamp;

    console.log('== endWork == isCommute : ', isCommute);

  // 마스터가 정한 출근시간 범위 내에서 퇴근시간을 먼저 기록할 경우
  if (isCommute && !value.data.startTime) {
    alert("현재 마스터가 정한 출근시간 입니다. 출근을 먼저 해주세요.");
    return;
  }

  const isEndWork = value.data.endTimeStamp <= maxEndTime; // 마스터가 정한 퇴근시간 범위 안에 있는 지 확인
  const newEndWork = value.data.endTimeStamp >= newEndTime;  // 새로운 퇴근 기록 가능한 시간인 지 확인
  
  // 마스터가 정한 퇴근시간 범위를 벗어날 경우
  if (!isEndWork) {
    const maxTimeStr = new Date(maxEndTime).toLocaleTimeString();

    if (newEndWork) {
      alert('새로운 출퇴근 기록이 시작됩니다.');

      if (isCommute) {
        alert("현재 마스터가 정한 출근시간 입니다. 출근을 먼저 해주세요.");
        return;
      }

      const lastCommute =
        commuteStorage &&
        commuteStorage.length > 0 &&
        commuteStorage[commuteStorage.length - 1];

      const endTimeStamp = convertToTimestamp(`${getDate()} ${getTime()}`);
      const dailyCommuteTime = convertMsToTime(endTimeStamp - value.startTimeStamp);
      const dailyCommuteTimeStamp = endTimeStamp - value.startTimeStamp;
      let totalCommuteTime = value.totalCommuteTime || 0;
      totalCommuteTime += dailyCommuteTimeStamp;

      const data = {
        ...initWorkFormat,
        date: getDate(),
        endTime: getTime(),
        endTimeStamp,
        dailyCommuteTime,
        // totalCommuteTime,
        // calculated: false,  // 계산 여부 플래그
      };

      try {
        console.log('BB')
        const savedRecord = await saveCommuteRecord({
          ...data,
          // type: 'end',
          user_id: makeSafe(user.value.user_id)
        });

        // commuteStorage.push({ ...savedRecord });
        commuteStorage = [...commuteStorage, savedRecord];	// 저장소 맨 뒤에 data 추가
        commuteRecords.value = commuteStorage;
        timeRecords.value = savedRecord.data;

      } catch (error) {
        alert('퇴근 기록 저장에 실패했습니다.');
        console.log('=== endWork === error : ', {error});
      }

      return;
    }

    alert(`마스터가 정한 퇴근시간 범위(${maxTimeStr}까지)를 벗어났습니다.`);
    return;
  }

  try {
    console.log('출근O -> 퇴근');
    console.log('=== endWork === value : ', value);

    const config = {
      record_id: value.record_id,
    }

    const savedRecord = await skapi.postRecord({
      ...value.data,  
      // type: 'end',
    }, config);

    // 상태 업데이트
    const notLastCommutes = commuteStorage.slice(0, commuteStorage.length - 1);
    const commutes = [...notLastCommutes, savedRecord].sort((a, b) => a.startTimeStamp - b.startTimeStamp);
    
    commuteStorage = commutes;
    commuteRecords.value = commuteStorage;
    timeRecords.value = savedRecord.data;

    console.log('=== endWork === savedRecord : ', savedRecord);
    console.log('=== endWork === commuteStorage : ', commuteStorage);
    console.log('=== endWork === commuteRecords.value : ', commuteRecords.value);

    // calcWorkTime(savedRecord);
  } catch (error) {
    alert('퇴근 기록 저장에 실패했습니다.');
    console.log('=== endWork === error : ', {error});
  }
};

let totalWorkTimeMs = 0; // 총 근무시간

// 근무시간 계산 함수
// const calcWorkTime = (value) => {
//   if (!value) return;

//   const { startTimeStamp, endTimeStamp, dailyCommuteTime, calculated } = value.data;

//   if (!startTimeStamp || !endTimeStamp || calculated) {
//     console.log("유효하지 않은 출퇴근 기록이거나 이미 계산된 기록입니다.");
//     return;
//   }

//   // 새로 계산된 근무시간
//   const updatedWorkTimeMs = endTimeStamp - startTimeStamp;

//   // 기존 근무시간 (있다면 빼고 갱신)
//   const previousWorkTimeMs = dailyCommuteTime || 0;
//   const workTimeDiff = endTimeStamp - startTimeStamp

//   // 총 근무시간 갱신
//   totalWorkTimeMs += workTimeDiff;

//   // 현재 기록 업데이트
//   value.data.dailyCommuteTime = convertMsToTime(updatedWorkTimeMs);
//   value.data.calculated = true;

//   // 시간 변환
//   const totalHours = Math.floor(totalWorkTimeMs / 1000 / 60 / 60);
//   const totalMinutes = Math.floor((totalWorkTimeMs / 1000 / 60) % 60);

//   monthlyWorkTime.value = `${totalHours}시간 ${totalMinutes}분`;
// };

// 비고란 작성 내용 업데이트
const updateDesc = async (record) => {
  console.log('=== updateDesc === record : ', record);
  try {
    const values = {
      ...record.data,
      remark: record.remark
    }

    const updatedRecord = await saveCommuteRecord({
      ...values,
    });

    const recordIndex = commuteRecords.value.findIndex((r) => r.id === record.id);
    if (recordIndex !== -1) {
      commuteRecords.value[recordIndex] = updatedRecord;
    }
  } catch (error) {
    alert('비고 내용 저장에 실패했습니다.');
    console.error(error);
  }
};

// 출퇴근 기록 조회
const fetchCommuteRecords = async (userId, options = {}) => {
  try {
    const {
      // limit = 50,   // 한 번에 가져올 기록 수
      ascending = true  // 정렬 순서 (false: 최신순)
    } = options;

    const query = {
      table: 'commute_records',
      access_group: 99,
      index: {
        name: 'user_id',
        value: makeSafe(user.value.user_id),
      }
    };

    const fetchOptions = {
      // limit,
      ascending
    };

    const response = await skapi.getRecords(query, fetchOptions);
    console.log('=== fetchCommuteRecords === response : ', response);
    return response;
  } catch (error) {
    console.error('Error fetching records:', error);
    throw error;
  }
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
  if (commuteStorage.length > 0) {
    commuteRecords.value = commuteStorage;	

		// 오늘 출퇴근 기록이 있다면
    if (commuteStorage[commuteStorage.length - 1].date === timeRecords.value.date) {
      timeRecords.value.start = commuteStorage[commuteStorage.length - 1].startWork;
      timeRecords.value.end = commuteStorage[commuteStorage.length - 1].endWork;
    } else {
      timeRecords.value.start = "";
      timeRecords.value.end = "";
    }
  }
};

// 근무시간 계산
watch(commuteRecords, (newVal) => {
  const validRecords = newVal.filter(record => 
    record.data &&
    record.data.startTimeStamp && 
    record.data.endTimeStamp
  );

  const totalMilliseconds = validRecords.reduce((total, record) => {
    const workTime = record.data.endTimeStamp - record.data.startTimeStamp;
    return total + (workTime); 
  }, 0);

  // 초로 변환
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  // 분으로 변환
  const totalMinutes = Math.floor(totalSeconds / 60);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  monthlyWorkTime.value = `${hours}시간 ${minutes}분`;
});

onMounted(async () => {
  timeRecords.value.date = getDate();

  const res = await getUserInfo();

  if (!res) return;
  user.value = res;

  if (user.value.access_group > 98 && userLocalStorage.length === 0) {
    const res = await getUserList();
  }

  try {
    // DB에서 기록 조회
    const response = await fetchCommuteRecords();
    if (response.list && Array.isArray(response.list)) {
      commuteStorage = response.list.sort((a, b) => a.startTimeStamp - b.startTimeStamp);
    } else {
      commuteStorage = [];
    }
    onRecord();
  } catch (error) {
    console.log('=== onMounted === error : ', {error});
    commuteStorage = [];
    onRecord();
  }
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