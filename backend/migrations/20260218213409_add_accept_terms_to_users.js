exports.up = async function (knex) {
  // Migration idempotente
  const hasAcceptTerms = await knex.schema.hasColumn('USERS', 'accept_terms');
  return knex.schema.alterTable('USERS', (table) => {
    if (!hasAcceptTerms) {
      table.boolean('accept_terms');
    }
  });
};

exports.down = async function (knex) {
  const hasAcceptTerms = await knex.schema.hasColumn('USERS', 'accept_terms');

  return knex.schema.alterTable('USERS', (table) => {
    if (hasAcceptTerms) {
      table.dropColumn('accept_terms');
    }
  });
};
