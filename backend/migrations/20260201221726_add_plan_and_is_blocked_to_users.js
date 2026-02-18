exports.up = async function (knex) {
  // Migration idempotente
  const hasPlan = await knex.schema.hasColumn('USERS', 'plan');
  const hasIsBlocked = await knex.schema.hasColumn('USERS', 'is_blocked');

  return knex.schema.alterTable('USERS', (table) => {
    if (!hasPlan) {
      table
        .string('plan', 50)
        .notNullable()
        .defaultTo('gratuit');
    }

    if (!hasIsBlocked) {
      table
        .boolean('is_blocked')
        .notNullable()
        .defaultTo(false);
    }
  });
};

exports.down = async function (knex) {
  const hasPlan = await knex.schema.hasColumn('USERS', 'plan');
  const hasIsBlocked = await knex.schema.hasColumn('USERS', 'is_blocked');

  return knex.schema.alterTable('USERS', (table) => {
    if (hasPlan) {
      table.dropColumn('plan');
    }

    if (hasIsBlocked) {
      table.dropColumn('is_blocked');
    }
  });
};
