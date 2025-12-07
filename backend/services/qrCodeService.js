const { bucket} = require('../config/firebaseConfig');
const QRCode = require('qrcode');
const sharp = require('sharp');

// Retourne l’URL Firebase directement plus légé et rapide
async function getLogoUrlFromFirebase(filename) {
  const file = bucket.file(`logos/${filename}`);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 24 * 60 * 60 * 1000, // URL valide 60 jours
  });

  return url;
}

async function getLogoFromFirebase(logoFileName) {
  const file = bucket.file(`logos/${logoFileName}`);
  const [exists] = await file.exists();
  if (!exists) throw new Error(`Logo ${logoFileName} introuvable dans Firebase.`);
  const [buffer] = await file.download();
  return buffer;
}

async function generateGuestQr(guestId, token, logoFileName = null) {
  const url = process.env.BASE_URL + "/api/invitation/view/" + guestId +':'+ token;

  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    width: 300,
    color: { dark: "#876c36ff", light: "#ffffff" },
  });

  let qrImage = sharp(qrBuffer);

  if (logoFileName) {
    const logoBuffer = await getLogoFromFirebase(logoFileName);
    const logoSize = Math.floor(300 * 0.3);
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();

    const centerX = Math.floor((300 - logoSize) / 2);
    const centerY = Math.floor((300 - logoSize) / 2);
    qrImage = qrImage.composite([{ input: resizedLogo, top: centerY, left: centerX }]);
  }

  const finalQr = await qrImage.png().toBuffer();
  const filePath = `qrcodes/${token}.png`;

  await bucket.file(filePath).save(finalQr, { contentType: "image/png" });

  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

module.exports = {generateGuestQr, getLogoUrlFromFirebase};