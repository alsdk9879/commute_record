// 사용자 출퇴근 기록에 저장될 유니크한 ID를 생성하는 함수 (날짜가 같은 경우 구분하기 위해)
export const generateUniqueId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
};

type DebouncedFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

export function debounce<T extends (...args: any[]) => any>(callback: T, delay: number): DebouncedFunction<T> {
  let timeoutId: number | undefined;

  return function (this: any, ...args: Parameters<T>): void {
    // 이전 타이머가 있다면 제거
    if (timeoutId) window.clearTimeout(timeoutId);

    // 새로운 타이머 설정
    timeoutId = window.setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}
