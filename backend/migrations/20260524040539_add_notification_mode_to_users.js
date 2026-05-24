exports.up = async function(knex) {
    await knex.schema.alterTable('USERS', (table) => {
        table.string('notification_mode')
            .notNullable()
            .defaultTo('email');
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('USERS', (table) => {
        table.dropColumn('notification_mode');
    });
};