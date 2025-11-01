const { bucket } = require('../config/firebaseConfig');

async function deleteGuestFiles(guestId, invitationToken) {
  if (!guestId) throw new Error("Guest ID manquant pour la suppression des fichiers");

  const pdfPath = `pdfs/carte_${guestId}.pdf`;
  const qrPath = `qrcodes/${invitationToken}.png`;

  const pdfFile = bucket.file(pdfPath);
  const qrFile = bucket.file(qrPath);

  try {
    const [pdfExists] = await pdfFile.exists();
    if (pdfExists) {
      await pdfFile.delete();
      console.log(`🗑️ PDF supprimé: ${pdfPath}`);
    }

    const [qrExists] = await qrFile.exists();
    if (qrExists) {
      await qrFile.delete();
      console.log(`🗑️ QR supprimé: ${qrPath}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression des fichiers Firebase:", error);
    throw new Error("Erreur suppression fichiers Firebase");
  }
}

module.exports = { deleteGuestFiles };
