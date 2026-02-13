const { createPaymentSchedule, getEventScheduleByEventId, updateEventSchedule, deleteEventSchedule } = require("../models/event_schedules");
const { createPaymentProof, getPaymentProof, updatePaymentProof, deletePayment, getPaymentProofById } = require("../models/payment");
const { getUserById, updateUserPlan } = require("../models/users");
const { deleteInvitationFiles } = require("../services/invitation.service");
const { sendPaymentProofToAdminAboutChangePlan, sendNotificationToUserAboutChangePlan } = require("../services/notification.service");
const { uploadPaymentProofFileToFirebase } = require("../services/pdfService");
const schedule = require('node-schedule');

require("dotenv").config({path: ".env.test"});

const addProofPaymentFile = async (req, res, next) => {
    try {
        const paymentFile = req.file;
        console.log('### paymentFile:', paymentFile);
        const fileType = String(paymentFile.mimetype).split('/')[1];
        const userData = JSON.parse(req.body.userData);
        
        const payment = await getPaymentProof(userData.userId);
        if (payment) {
            console.log('Payment déjà existant mise a jour...');
            const result = await updatePaymentService(paymentFile, userData, payment);
            return res.status(200).json(result);
        }

        const user = await getUserById(userData.userId);
        if (!user) return res.status(409).json({ error: "Organizer not found with ID: " + userData.userId });
        console.log('Fichier reçu en mémoire, début de l\'upload vers Firebase...');

        // Appelez la fonction pour uploader le fichier et attendez le résultat
        const data = await uploadPaymentProofFileToFirebase(paymentFile, user);
        console.log('Fichier uploadé avec succès sur Firebase.');
        const fileUrl = data.url;
        const datas = {
            organizerId: userData.userId,
            fileUrl: fileUrl,
            fileType: fileType,
            code: data.code
        }
        // console.log('### datas:', datas);

        const newPayment = await createPaymentService(datas);
        //console.log('newPayment:', newPayment);
        const existingSchedule = await getEventScheduleByEventId(newPayment.id);
        if (existingSchedule) {
            console.log(`Schedule déjà existant pour payment ${newPayment.id}`);
            return;
        }
        const scheduleId = await createPaymentSchedule(newPayment.id, newPayment.created_at, false);
        if (process.env.NODE_ENV !== 'test') {
            await planSchedule(scheduleId, newPayment.id, newPayment.created_at);
        }
        // Envoi mail
        await sendPaymentProofToAdminAboutChangePlan(user, paymentFile.buffer);
        res.status(200).json({
            message: 'Fichier uploadé avec succès sur Firebase !',
            fileUrl: fileUrl // Renvoyez l'URL publique au client
        });
    } catch (error) {
        console.error('addProofPaymentFile ERROR:', error.message);
        next(error);
    }
};

const createPaymentService = async (data) => {
    try {
        // console.log('data :: ', data);
        const payment = await createPaymentProof(data.organizerId, data.fileUrl, data.fileType, data.code);
        return payment;
    } catch (error) {
        console.error('createPaymentService ERROR:', error.message);
    }
};

async function updatePaymentService(paymentFile, userData, payment) {
    try {
        //console.log('paymentFile: ', paymentFile);
        const user = await getUserById(userData.userId);
        if (!user) return res.status(409).json({ error: "Organizer not found with ID: " + userData.userId });

        // 2. Suppression ancien PDF
        const path = `proof_user_${user.id}_${payment.code}.${payment.file_type}`;
        console.log('[path]:', path);
        const resDel = await deleteInvitationFiles(path, true);
        // console.log('resDel:', resDel);

        // 3. Upload nouveau PDF
        if(!resDel.success) return res.status(500).json({error: "Erreur lors de la suppression du fichier"});
        const file = await uploadPaymentProofFileToFirebase(paymentFile, user);
        const fileType = String(paymentFile.mimetype).split('/')[1];
        const fileUrl = file.url;
        const data = {
            organizerId: user.id,
            fileUrl: fileUrl,
            fileType: fileType,
            code: file.code
        }
        // console.log('## data:', data);
        await updatePaymentProof(payment.id, data.organizerId, data.fileUrl, data.fileType, data.code);
        await sendPaymentProofToAdminAboutChangePlan(user, paymentFile.buffer);
        return dataReturn = {
            message: 'Preuve de payment mis à jour et fichier uploadé avec succès',
            fileUrl: data.url
        };
    } catch (error) {
        console.error('UPDATE EVENT WITH FILE ERROR:', error.message);
    }
};

async function changeUserPlan(req, res, next) {
    try {
        const {plan} = req.body;
        const user = await getUserById(req.params.userId);
        if (!user) return res.status(409).json({ error: "Organizer not found with ID: " + userData.userId });
        const payment = await getPaymentProof(user.id);
        if(!payment) return res.status(409).json({ error: "### Payment table not found ###" });
        const userUpdated = await updateUserPlan(user.id, plan);
        if(plan == 'gratuit'){
            // Suppression du fichier dans fire-base
            const path = `proof_user_${user.id}_${payment.code}.${payment.file_type}`;
            console.log('[path]:', path);
            const resDel = await deleteInvitationFiles(path, true);
            if(resDel) await deletePayment(payment.id);
        }
        // Envoi du mail a l'utlisateur
        await sendNotificationToUserAboutChangePlan(userUpdated, plan);
        return res.status(200).json({success: "Plan professionnel activé avec succès."});
    } catch (error) {
        console.error('changeUserPlan ERROR:', error.message);
        next(error);
    }
}

  // Planifier la tâche
  async function planSchedule(scheduleId, paymentId, paymentDate) {
    try {
        console.log('[schedule 3] paymentDate :', paymentDate);
        if(paymentDate==null || paymentDate==undefined) throw new Error("La date est invalide");
        // Conversion finale selon ta logique métier
        const scheduleDate = addOneMonthAndFormat(newPayment.created_at)//test value: "2026-01-13T20:52:00.000Z"
        console.log('[schedule 3] scheduleDate (réelle pour scheduler):', scheduleDate);

        // 🔁 Sécurité : annuler s'il existe déjà
        await cancelSchedule(scheduleId);

        // Planification
        schedule.scheduleJob(String(scheduleId), scheduleDate, async () => {
            console.log('🚀 === Job déclenché ===');
            await runScheduledTask(scheduleId, paymentId, paymentDate);
        });
        console.log('✅ Schedule planifié pour payment ', scheduleId, ' date: ', scheduleDate);
    } catch (error) {
        console.error("❌ Erreur planSchedule:", error);
    }
  }

  async function cancelSchedule(scheduleId) {
    const job = schedule.scheduledJobs[String(scheduleId)];

    if (!job) {
        console.log('[cancelSchedule] Aucun job trouvé pour l\`event ', scheduleId);
        return;
    }

    job.cancel();
    delete schedule.scheduledJobs[String(scheduleId)];

    console.log('🛑 Schedule annulé:', scheduleId);
  }
 
  async function runScheduledTask(scheduleId, paymentId, scheduledFor) {
    console.log('🚀 Scheduler exécuté pour event:', paymentId);

    // Marquer comme exécuté
    await updateEventSchedule(scheduleId, paymentId, scheduledFor, true, false);
    await loadChangeUserPlan(paymentId, scheduleId);

    console.log('✅ Scheduler terminé:', paymentId);
  }

async function loadChangeUserPlan(paymentId, scheduleId) {
    try {
        const payment = await getPaymentProofById(paymentId);
        if(!payment) return res.status(409).json({ error: "### Payment table not found ###" });
        const userUpdated = await updateUserPlan(payment.organizer_id, 'gratuit');
        // Suppression du fichier dans fire-base
            const path = `proof_user_${payment.organizer_id}_${payment.code}.${payment.file_type}`;
            console.log('[path]:', path);
            const resDel = await deleteInvitationFiles(path, true);
            if(resDel) await deletePayment(payment.id);
            await deleteEventSchedule(scheduleId);
        // Envoi du mail a l'utlisateur
        await sendNotificationToUserAboutChangePlan(userUpdated, 'gratuit');
    } catch (error) {
        console.error('changeUserPlan ERROR:', error.message);
    }
}

function addOneMonthAndFormat(dateString) {
  const date = new Date(dateString);

  // Ajouter 1 mois
  date.setMonth(date.getMonth() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

module.exports = {
    addProofPaymentFile,
    changeUserPlan,
    loadChangeUserPlan
}