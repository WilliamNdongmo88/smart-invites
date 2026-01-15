const pool = require('../config/bd');

const initEventInvitationNotesModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS EVENT_INVITATION_NOTES (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      event_id INT UNSIGNED NOT NULL,
      title VARCHAR(255),
      main_message TEXT,
      sous_main_message TEXT,
      event_theme VARCHAR(255),
      priority_colors VARCHAR(255),
      qr_instructions VARCHAR(255),
      dress_code_message VARCHAR(255),
      thanks_message1 VARCHAR(255),
      closing_message VARCHAR(255),
      title_color VARCHAR(255),
      top_band_color VARCHAR(255),
      bottom_band_color VARCHAR(255),
      text_color VARCHAR(255),
      logo_url VARCHAR(255),
      heart_icon_url VARCHAR(255),
      FOREIGN KEY (event_id) REFERENCES EVENTS(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Table EVENT_INVITATION_NOTES prête !');
};

async function creatEventInvitNote(eventId, title, mainMessage, sousMainMessage, eventTheme, 
  priorityColors, qrInstructions, dressCodeMessage, thanksMessage1, closingMessage, titleColor, 
  topBandColor, bottomBandColor, textColor, logoUrl, heartIconUrl) {
  const [result] = await pool.query(`
      INSERT INTO EVENT_INVITATION_NOTES (event_id,
                                          title,
                                          main_message,
                                          sous_main_message,
                                          event_theme,
                                          priority_colors,
                                          qr_instructions,
                                          dress_code_message,
                                          thanks_message1,
                                          closing_message,
                                          title_color,
                                          top_band_color,
                                          bottom_band_color,
                                          text_color,
                                          logo_url,
                                          heart_icon_url
                                          )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `,[eventId, title, mainMessage, sousMainMessage, eventTheme, 
  priorityColors, qrInstructions, dressCodeMessage, thanksMessage1, closingMessage, titleColor, 
  topBandColor, bottomBandColor, textColor, logoUrl, heartIconUrl]);

  return result;
};

async function getEventInvitNote(eventId) {
  const [result] = await pool.query(`
      SELECT *
      FROM EVENT_INVITATION_NOTES
      WHERE event_id=?
  `,[eventId]);

  return result[0];
};

async function updateEventInvitNote(id, eventId, title, mainMessage, sousMainMessage, eventTheme, 
  priorityColors, qrInstructions, dressCodeMessage, thanksMessage1, closingMessage, titleColor, 
  topBandColor, bottomBandColor, textColor, logoUrl, heartIconUrl) {
  const [result] = await pool.query(`
    UPDATE EVENT_INVITATION_NOTES 
    SET event_id=?,
        title=?,
        main_message=?,
        sous_main_message=?,
        event_theme=?,
        priority_colors=?,
        qr_instructions=?,
        dress_code_message=?,
        thanks_message1=?,
        closing_message=?,
        title_color=?,
        top_band_color=?,
        bottom_band_color=?,
        text_color=?,
        logo_url=?,
        heart_icon_url=?
    WHERE id=?
  `, [eventId, title, mainMessage, sousMainMessage, eventTheme, 
  priorityColors, qrInstructions, dressCodeMessage, thanksMessage1, closingMessage, titleColor, 
  topBandColor, bottomBandColor, textColor, logoUrl, heartIconUrl, id]);

  return result.insertId;
}

module.exports = {initEventInvitationNotesModel, creatEventInvitNote, 
                  getEventInvitNote, updateEventInvitNote}