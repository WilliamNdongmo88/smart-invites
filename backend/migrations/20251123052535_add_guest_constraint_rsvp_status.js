exports.up = async function (knex) {
  await knex.raw("SET SESSION lock_wait_timeout = 60;");
  await knex.raw(`
    ALTER TABLE GUESTS MODIFY rsvp_status 
    ENUM('pending','confirmed','declined','present') NOT NULL;
  `);
};

exports.down = async function (knex) {
  await knex.raw("SET SESSION lock_wait_timeout = 60;");
  await knex.raw(`
    ALTER TABLE GUESTS MODIFY rsvp_status 
    ENUM('pending','confirmed','declined') NOT NULL;
  `);
};