import { skapi } from '@/main';
import router from '@/router';

// skapi에서 UserProfile을 못가져오는 문제가 있어서 타입 에러남.
// Composition API 사용하는 방식을 구현하려고 함

// 사용자 정보 가져오기
const getUserInfo = async () => {
  try {
    const profile = await skapi.getProfile();
    console.log('== getUserProfile : profile == : ', profile);

    if (!profile) {
      alert('로그인이 필요합니다.');
      router.push('/');
      return;
    }
    return profile;
  } catch (error) {
    console.error('프로필을 가져오는 중 오류 발생:', error);
    throw error;
  }
};

// (마스터용) 사용자 정보 가져오기
const getUserList = async () => {
  try {
    const res = await skapi.getUsers();

    window.localStorage.setItem('usersInfo', JSON.stringify(res.list));
  } catch (error) {
    console.log('=== getUser === error : ', { error });
  }
};

export { getUserInfo, getUserList };
