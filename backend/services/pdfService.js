const PDFDocument = require('pdfkit');
const admin = require('firebase-admin');
const path = require('path');

// Fonction pour générer un PDF personnalisé
async function generateGuestPdf(guest) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 40 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Fond doux
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fffaf5");

    // 💍 Image décorative (à la place de l’emoji)
    doc.image(path.join(__dirname, "../assets/icons/ring.png"), doc.page.width / 2 - 20, 40, { width: 40 });

   doc.moveDown(4);
   doc.fillColor("#b58b63").font("Times-Bold").fontSize(26)
      .text("Célébrons l’Amour", { align: "center" });

   doc.moveDown(0.5);
   doc.fillColor("#777").fontSize(14).font("Helvetica-Oblique")
      .text("Nous avons la joie de vous convier à notre mariage", { align: "center" });

   doc.moveDown(2);
   doc.fillColor("#333").font("Times-Italic").fontSize(16);

   if (guest.has_plus_one) {
   doc.text(
      `Cher/Chère ${guest.full_name} et votre invité(e) ${guest.plus_one_name}`,
      { align: "center" }
   );
   } else {
   doc.text(
      `Cher/Chère ${guest.full_name},`,
      { align: "center" }
   );
   }

   doc.moveDown(1);
   doc.font("Helvetica").fontSize(13).fillColor("#444")
      .text(`C’est avec un immense bonheur que nous vous invitons à célébrer notre union entourés 
         de nos familles et de nos amis, lors d’une journée qui restera gravée dans nos cœurs.`,
      { align: "center", lineGap: 6 }
      );

   doc.moveDown(1);
   doc.font("Helvetica-Oblique").fillColor("#888")
      .text("Votre présence illuminera ce jour si spécial pour nous.", { align: "center" });

   doc.moveDown(2);
   doc.font("Helvetica-Bold").fontSize(14).fillColor("#b58b63")
      .text(`Les futurs mariés : ${guest.event_name_concerned1} et ${guest.event_name_concerned2}`, { align: "center" })

   doc.image(path.join(__dirname, "../assets/icons/heart.png"), doc.page.width / 2 - 10, doc.y + 10, { width: 20 });

   doc.end();
  });
}

// Fonction pour uploader sur Firebase Storage
async function uploadPdfToFirebase(guest, pdfBuffer) {
  const bucket = admin.storage().bucket();
  let fileName = null;
  if(guest.id!=undefined) fileName = `pdfs/carte_${guest.id}.pdf`;
  if(guest.guest_id!=undefined) fileName = `pdfs/carte_${guest.guest_id}.pdf`;
  const file = bucket.file(fileName);

  await file.save(pdfBuffer, { contentType: 'application/pdf' });
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-01-2030',
  });

  return url;
}

module.exports = { generateGuestPdf, uploadPdfToFirebase };
