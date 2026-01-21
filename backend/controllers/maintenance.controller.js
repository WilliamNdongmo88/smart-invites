const { getMaintenanceById, updateMaintenance } = require('../models/maintenance');

require('dotenv').config();

const  getTableMaintenance = async(req, res, next) => {
    try {
        const maintenanceTable = await getMaintenanceById(1); // Supposons qu'il n'y a qu'une seule entrée de maintenance avec l'ID 1
        if(!maintenanceTable) {
            return res.status(404).json({error: "Maintenance non trouvée !"});
        }
        return res.status(200).json(maintenanceTable);
    } catch (error) {
        console.log('[getTableMaintenance] Error:', error.message);
        next(error);
    }
};

const updateTableMaintenance = async(req, res, next) => {
    try {
        console.log("-----> Update Maintenance Table Request Body:", req.body);
        const maintenanceId = req.params.id;
        let {maintenanceProgress, subscribed, estimatedTime, email, status} = req.body;
        const maintenanceTable = await getMaintenanceById(maintenanceId);
        if(!maintenanceTable) {
            return res.status(404).json({error: "Maintenance non trouvée !"});
        }
        if(maintenanceProgress == null) maintenanceProgress = maintenanceTable.maintenance_progress;
        if(subscribed == null) subscribed = maintenanceTable.subscribed;
        if(estimatedTime == null) estimatedTime = maintenanceTable.estimated_time;
        if(email == null) email = maintenanceTable.email;
        if(status == null) status = maintenanceTable.status;
        const updatedMaintenance = await updateMaintenance(maintenanceId, maintenanceProgress, subscribed, email, status);
        if(!updatedMaintenance) {
            return res.status(404).json({error: "Maintenance non trouvée !"});
        }
        return res.status(200).json(updatedMaintenance);
    } catch (error) {
        console.log('[updateTableMaintenance] Error:', error.message);
        next(error);
    }
}

module.exports = {updateTableMaintenance, getTableMaintenance};