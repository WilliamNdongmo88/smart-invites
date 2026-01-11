exports.up = function(knex) {
  return knex.schema.alterTable('USERS', (table) => {
    table.boolean('attendance_notifications').notNullable().defaultTo(true).alter();
    table.boolean('thank_notifications').notNullable().defaultTo(true).alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('USERS', (table) => {
    table.boolean('attendance_notifications').notNullable().defaultTo(false).alter();
    table.boolean('thank_notifications').notNullable().defaultTo(false).alter();
  });
};
