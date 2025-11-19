exports.up = function (knex) {
  return knex.schema.alterTable("EVENTS", function (table) {
    table.string("type", 50).defaultTo();
    table.string("budget", 50).defaultTo();
    table.string("event_name_concerned1", 50).defaultTo();
    table.string("event_name_concerned2", 50).defaultTo();
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
