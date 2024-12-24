<template lang="pug">
	button.btns.btn-start-work(@click="startWork") 출근
	button.btns.btn-end-work(@click="endWork") 퇴근

	button.btns(@click="router.push('/commute-view-calendar')") 출퇴근 기록 캘린더

	template(v-if="user.access_group > 98")
		button.btns(@click="router.push('/admin-commute')") 직원 출퇴근 기록 조회

	form#logout(@submit="logout")
		input.btns.btn-logout(type="submit" value="Logout")

	h2 안녕하세요. {{ user.name }}님!
	h2 Today : {{ timeRecords.date }}

	.start-time 출근 : {{ timeRecords.start }}
	.end-time 퇴근 : {{ timeRecords.end }}

	br
	br
	br

	table.tb-commute-record
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
import { skapi } from '@/main';
import { getDate, getTime } from '@/time';
  
const router = useRouter();
const route = useRoute();

const commuteRecords = ref([]);
const timeRecords = ref({
	start: '',
	end: '',
	date: '',
});
const user = ref({ 
	name: '',
	access_group: 0,
	user_id: '',
});

let userLocalStorage;
let startLocalStorage;
let endLocalStorage;

// 사용자 정보 가져오기
const getUsersInfo = async () => {
	try {
		const res = await skapi.getUsers();

		window.localStorage.setItem('usersInfo', JSON.stringify(res.list));
		userLocalStorage = JSON.parse(window.localStorage.getItem('usersInfo')) || [];

		const userFilter = userLocalStorage.filter((item) => item.user_id === user.value.user_id);
		user.value = userFilter;

		return userLocalStorage;
	} catch (error) {
		console.log('=== getUser === error : ', { error });
	}
};

// 직원 정보 가져오기
const getUser = async () => {
  try {
    const res = await skapi.getUsers();
    // const filtered = res.list.filter((item) => item.access_group < 99);
    // user.value = filtered;
	user.value = res.list;
	return res.list;
  } catch (error) {
    console.log('=== getUser === error : ', { error });
  }
};

// timeRecords.value.date = getDate();
timeRecords.value.date = '2024-12-25';

// 출근시간 기록
const startWork = () => {
	const date = '2024-12-25';
	// const date = getDate();
	const time = getTime();

	timeRecords.value.date = date;

	startLocalStorage = JSON.parse(window.localStorage.getItem('startTime')) || [];

	if (!startLocalStorage.some(record => record.start === date && record.user_id === user.value.user_id)) {
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
		};
		startLocalStorage.push(newEvent);

		// 같은 날짜에 대한 출근 시간 추가
		let dateFound = false; // 날짜가 이미 존재하는지 체크하는 변수

		for (let i = 0; i < commuteRecords.value.length; i++) {
			if (commuteRecords.value[i].date === date) {
				// 같은 날 퇴근 시간에 출근 시간 추가
				commuteRecords.value[i].startWork = time; 
				dateFound = true; // 날짜가 존재함을 표시
				break; // 날짜가 발견되면 루프 종료
			}
		}

		// 만약 오늘과 다른 날짜가 되었다면
		if (!dateFound) {
			commuteRecords.value.push(newEvent); // 새로운 날짜에 대한 출근 시간 추가
		}

		window.localStorage.setItem('startTime', JSON.stringify(startLocalStorage));

		// const data = {
		//     startWork: startLocalStorage
		// }

		// const config = {
		//     table: 'my_startWork_time',
		//     access_group: 99,
		//     record_id: user.user_id
		// }

		// skapi.postRecord(data, config).then(record => {
		//     console.log('출근 === postRecord === record : ', record);
		// });
	} else {
		alert('출근 시간이 이미 기록되어 있습니다.');
		return;
	}

}

// 퇴근시간 기록
const endWork = () => {
	const date = '2024-12-25';
	// const date = getDate();
	const time = getTime();

	timeRecords.value.date = date;

	// 만약 직원이 직접 출근 시간을 기록하지 않았다면
	if (!startLocalStorage.some(record => record.start === date && record.user_id === user.value.user_id)) {
		alert('출근 시간이 기록되지 않았습니다. 출근시간을 먼저 기록해주세요.');
		// commuteRecords.value = endLocalStorage;
		return;
	}

	endLocalStorage = JSON.parse(window.localStorage.getItem('endTime')) || [];

	if (!endLocalStorage.some(record => record.end === date && record.user_id === user.value.user_id)) {
		timeRecords.value.end = time;

		const newEvent = { 
			title: `퇴근 : ${time}`, 
			start: date, end: date,
			 backgroundColor: '#c01515', 
			 date: date, startWork: '', 
			 endWork: time, 
			 user_id: user.value.user_id 
		};
		endLocalStorage.push(newEvent);

		// 같은 날짜에 대한 퇴근 시간 추가
		let dateFound = false; // 날짜가 이미 존재하는지 체크하는 변수

		for (let i = 0; i < commuteRecords.value.length; i++) {
			if (commuteRecords.value[i].date === date) {
				commuteRecords.value[i].endWork = time; // 같은 날 출근 시간에 퇴근 시간 추가
				dateFound = true; // 날짜가 존재함을 표시
				break; // 날짜가 발견되면 루프 종료
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

// let query = {
//     table: 'my_startWork_time'
// }

// skapi.getRecords(query).then(response=>{
// 	console.log('=== getRecords === response : ', response.list);

// 	const recordsList = response.list;
// });

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

	if (startLocalStorage.length > 0) {
		const startFilter = startLocalStorage.filter((item) => item.user_id === user.value.user_id);

		for(let i = 0; i < startFilter.length; i++) {
			if(startFilter[i].date === timeRecords.value.date) {
				timeRecords.value.start = startFilter[i].title.replace('출근 : ', '');
			}
		}
		commuteRecords.value = startLocalStorage;

		// 만약 날짜가 바뀌었다면 출근시간 초기화
		if ((startLocalStorage[startLocalStorage.length - 1].date !== timeRecords.value.date) && startLocalStorage.user_id !== user.value.user_id) {
			timeRecords.value.start = '';
		}
	}

	if (endLocalStorage.length > 0) {
		// if(!startLocalStorage.length) {
		// 	commuteRecords.value = endLocalStorage;
		// }

		const endFilter = endLocalStorage.filter((item) => item.user_id === user.value.user_id);

		for(let i = 0; i < endFilter.length; i++) {
			if(endFilter[i].date === timeRecords.value.date) {
				timeRecords.value.end = endFilter[i].title.replace('퇴근 : ', '');
			}
		}

		for (let i = 0; i < commuteRecords.value.length; i++) {
			const originDate = commuteRecords.value[i].date;

			for (let j = 0; j < endLocalStorage.length; j++) {
				const endDate = endLocalStorage[j].date;

				if (originDate === endDate && commuteRecords.value[i].user_id === endLocalStorage[j].user_id) {
					commuteRecords.value[i].endWork = endLocalStorage[j].endWork;
					break;
				} else {
					commuteRecords.value[i].endWork = '';
				}
			}
		}

		// 만약 날짜가 바뀌었다면 퇴근시간 초기화
		if ((endLocalStorage[endLocalStorage.length - 1].date !== timeRecords.value.date) && startLocalStorage.user_id !== user.value.user_id) {
			timeRecords.value.end = '';
		}
	}
}

onMounted(async () => {
	await getUsersInfo().then((res) => {
		// console.log('res : ', res);
		// for (let i = 0; i < res.length; i++) {
		// 	if (res[i].user_id === user.value.user_id) {
		// 		user.value = res[i];
		// 	}
		// }
	});

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

	onRecord();
	console.log('timeRecords : ', timeRecords.value);
	startLocalStorage = startLocalStorage.filter((item) => item.user_id === user.value.user_id);
	commuteRecords.value = startLocalStorage;
	console.log('commuteRecords : ', commuteRecords.value);
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
