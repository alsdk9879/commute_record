export interface IWorkFormat {
  id: string | null;
  ord: number | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  startTimeStamp: number | null;
  endTimeStamp: number | null;
  totalCommuteTime: number | null;
}

// 초기화
export const initWorkFormat: IWorkFormat = {
  id: null,
  ord: null,
  date: null,
  startTime: null,
  endTime: null,
  startTimeStamp: null,
  endTimeStamp: null,
  totalCommuteTime: null,
};
