exports.up = function (knex) {
  return knex.schema.alterTable('EVENTS', function (table) {
    table.time('banquet_time').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('EVENTS', function (table) {
    table.dropColumn('banquet_time');
  });
};