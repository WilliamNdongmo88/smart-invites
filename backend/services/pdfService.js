const PDFDocument = require('pdfkit');
const admin = require('firebase-admin');
const path = require('path');
require('pdfkit-table');

async function generateGuestPdf(data, plusOneName = null) {
  console.log('[generateGuestPdf] data: ', data);
  const guest = data;
  const event = data;

  const eventDate = new Date((event.event_date || event.eventDate)).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const time = new Date((event.event_date || event.eventDate)).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // const banquetTime = event.banquet_time?.replace(':00', '');
  const banquetTime = (event.banquet_time || event.banquetTime)?.replace(':00', '');
  const religiousTime = (event.religious_time || event.religiousTime)?.replace(':00', '');
  // const religiousTime = event.religious_time?.replace(':00', '');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A5",
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const contentWidth = pageWidth - 80;
    let y = 40; // 🎯 point de départ vertical

    /* 🎨 Fond */
    // doc.rect(0, 0, pageWidth, doc.page.height).fill("#fffaf5");//#fffaf5

    // BLEU
    doc.save()
      .opacity(1)
      .rect(0, 0, pageWidth, 30)
      .fill("#0055A4")
      .restore();

    // ROUGE
    doc.save()
      .opacity(1)
      .rect(0, pageHeight - 30, pageWidth, 30)
      .fill("#EF4135")
      .restore();

    // BLANC (opacité très légère pour rester visible)
    doc.save()
      .opacity(0.06)
      .rect(0, 0, pageWidth, pageHeight)
      .fill("#FFFFFF")
      .restore();

    /* 💍 Icône */
    // doc.image(
    //   path.join(__dirname, "../assets/icons/logo.png"),//ring.png
    //   pageWidth / 2 - 18,
    //   y,
    //   { width: 36 }
    // );

    // y += 55;
    
    const imgSize = 100;

    doc.image(
      path.join(__dirname, "../assets/icons/logo.png"),
      pageWidth / 2 - imgSize / 2,
      y,
      { width: imgSize }
    );

    y += imgSize + 20;

    /* 💕 Titre */
    doc
      .fillColor("#b58b63")
      .font("Times-Bold")
      .fontSize(22)
      .text("Célébrons l’Amour", 40, y, {
        width: contentWidth,
        align: "center"
      });

    y += 35;

    /* Sous-titre */
    doc
      .fillColor("#777")
      .font("Helvetica-Oblique")
      .fontSize(12)
      .text(
        "Nous avons la joie de vous convier à notre mariage",
        40,
        y,
        { width: contentWidth, align: "center" }
      );

    y += 35;

    /* 👤 Invité */
    doc
      .fillColor("#333")
      .font("Times-Italic")
      .fontSize(14)
      .text(
        (guest.plus_one_name || plusOneName)
          ? `Cher/Chère ${guest.full_name} et ${(guest.plus_one_name || plusOneName)}`
          : `Cher/Chère ${guest.full_name},`,
        40,
        y,
        { width: contentWidth, align: "center" }
      );

    y += 35;

    /* 📝 Texte principal */
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#444")
      .text(
        "C’est avec un immense bonheur que nous vous invitons à célébrer notre union entourés de nos familles et amis, lors d’une journée inoubliable.",
        40,
        y,
        {
          width: contentWidth,
          align: "center",
          lineGap: 4
        }
      );

    y += 70;

    /* 📅 Programme */
    if(event.type == 'wedding'){
      doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#444")
      .text("Programme de la journée", 40, y, {
        width: contentWidth,
        align: "center"
      });

      y += 22;

      doc
        .font("Helvetica")
        .fontSize(11)
        .text(
          `Mariage civil le ${eventDate} à ${time}\n${(event.event_civil_location || event.eventCivilLocation)}`,
          40,
          y,
          { width: contentWidth, align: "center", lineGap: 3 }
        );

      y += 40;

      if(event.show_wedding_religious_location){
        doc.text(
          `Cérémonie Religieuse ${religiousTime}\n${(event.religious_location || event.religiousLocation)}`,
          40,
          y,
          { width: contentWidth, align: "center", lineGap: 3 }
        );

        y += 40;
      }

      doc.text(
        `Réception nuptiale le même jour à partir de ${banquetTime}\n${(event.event_location || event.eventLocation)}`,
        40,
        y,
        { width: contentWidth, align: "center", lineGap: 3 }
      );

      y += 45;
    }

    /* ✨ Message */
    doc
      .font("Helvetica-Oblique")
      .fontSize(11)
      .fillColor("#888")
      .text(
        "Votre présence illuminera ce jour si spécial pour nous.",
        40,
        y,
        { width: contentWidth, align: "center" }
      );

    y += 30;

    /* 🤍 Signature */
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#b58b63")
      .text(
        `${event.event_name_concerned1} & ${event.event_name_concerned2}`,
        40,
        y,
        { width: contentWidth, align: "center" }
      );

    /* ❤️ Icône finale */
    doc.image(
      path.join(__dirname, "../assets/icons/heart.png"),
      pageWidth / 2 - 10,
      y + 22,
      { width: 20 }
    );

    doc.end();
  });
}
//generateCustomGuestPdf
async function generateGuestPdf(data, plusOneName = null) {
  const guest = data;
  const event = data;

  const eventDate = new Date((event.event_date || event.eventDate)).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const time = new Date((event.event_date || event.eventDate)).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const banquetTime = (event.banquet_time || event.banquetTime)?.replace(':00', '');
  const religiousTime = (event.religious_time || event.religiousTime)?.replace(':00', '');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A5",
      margins: { top: 30, bottom: 30, left: 40, right: 40 }
    });

    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - 80;
    let y = 35; 

    /* 🎨 Fond */
    doc.save().rect(0, 0, pageWidth, 25).fill("#0055A4").restore();
    doc.save().rect(0, pageHeight - 25, pageWidth, 25).fill("#EF4135").restore();
    doc.save().opacity(0.04).rect(0, 0, pageWidth, pageHeight).fill("#FFFFFF").restore();

    /* 💍 Icône */
    const imgSize = 65;
    doc.image(path.join(__dirname, "../assets/icons/logo.png"), pageWidth / 2 - imgSize / 2, y, { width: imgSize });
    y += imgSize; // 🎯 Réduction de la marge entre l'image et le titre

    /* 💕 Titre */
    doc.fillColor("#b58b63").font("Times-Bold").fontSize(19).text("LETTRE D'INVITATION", 38, y, { width: contentWidth, align: "center" });
    y += 30;

    /* Sous-titre */
    doc.fillColor("#777").font("Helvetica-Oblique").fontSize(11.5).text(
      (guest.plus_one_name || plusOneName)
        ? `Cher/Chère M. et Mme ${guest.full_name} et ${(guest.plus_one_name || plusOneName)}`
        : `Cher/Chère M. et Mme ${guest.full_name},`,
      38, y, { width: contentWidth, align: "center" }
    );
    y += 20;

    /* 📝 Texte principal */
    doc.font("Helvetica").fontSize(10.5).fillColor("#444").text(
      `C'est avec un immense bonheur que nous vous invitons à l'occasion de notre union que nous célebrerons entourés de nos familles, amis et connaissances dans la ville de BANGANGTE plus précisement à la Mairie.`,
      38, y, { width: contentWidth, align: "center", lineGap: 2 }
    );
    
    // 🎯 Calcul dynamique de la hauteur du texte pour éviter le chevauchement
    const mainTextHeight = doc.heightOfString(
      `C'est avec un immense bonheur que nous vous invitons à l'occasion de notre union que nous célebrerons entourés de nos familles, amis et connaissances dans la ville de BANGANGTE plus précisement à la Mairie.`,
      { width: contentWidth, lineGap: 2 }
    );
    y += mainTextHeight + 15; // Ajout d'un espace de sécurité

    /* 📅 Programme */
    doc.font("Helvetica-Bold").fontSize(12.5).fillColor("#444").text("PROGRAMME DE LA JOURNÉE", 38, y, { width: contentWidth, align: "center" });
    y += 20;

    const programText1 = `MARIAGE CIVIL LE ${eventDate} A ${time}\n${(event.event_civil_location || event.eventCivilLocation)} \nMini réception à la sortie de la mairie directement après la célebration de l'union par Mr le Maire.`;
    doc.font("Helvetica").fontSize(10.5).text(programText1, 38, y, { width: contentWidth, align: "center", lineGap: 1.5 });
    
    const programHeight1 = doc.heightOfString(programText1, { width: contentWidth, lineGap: 1.5 });
    y += programHeight1 + 10;

    const programText2 = `Reception nuptial le même jour a partir de ${banquetTime} précisement à\n${(event.event_location || event.eventLocation)}`;
    doc.text(programText2, 38, y, { width: contentWidth, align: "center", lineGap: 1.5 });
    
    const programHeight2 = doc.heightOfString(programText2, { width: contentWidth, lineGap: 1.5 });
    y += programHeight2 + 15;

    /* ✨ Thème & Couleurs */
    doc.font("Helvetica-Bold").fontSize(11.5).text("THEME DE LA SOIRÉE : CHIC ET GLAMOUR", 38, y, { width: contentWidth, align: "center" });
    y += 18;

    doc.font("Helvetica").fontSize(10.5).text("Couleurs priorisées : Bleu, Blanc, Rouge, (NOIR: couleur universelle).", 38, y, { width: contentWidth, align: "center" });
    y += 20;

    /* Consignes QR */
    const qrText = "Prière de vous présenter uniquement avec votre code QR et votre billet numérique (à partir de votre téléphone) transféré par votre émetteur via les applications mobiles de votre choix (WhatsApp, SMS, e-mail) le jour de la soirée.";
    doc.font("Helvetica").fontSize(10).fillColor("#444").text(qrText, 38, y, { width: contentWidth, align: "center", lineGap: 1.5 });
    
    const qrHeight = doc.heightOfString(qrText, { width: contentWidth, lineGap: 1.5 });
    y += qrHeight + 10;

    /* Remerciements */
    const thanksText = "Merci de respecter les couleurs vestimentaires choisies.";
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("#666").text(thanksText, 38, y, { width: contentWidth, align: "center", lineGap: 1.5 });
    y += 20;

    const thanksText2 = "Merci pour votre compréhension.";
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("#666").text(thanksText2, 38, y, { width: contentWidth, align: "center", lineGap: 1.5 });
    y += 20;

    const thanksText3 = "Votre présence illuminera ce jour si spécial pour nous.";
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("#666").text(thanksText3, 38, y, { width: contentWidth, align: "center", lineGap: 1.5 });

    /* 🤍 Signature et ❤️ Cœur (Positionnement fixe en bas) */
    const signatureY = pageHeight - 85; // 🎯 Positionnement fixe par rapport au bas de la page
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#b58b63").text(`${event.event_name_concerned1} & ${event.event_name_concerned2}`, 38, signatureY, { width: contentWidth, align: "center" });
    
    const heartSize = 22;
    doc.image(path.join(__dirname, "../assets/icons/heart.png"), pageWidth / 2 - heartSize / 2, signatureY + 20, { width: heartSize });

    doc.end();
  });
}

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

   const imageWidth = 100; // ta largeur d’image
   const x = (doc.page.width - imageWidth) / 2; // calcul centré

    
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

    // --- LOGO ---
    doc.image(
      path.join(__dirname, "../assets/icons/logo.png"),
      x, // position centrée
      40, // position Y
      { width: imageWidth }
    );

    // --- TITRE ---
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#2d2d2d");
    doc.text(`Liste des invités ${rsvp_status}`, { align: "center" });
    doc.moveDown(1.5);

    // --- INFOS MARIAGE ---
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#D4AF37");
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

async function generateDualGuestListPdf(presentGuests = [], confirmedAbsentGuests = [], event) {
  return new Promise((resolve, reject) => {
    // Assurez-vous que PDFDocument est bien importé/disponible dans votre environnement
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Constantes de mise en page
    const startX = 40;
    const endX = 580;
    const tableWidth = endX - startX;
    const rowHeight = 25;
    const headerHeight = 25;
    // La limite Y est calculée dynamiquement pour s'assurer que la dernière ligne tient
    const maxPageY = doc.page.height - doc.page.margins.bottom - rowHeight - 5; 
    const startY = doc.page.margins.top;

   // --- LOGO ---
   const imageWidth = 100; // ta largeur d’image
   const x = (doc.page.width - imageWidth) / 2; // calcul centré

   doc.image(
      path.join(__dirname, "../assets/icons/logo.png"),
      x, // position centrée
      40, // position Y
      { width: imageWidth }
   );

    // --- TITRE ---
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#2d2d2d");
    doc.text(`Récapitulatif des invités`, { align: "center" });
    doc.moveDown(1.5);

    // --- INFOS MARIAGE ---
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#D4AF37");
    doc.text(`${event.title}`);
    doc.moveDown(0.5);

   //  doc.fontSize(10).font("Helvetica-Bold").fillColor("#2d2d2d")
   //  .text("Date et heure :");
   //  doc.fontSize(10).font("Helvetica").text(`${event.eventDate} à ${event.eventTime}`);
   //  doc.moveDown(0.5);

   //  doc.fontSize(10).font("Helvetica-Bold").fillColor("#2d2d2d")
   //  .text("Lieu :");
   //  doc.fontSize(10).font("Helvetica").text(`${event.eventLocation}`);
   //  doc.moveDown(1.5);

    // --- DÉFINITION DES COLONNES ---
    // Total des largeurs: 150 + 150 + 100 + 110 = 510. tableWidth = 510. C'est bon.
    const presentColumns = [
      { label: "Nom", key: "name", width: 150 },
      { label: "Nom +1", key: "plusOneName", width: 150 },
      { label: "Heure Arrivée", key: "dateTime", width: 150 },
      { label: "Statut", key: "status", width: 130 },
    ];

    const confirmedAbsentColumns = [
      { label: "Nom", key: "name", width: 150 },
      { label: "Nom +1", key: "plusOneName", width: 150 },
      { label: "Date Acceptée", key: "updatedAt", width: 150 },
      { label: "Statut", key: "status", width: 130 },
    ];

    // Fonction pour dessiner l'en-tête du tableau
    function drawTableHeader(y, columns) {
      // Fond de l'en-tête
      doc.fillColor("#f5f5f5");
      doc.rect(startX, y, tableWidth, headerHeight).fill();

      // Texte de l'en-tête
      doc.fillColor("#000").font("Helvetica-Bold").fontSize(10);

      let x = startX;
      columns.forEach((col) => {
        let options = { width: col.width };
        
        // CORRECTION: Centrer l'en-tête de la colonne "Statut"
        if (col.key === "status") {
            options.align = "center"; // <-- Ajout de l'alignement au centre
        } else {
            // Pour les autres colonnes, garder l'indentation de 5
            options.indent = 5;
        }

        doc.text(col.label, x, y + 7, options); 
        x += col.width;
      });

      // Ligne sous l'en-tête
      y += headerHeight;
      doc.moveTo(startX, y).lineTo(endX, y).strokeColor("#ddd").stroke();
      
      return y;
    }

    /**
     * Dessine un tableau d'invités et gère la pagination.
     * @param {Array} guests - Liste des invités.
     * @param {number} startYPos - Position Y de départ pour le tableau.
     * @param {string} title - Titre de la section (ex: "Invités Présents").
     * @param {Array} columns - Définition des colonnes du tableau.
     * @param {string} statusLabel - Étiquette de statut à afficher dans la colonne "Statut".
     * @returns {number} La position Y après le dessin du tableau.
     */
    function drawGuestTable(guests, startYPos, title, columns, statusLabel) {
      let y = startYPos;

      // Titre de la section
      doc.moveDown(1);
      y = doc.y;
      doc.fontSize(12).font("Helvetica").fillColor("#2d2d2d");
      doc.text(title, startX, y);
      doc.moveDown(0.5);
      y = doc.y;

      // Si la position Y est trop basse pour l'en-tête, ajouter une page
      if (y + headerHeight + 5 > maxPageY) {
        doc.addPage();
        y = startY;
      }

      // Dessiner l'en-tête initial
      y = drawTableHeader(y, columns);

      // --- ROWS ---
      doc.font("Helvetica").fontSize(9).fillColor("#222");

      guests.forEach((g) => {
        // Vérifier si la prochaine ligne dépasse la limite de la page
        if (y + rowHeight + 5 > maxPageY) {
          doc.addPage();
          y = startY; // Réinitialiser Y au début de la nouvelle page
          y = drawTableHeader(y, columns); // Dessiner l'en-tête sur la nouvelle page
        }

        // Marge supérieure pour la ligne
        y += 5; 
        let currentY = y;
        let x = startX;

        // Fond de la ligne
        doc.fillColor("#ffffff");
        doc.rect(startX, currentY - 5, tableWidth, rowHeight).fill();
        doc.fillColor("#222");

        // Colonnes
        columns.forEach((col) => {
          let value = g[col.key];
          let options = { width: col.width };

          // Logique pour la colonne Statut
          if (col.key === "status") {
            options.align = "center"; // <-- Assure que le contenu est centré
            
            let color = statusLabel === "Présent" ? "#2ecc71" : "#f39c12"; 
            doc.fillColor(color);
            doc.font("Helvetica-Bold");
            
            doc.text(statusLabel, x, currentY + 2, options);
            doc.font("Helvetica").fillColor("#222");
          } else {
            // Pour les autres colonnes, garder l'indentation de 5
            options.indent = 5;
            doc.text(value || "-", x, currentY + 2, options);
          }

          x += col.width;
        });

        // Mettre à jour la position Y pour la ligne suivante
        y = currentY + rowHeight;

        // Ligne séparatrice
        doc.moveTo(startX, y).lineTo(endX, y).strokeColor("#eee").stroke();
      });
      
      return y;
    }

    // --- TABLEAU 1 : Invités Présents ---
    let currentY = doc.y;
    currentY = drawGuestTable(presentGuests, currentY, "Liste des invités présents lors de l'événement", presentColumns, "Présent");

    // --- TABLEAU 2 : Invités Confirmés mais Absents ---
    // Ajouter un peu d'espace entre les deux tableaux
    doc.moveDown(2);
    currentY = doc.y;
    currentY = drawGuestTable(confirmedAbsentGuests, currentY, "Liste des invités ayant confirmé leur présence mais absents le jour de l'événement", confirmedAbsentColumns, "Absent");

    doc.end();
  });
}

// Fonction pour uploader sur Firebase Storage
async function uploadPdfToFirebase(guest, pdfBuffer) {
  const bucket = admin.storage().bucket();
  let fileName = null;
  if (process.env.NODE_ENV == 'development'){
    if(guest.id!=undefined) fileName = `dev/pdfs/carte_${guest.id}.pdf`;
    if(guest.guest_id!=undefined) fileName = `dev/pdfs/carte_${guest.guest_id}.pdf`;
  }else if(process.env.NODE_ENV == 'production'){
    if(guest.id!=undefined) fileName = `prod/pdfs/carte_${guest.id}.pdf`;
    if(guest.guest_id!=undefined) fileName = `prod/pdfs/carte_${guest.guest_id}.pdf`;
  }
  
  const file = bucket.file(fileName);

  await file.save(pdfBuffer, { contentType: 'application/pdf' });
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-01-2030',
  });

  return url;
}

module.exports = { generateGuestPdf, uploadPdfToFirebase, 
                   generatePresentGuestsPdf, generateDualGuestListPdf,
                 };
