require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const {generateQrCodeImageBytes, uploadImage} = require('../services/qrCodeService')

async function generateQrCodeUrl(token) {
    try {
        // 1. Génération de l'ID unique et du contenu du QR code
        const qrCodeUniqueId = uuidv4();
        const qrContent = process.env.BASE_URL + "/api/qrcode/view/" + token;
        // 2. Génération de l'image QR code EN MÉMOIRE
        const logoFileName = "Logo-SSAC.jpg"; // Le nom du fichier dans firebase storage
        const buffer = await generateQrCodeImageBytes(qrContent, 300, 300, logoFileName);
        fs.writeFileSync('qrcode.png', buffer);
        console.log('✅ QR Code généré avec succès !');
        // 3. Upload de l'image sur Firebase Storage
        const qrCodeFirebaseUrl = await uploadImage(buffer, qrCodeUniqueId);
        const data = {
            buffer: buffer,
            publicUrl: qrCodeFirebaseUrl
        };
        // console.log('data ::', data);
        return data;
    } catch (error) {
        console.error('GENERATE QR-CODE-URL ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {generateQrCodeUrl};