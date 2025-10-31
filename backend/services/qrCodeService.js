const { bucket } = require('../config/firebaseConfig');
const QRCode = require('qrcode');
const sharp = require('sharp');
const path = require('path');

// Génère un QR code avec logo centré, retourne un buffer PNG.
async function generateQrCodeImageBytes(text, width, height, logoFileName = null) {
  try {
    // 1 Génération du QR code brut en buffer PNG
    const qrBuffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width,
      color: {
        dark: '#594732ff',
        light: '#FFFFFFFF',
      },
    });

    // 2 Prépare l'image Sharp à partir du QR code
    let qrImage = sharp(qrBuffer).resize(width, height);

    // 3 Si un logo est demandé, le télécharger et le combiner
    if (logoFileName) {
      const logoBuffer = await getLogoFromFirebase(logoFileName);
      if (logoBuffer) {
        // Redimensionner le logo pour qu'il fasse ~20% de la taille du QR code
        const logoSize = Math.floor(width * 0.3);
        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();

        // 4 Calculer les coordonnées du centre
        const centerX = Math.floor((width - logoSize) / 2);
        const centerY = Math.floor((height - logoSize) / 2);

        // 5 Composer le logo sur le QR code
        qrImage = qrImage
          .composite([
            { input: resizedLogo, top: centerY, left: centerX },
          ])
          .png();
      }
    }

    // 6 Retourner le buffer PNG final
    return await qrImage.toBuffer();

  } catch (err) {
    console.error('❌ Erreur lors de la génération du QR code :', err);
    throw err;
  }
};

// Télécharge un logo depuis Firebase Storage et le convertit en buffer.
async function getLogoFromFirebase(logoFileName) {
  if (!logoFileName) return null;

  try {
    // Vérifie les fichiers disponibles dans ton bucket Firebase
    const [files] = await bucket.getFiles();
    console.log("fichiers disponibles :: ",files.map(f => f.name));

    const file = bucket.file(`logos/${logoFileName}`);
    const [exists] = await file.exists();

    if (!exists) {
      console.warn(`⚠️ Le fichier ${logoFileName} n'existe pas dans Firebase Storage.`);
      return null;
    }

    // Télécharge en mémoire (buffer)
    const [fileBuffer] = await file.download();
    console.log(`✅ Logo ${logoFileName} récupéré depuis Firebase Storage.`);

    // Vérifie que c’est bien une image
    const metadata = await sharp(fileBuffer).metadata();
    if (!metadata || !metadata.format) {
      throw new Error('Le fichier n’est pas une image valide.');
    }

    return fileBuffer;
  } catch (err) {
    console.error(`❌ Erreur lors de la récupération du logo : ${err.message}`);
    return null;
  }
}

// Upload un buffer d'image sur Firebase Storage
async function uploadImage(buffer, qrCodeUniqueId) {

  // Chemin dans le bucket
  const file = bucket.file(`qrcodes/${qrCodeUniqueId}.png`);

  // Upload du buffer
  await file.save(buffer, {
    metadata: {
      contentType: 'image/png',
    },
    public: true,
  });

  // Récupère l'URL publique
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
  return publicUrl;
}


module.exports = {generateQrCodeImageBytes, uploadImage};