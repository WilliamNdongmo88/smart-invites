const {initUserModel} = require('./users');


const initModels = async () => {
  await initUserModel();
};

module.exports = {
  initModels
};