exports.up = function (knex) {
  return knex.schema.alterTable("GUESTS", function (table) {
    table.string("dietary_restrictions", 255).defaultTo(null);
    table.string("plus_one_name_diet_restr", 255).defaultTo(null);
    table.boolean("guest_has_plus_one_autorise_by_admin")
      .notNullable()
      .defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("GUESTS", function (table) {
    table.dropColumn("dietary_restrictions");
    table.dropColumn("plus_one_name_diet_restr");
    table.dropColumn("guest_has_plus_one_autorise_by_admin");
  });
};
