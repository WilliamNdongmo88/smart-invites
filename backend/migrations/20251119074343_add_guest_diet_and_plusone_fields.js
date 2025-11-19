const e = require("express");

exports.up = async function (knex) {
  const dietaryRestrictions = await knex.schema.hasColumn("GUESTS", "dietary_restrictions");
  const plusOneNameDietRestr = await knex.schema.hasColumn("GUESTS", "plus_one_name_diet_restr");
  const guestHasPlusOneAutoriseByAdmin = await knex.schema.hasColumn("GUESTS", "guest_has_plus_one_autorise_by_admin");

  return knex.schema.alterTable("GUESTS", function (table) {
    if (!dietaryRestrictions) table.string("dietary_restrictions", 50).defaultTo(null);
    if (!plusOneNameDietRestr) table.string("plus_one_name_diet_restr", 50).defaultTo(null);
    if (!guestHasPlusOneAutoriseByAdmin) table.boolean("guest_has_plus_one_autorise_by_admin").notNullable().defaultTo(false);
  });
};

exports.down = async function (knex) {
  const dietaryRestrictions = await knex.schema.hasColumn("GUESTS", "dietary_restrictions");
  const plusOneNameDietRestr = await knex.schema.hasColumn("GUESTS", "plus_one_name_diet_restr");
  const guestHasPlusOneAutoriseByAdmin = await knex.schema.hasColumn("GUESTS", "guest_has_plus_one_autorise_by_admin");

  return knex.schema.alterTable("GUESTS", function (table) {
    if (dietaryRestrictions) table.dropColumn("dietary_restrictions");
    if (plusOneNameDietRestr) table.dropColumn("plus_one_name_diet_restr");
    if (guestHasPlusOneAutoriseByAdmin) table.dropColumn("guest_has_plus_one_autorise_by_admin");
  });
};

