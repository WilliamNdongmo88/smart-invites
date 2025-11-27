const { initCheckinModel } = require('./checkins');
const { initEventSchedulesModel } = require('./event_schedules');
const { initEventsModel } = require('./events');
const { initGuestModel } = require('./guests');
const { initInvitationModel } = require('./invitations');
const {initUserModel} = require('./users');


const initModels = async () => {
  await initUserModel();
  await initEventsModel();
  await initEventSchedulesModel();
  await initGuestModel();
  await initInvitationModel();
  await initCheckinModel();
};

module.exports = {
  initModels
};