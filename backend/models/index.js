const { initCheckin_ParametersModel } = require('./checkin_parameters');
const { initCheckinModel } = require('./checkins');
const { initEventSchedulesModel } = require('./event_schedules');
const { initEventsModel } = require('./events');
const { initGuestModel } = require('./guests');
const { initInvitationModel } = require('./invitations');
const { initLinkModel } = require('./links');
const { initNotificationModel } = require('./notification');
const { initUserNewsModel } = require('./usernews');
const {initUserModel} = require('./users');


const initModels = async () => {
  await initUserModel();
  await initUserNewsModel();
  await initEventsModel();
  await initEventSchedulesModel();
  await initGuestModel();
  await initInvitationModel();
  await initCheckinModel();
  await initNotificationModel();
  await initLinkModel();
  await initCheckin_ParametersModel();
};

module.exports = {
  initModels
};