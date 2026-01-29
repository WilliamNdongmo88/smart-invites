exports.up = async function (knex) {
  const tableName = 'EVENT_INVITATION_NOTES';

  const hasHasInvitationModelCard = await knex.schema.hasColumn(
    tableName,
    'has_invitation_model_card'
  );

  const hasCode = await knex.schema.hasColumn(
    tableName,
    'code'
  );

  const hasPdfUrl = await knex.schema.hasColumn(
    tableName,
    'pdf_url'
  );

  await knex.schema.alterTable(tableName, (table) => {
    if (!hasHasInvitationModelCard) {
      table
        .boolean('has_invitation_model_card')
        .notNullable()
        .defaultTo(false);
    }

    if (!hasCode) {
      table
        .string('code', 100)
        .nullable();
    }

    if (!hasPdfUrl) {
      table.text('pdf_url');
    }
  });
};

exports.down = async function (knex) {
  const tableName = 'EVENT_INVITATION_NOTES';

  const hasHasInvitationModelCard = await knex.schema.hasColumn(
    tableName,
    'has_invitation_model_card'
  );

  const hasCode = await knex.schema.hasColumn(
    tableName,
    'code'
  );

  const hasPdfUrl = await knex.schema.hasColumn(
    tableName,
    'pdf_url'
  );

  await knex.schema.alterTable(tableName, (table) => {
    if (hasPdfUrl) {
      table.dropColumn('pdf_url');
    }

    if (hasCode) {
      table.dropColumn('code');
    }

    if (hasHasInvitationModelCard) {
      table.dropColumn('has_invitation_model_card');
    }
  });
};
