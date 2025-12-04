const { initCheckinModel } = require('./checkins');
const { initEventSchedulesModel } = require('./event_schedules');
const { initEventsModel } = require('./events');
const { initGuestModel } = require('./guests');
const { initInvitationModel } = require('./invitations');
const { initLinkModel } = require('./links');
const { initNotificationModel } = require('./notification');
const {initUserModel} = require('./users');


const initModels = async () => {
  await initUserModel();
  await initEventsModel();
  await initEventSchedulesModel();
  await initGuestModel();
  await initInvitationModel();
  await initCheckinModel();
  await initNotificationModel();
  await initLinkModel();
};

module.exports = {
  initModels
};