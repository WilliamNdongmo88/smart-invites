const { initEventsModel } = require('./events');
const {initUserModel} = require('./users');


const initModels = async () => {
  await initUserModel();
  await initEventsModel();
};

module.exports = {
  initModels
};