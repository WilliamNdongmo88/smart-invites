const { initEventsModel } = require('./events');
const { initGuestModel } = require('./guests');
const { initInvitationModel } = require('./invitations');
const {initUserModel} = require('./users');


const initModels = async () => {
  await initUserModel();
  await initEventsModel();
  await initGuestModel();
  await initInvitationModel();
};

module.exports = {
  initModels
};