exports.up = function (knex) {
  return knex.schema.alterTable("EVENTS", function (table) {
    table.string("type", 50).notNullable();
    table.string("budget", 50).notNullable();
    table.string("event_name_concerned1", 50).notNullable();
    table.string("event_name_concerned2", 50).notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("EVENTS", function (table) {
    table.dropColumn("type");
    table.dropColumn("budget");
    table.dropColumn("event_name_concerned1");
    table.dropColumn("event_name_concerned2");
  });
};
