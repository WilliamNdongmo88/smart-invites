exports.up = async function (knex) {
  //Évite l’erreur Duplicate column name
  //Migration idempotente
  const hasColumn = await knex.schema.hasColumn('EVENTS', 'banquet_time');
  if(!hasColumn){
    return knex.schema.table('EVENTS', function (table) {
      table.time('banquet_time').nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('EVENTS', 'banquet_time');
  if(!hasColumn){
    return knex.schema.table('EVENTS', function (table) {
      table.dropColumn('banquet_time');
    });
  }
};