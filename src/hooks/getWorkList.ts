// import { skapi } from '@/main';

// const createStartWork = async ({ data, user_id }) => {
//   try {
//     const config = {
//       table: 'my_startWork_time',
//       // access_group: 'public',
//       // record_id: user_id,
//     };

//     return await skapi.postRecord(data, config);
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// const getUserWorkList = async () => {
//   try {
//     const query = {
//       table: 'my_startWork_time',
//     };

//     const res = await skapi.getRecords(query);
//     const list = res.list;
//     const startWorkList = list[list.length - 1] || {}; // 객체로 받음

//     const workList = startWorkList.data?.startWork || [];

//     window.localStorage.setItem('currentRecord', JSON.stringify(startWorkList));

//     return workList;
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// const addStartWork = async ({ data }) => {
//   const currentRecord = JSON.parse(window.localStorage.getItem('currentRecord'));

//   console.log('== currentRecord == : ', currentRecord);

//   if (!currentRecord) return;

//   try {
//     const query = {
//       table: 'my_startWork_time',
//       record_id: currentRecord.record_id,
//       access_group: 'public',
//     };

//     console.log('== currentRecord == : ', currentRecord);

//     return await skapi.postRecord(data, query);
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// export { createStartWork, getUserWorkList, addStartWork };
