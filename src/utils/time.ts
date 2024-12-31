import { reactive, ref, computed } from 'vue';

// 날짜 가져오기
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

// string -> timestamp
const convertTimeToTimestamp = (timeStr: string) => {
  // 현재 날짜 가져오기
  const today = new Date();

  // 시간 문자열 파싱
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);

  // 현재 날짜에 입력받은 시간 설정
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);

  return date.getTime();
};

// 시간이 범위 내에 있는지 확인
// string(15:00:00)를 받아야함.
const isTimeInRange = (targetTime: string, minTime: string, maxTime: string) => {
  const targetTimestamp = convertTimeToTimestamp(targetTime);
  const minTimestamp = convertTimeToTimestamp(minTime);
  const maxTimestamp = convertTimeToTimestamp(maxTime);

  return targetTimestamp >= minTimestamp && targetTimestamp <= maxTimestamp;
};

// 시간이 범위 내에 있는지 확인
// timestamp를 받아야함.
const isTimeInRangeTimestramp = (targetTimestamp: number, minTimestamp: number, maxTimestamp: number) => {
  return targetTimestamp >= minTimestamp && targetTimestamp <= maxTimestamp;
};

// 타임스탬프에 특정 시간을 더합니다.
const addTimeToTimestamp = (timestamp: number, { hours = 0, minutes = 0, seconds = 0 }) => {
  const milliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;

  return timestamp + milliseconds;
};

export { getDate, getTime, convertTimeToTimestamp, isTimeInRange, isTimeInRangeTimestramp, addTimeToTimestamp };
