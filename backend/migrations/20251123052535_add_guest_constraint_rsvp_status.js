exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE GUESTS
      DROP CONSTRAINT valid_rsvp_status,
      ADD CONSTRAINT valid_rsvp_status
      CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'present'));
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE GUESTS
      DROP CONSTRAINT valid_rsvp_status,
      ADD CONSTRAINT valid_rsvp_status
      CHECK (rsvp_status IN ('pending', 'confirmed', 'declined'));
  `);
};
