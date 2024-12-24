// import { reactive, ref, computed } from 'vue';
// import { skapi } from '@/main';

// const getUser = async () => {
//   try {
//     const profile = await skapi.getProfile();
//     console.log('profile : ', profile);

//     if (profile === null) {
//       console.log('로그인이 필요합니다.');
//     } else {
//       user.value.name = profile.name;
//       user.value.access_group = profile.access_group;
//       user.value.user_id = profile.user_id;
//     }
//   } catch (error) {
//     console.error('프로필을 가져오는 중 오류 발생:', error);
//   }
// };

// export { getUser };
