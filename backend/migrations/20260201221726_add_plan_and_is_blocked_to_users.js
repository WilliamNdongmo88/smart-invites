exports.up = async function (knex) {
  // Migration idempotente
  const hasPlan = await knex.schema.hasColumn('USERS', 'plan');
  const hasAcceptTerms = await knex.schema.hasColumn('USERS', 'accept_terms');
  const hasIsBlocked = await knex.schema.hasColumn('USERS', 'is_blocked');

  return knex.schema.alterTable('USERS', (table) => {
    if (!hasPlan) {
      table.string('plan', 50).notNullable().defaultTo('gratuit');
    }
    if (!hasAcceptTerms) {
      table.boolean('accept_terms');
    }
    if (!hasIsBlocked) {
      table.boolean('is_blocked').notNullable().defaultTo(false);
    }
  });
};

exports.down = async function (knex) {
  const hasPlan = await knex.schema.hasColumn('USERS', 'plan');
  const hasAcceptTerms = await knex.schema.hasColumn('USERS', 'accept_terms');
  const hasIsBlocked = await knex.schema.hasColumn('USERS', 'is_blocked');

  return knex.schema.alterTable('USERS', (table) => {
    if (hasPlan) {
      table.dropColumn('plan');
    }
    if (hasAcceptTerms) {
      table.dropColumn('accept_terms');
    }
    if (hasIsBlocked) {
      table.dropColumn('is_blocked');
    }
  });
};
