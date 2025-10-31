const { initEventsModel } = require('./events');
const { initGuestModel } = require('./guests');
const {initUserModel} = require('./users');


const initModels = async () => {
  await initUserModel();
  await initEventsModel();
  await initGuestModel();
};

module.exports = {
  initModels
};