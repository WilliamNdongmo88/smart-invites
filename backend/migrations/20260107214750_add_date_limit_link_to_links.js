exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('LINKS', 'date_limit_link');

  if (!hasColumn) {
    return knex.schema.table('LINKS', function (table) {
      table.date('date_limit_link').nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('LINKS', 'date_limit_link');

  if (hasColumn) {
    return knex.schema.table('LINKS', function (table) {
      table.dropColumn('date_limit_link');
    });
  }
};
