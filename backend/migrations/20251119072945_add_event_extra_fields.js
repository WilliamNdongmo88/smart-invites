exports.up = async function (knex) {
  const hasType = await knex.schema.hasColumn("EVENTS", "type");
  const hasBudget = await knex.schema.hasColumn("EVENTS", "budget");
  const hasEventName1 = await knex.schema.hasColumn("EVENTS", "event_name_concerned1");
  const hasEventName2 = await knex.schema.hasColumn("EVENTS", "event_name_concerned2");

  return knex.schema.alterTable("EVENTS", function (table) {
    if (!hasType) table.string("type", 50).defaultTo(null);
    if (!hasBudget) table.string("budget", 50).defaultTo(null);
    if (!hasEventName1) table.string("event_name_concerned1", 50).defaultTo(null);
    if (!hasEventName2) table.string("event_name_concerned2", 50).defaultTo(null);
  });
};

exports.down = async function (knex) {
  const hasType = await knex.schema.hasColumn("EVENTS", "type");
  const hasBudget = await knex.schema.hasColumn("EVENTS", "budget");
  const hasEventName1 = await knex.schema.hasColumn("EVENTS", "event_name_concerned1");
  const hasEventName2 = await knex.schema.hasColumn("EVENTS", "event_name_concerned2");

  return knex.schema.alterTable("EVENTS", function (table) {
    if (hasType) table.dropColumn("type");
    if (hasBudget) table.dropColumn("budget");
    if (hasEventName1) table.dropColumn("event_name_concerned1");
    if (hasEventName2) table.dropColumn("event_name_concerned2");
  });
};
