exports.up = async function (knex) {
  // 1. DROPPER l'ancienne contrainte
  await knex.raw(`
    ALTER TABLE GUESTS DROP CHECK valid_rsvp_status;
  `);

  // 2. RE-AJOUTER la contrainte avec la nouvelle valeur
  await knex.raw(`
    ALTER TABLE GUESTS
    ADD CONSTRAINT valid_rsvp_status
    CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'present'));
  `);
};

exports.down = async function (knex) {
  // rollback : enlever "present"
  await knex.raw(`
    ALTER TABLE GUESTS DROP CHECK valid_rsvp_status;
  `);

  await knex.raw(`
    ALTER TABLE GUESTS
    ADD CONSTRAINT valid_rsvp_status
    CHECK (rsvp_status IN ('pending', 'confirmed', 'declined'));
  `);
};
