exports.up = function(knex) {
  return knex.schema.alterTable('GUESTS', function(table) {
    table.boolean('guest_has_plus_one_autorise_by_admin')
         .defaultTo(false)
         .nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('GUESTS', function(table) {
    table.dropColumn('guest_has_plus_one_autorise_by_admin');
  });
};