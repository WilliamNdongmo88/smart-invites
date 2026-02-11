const { createPaymentProof, getPaymentProof, updatePaymentProof } = require("../models/payment");
const { getUserById, updateUserPlan } = require("../models/users");
const { deleteInvitationFiles } = require("../services/invitation.service");
const { sendPaymentProofToAdminAboutChangePlan, sendNotificationToUserAboutChangePlan } = require("../services/notification.service");
const { uploadPaymentProofFileToFirebase } = require("../services/pdfService");

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

        await createPaymentService(datas);
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
        await createPaymentProof(data.organizerId, data.fileUrl, data.fileType, data.code);
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
        // Envoi du mail a l'utlisateur
        await sendNotificationToUserAboutChangePlan(userUpdated);
        return res.status(200).json({success: "Plan professionnel activé avec succès."})
    } catch (error) {
        console.error('changeUserPlan ERROR:', error.message);
        next(error);
    }
}

module.exports = {
    addProofPaymentFile,
    changeUserPlan
}