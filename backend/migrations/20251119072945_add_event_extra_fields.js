exports.up = async function (knex) {
  const hasType = await knex.schema.hasColumn("EVENTS", "type");
  if (!hasType) {
    await knex.schema.alterTable("EVENTS", (table) => {
      table.string("type", 50).defaultTo(null);
    });
  }

  const hasBudget = await knex.schema.hasColumn("EVENTS", "budget");
  if (!hasBudget) {
    await knex.schema.alterTable("EVENTS", (table) => {
      table.string("budget", 50).defaultTo(null);
    });
  }

  const hasEventName1 = await knex.schema.hasColumn("EVENTS", "event_name_concerned1");
  if (!hasEventName1) {
    await knex.schema.alterTable("EVENTS", (table) => {
      table.string("event_name_concerned1", 50).defaultTo(null);
    });
  }

  const hasEventName2 = await knex.schema.hasColumn("EVENTS", "event_name_concerned2");
  if (!hasEventName2) {
    await knex.schema.alterTable("EVENTS", (table) => {
      table.string("event_name_concerned2", 50).defaultTo(null);
    });
  }
};

exports.down = async function (knex) {
  const hasType = await knex.schema.hasColumn("EVENTS", "type");
  if (hasType) {
    await knex.schema.alterTable("EVENTS", (table) => {
      table.dropColumn("type");
    });
  }

  const hasBudget = await knex.schema.hasColumn("EVENTS", "budget");
  if (hasBudget) {
    await knex.schema.alterTable("EVENTS", (table) => {
      table.dropColumn("budget");
    });
  }

  const hasEventName1 = await knex.schema.hasColumn("EVENTS", "event_name_concerned1");
  if (hasEventName1) {
    await knex.schema.alterTable("EVENTS", (table) => {
      table.dropColumn("event_name_concerned1");
    });
  }

  const hasEventName2 = await knex.schema.hasColumn("EVENTS", "event_name_concerned2");
  if (hasEventName2) {
    await knex.schema.alterTable("EVENTS", (table) => {
      table.dropColumn("event_name_concerned2");
    });
  }
};
