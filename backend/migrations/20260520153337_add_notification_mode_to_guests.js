exports.up = async function(knex) {
    await knex.schema.alterTable('GUESTS', (table) => {
        table.string('notification_mode')
            .notNullable()
            .defaultTo('email');
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('GUESTS', (table) => {
        table.dropColumn('notification_mode');
    });
};