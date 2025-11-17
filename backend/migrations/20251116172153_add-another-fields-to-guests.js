exports.up = function(knex) {
  return knex.schema.alterTable('GUESTS', function(table) {
    table.string('dietary_restrictions', 255).nullable();
    table.string('plus_one_name_diet_restr', 255).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('GUESTS', function(table) {
    table.dropColumn('dietary_restrictions');
    table.dropColumn('plus_one_name_diet_restr');
  });
};