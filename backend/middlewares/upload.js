const multer = require('multer');

// Configuration pour garder le fichier en mémoire
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les fichiers PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // Accepter le fichier
  } else {
    cb(new Error('Format de fichier non supporté ! Seuls les PDF sont acceptés.'), false); // Rejeter le fichier
  }
};

// On exporte le middleware Multer configuré
module.exports = multer({ storage: storage, fileFilter: fileFilter }).single('pdfFile');
