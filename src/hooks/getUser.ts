import { skapi } from '@/main';
import router from '@/router';

// 사용자 정보 가져오기
const getUserInfo = async () => {
  try {
    const profile = await skapi.getProfile();
    // console.log('== getUserProfile : profile == : ', profile);

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
