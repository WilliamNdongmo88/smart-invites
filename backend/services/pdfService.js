const PDFDocument = require('pdfkit');
const admin = require('firebase-admin');
const path = require('path');
require('pdfkit-table');

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

// Fonction pour générer la liste des invité confirmé en pdf
async function generatePresentGuestsPdf(guests = [], event) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Constantes de mise en page
    const startX = 40; //Marge a gauche du tableau
    const endX = 570;
    const tableWidth = endX - startX;
    const rowHeight = 25;
    const headerHeight = 25;
    // Limite Y pour le contenu avant d'ajouter une nouvelle page (ajustée pour la marge)
    const maxPageY = doc.page.height - doc.page.margins.bottom - rowHeight - 5; 
    const startY = doc.page.margins.top; // Position Y de départ pour le contenu de la page

    // --- TITRE ---
    let rsvp_status = '';
    switch (event.guestRsvpStatus) {
      case 'confirmed':
         rsvp_status = 'confirmés'
         color = '#2ecc71'
         break;
      case 'present':
         rsvp_status = 'présents'
         color = '#219E4f'
         break;
      case 'pending':
         rsvp_status = 'en attentes'
         color = '#EAB308'
         break;
      case 'declined':
         rsvp_status = 'déclinés'
         color = '#EF4444'
         break;   
    }
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#2d2d2d");
    doc.text(`Liste des invités ${rsvp_status}`, { align: "center" });
    doc.moveDown(1.5);

    // --- INFOS MARIAGE ---
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#b58b63");
    doc.text(`${event.eventTitle}`);
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#2d2d2d")
    .text("Date et heure :");
    doc.fontSize(10).font("Helvetica").text(`${event.eventDate} à ${event.eventTime}`);
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#2d2d2d")
    .text("Lieu :");
    doc.fontSize(10).font("Helvetica").text(`${event.eventLocation}`);
    doc.moveDown(1);

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#2d2d2d")
    .text(`Nombre d'invité(s) : ${guests.length}`);

    // --- COLUMNS ---
    const columns = [
      { label: "Nom", key: "name", width: 140 },
      { label: "Nom +1", key: "plusOneName", width: 120 },
      { label: "Restrictions", key: "dietaryRestrictions", width: 100 },
      { label: "Restrictions +1", key: "plusOnedietaryRestrictions", width: 110 },
      { label: "Statut", key: "status", width: 80 },
    ];

    // Fonction pour dessiner l'en-tête du tableau
    function drawTableHeader(y) {
      // Fond de l'en-tête
      doc.fillColor("#f5f5f5");
      doc.rect(startX, y, tableWidth, headerHeight).fill();

      // Texte de l'en-tête
      doc.fillColor("#000").font("Helvetica-Bold").fontSize(10);

      let x = startX + 10;
      columns.forEach((col) => {
        doc.text(col.label, x, y + 7, { width: col.width });
        x += col.width;
      });

      // Ligne sous l'en-tête
      y += headerHeight;
      doc.moveTo(startX, y).lineTo(endX, y).strokeColor("#ddd").stroke();
      
      return y;
    }

    // Position Y actuelle après les informations de l'événement
    let y = doc.y + 10;

    // Dessiner l'en-tête initial
    y = drawTableHeader(y);

    // --- ROWS ---
    doc.font("Helvetica").fontSize(9).fillColor("#222");

    guests.forEach((g) => {
      // Vérifier si la prochaine ligne dépasse la limite de la page
      // On vérifie si y + hauteur_ligne + marge_basse > limite_max
      // La limite est ajustée pour s'assurer qu'il y a assez de place pour la ligne complète
      if (y + rowHeight + 5 > maxPageY) {
        doc.addPage();
        y = startY; // Réinitialiser Y au début de la nouvelle page (marge supérieure)
        y = drawTableHeader(y); // Dessiner l'en-tête sur la nouvelle page
      }

      // Marge supérieure pour la ligne
      y += 5; 
      let currentY = y;
      let x = startX + 10;

      // Fond de la ligne
      doc.fillColor("#ffffff");
      doc.rect(startX, currentY - 5, tableWidth, rowHeight).fill();
      doc.fillColor("#222");

      // Colonnes
      columns.forEach((col) => {
        let value = g[col.key];

        if (col.key === "plusOneName" && !g.plusOne) value = "-";
        if (col.key === "plusOnedietaryRestrictions" && !g.plusOne) value = "-";

        // Badge "Présent"
        if (col.key === "status") {
          doc.fillColor(`${color}`);
          doc.font("Helvetica-Bold");
          // Utilisation de currentY + 2 pour aligner le texte dans la ligne
          doc.text(`${rsvp_status}`, x, currentY + 2, { width: col.width });
          doc.font("Helvetica").fillColor("#222");
        } else {
          // Utilisation de currentY + 2 pour aligner le texte dans la ligne
          doc.text(value || "-", x, currentY + 2, { width: col.width });
        }

        x += col.width;
      });

      // Mettre à jour la position Y pour la ligne suivante
      y = currentY + rowHeight;

      // Ligne séparatrice
      doc.moveTo(startX, y).lineTo(endX, y).strokeColor("#eee").stroke();
    });

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

module.exports = { generateGuestPdf, uploadPdfToFirebase, generatePresentGuestsPdf };
