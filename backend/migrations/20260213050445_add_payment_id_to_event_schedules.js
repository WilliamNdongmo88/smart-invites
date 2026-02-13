exports.up = function (knex) {
  return knex.schema.alterTable('EVENT_SCHEDULES', function (table) {
    table
      .integer('payment_id')
      .unsigned()
      .notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('EVENT_SCHEDULES', function (table) {
    table.dropColumn('payment_id');
  });
};
