exports.up = async function(knex) {
    await knex.schema.alterTable('INVITATIONS', (table) => {

        table.string('chat_id')
            .nullable();

        table.boolean('is_invitation_sent')
            .notNullable()
            .defaultTo(false);
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('INVITATIONS', (table) => {

        table.dropColumn('chat_id');

        table.dropColumn('is_invitation_sent');
    });
};