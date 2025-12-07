const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { createLink, getAllLinks } = require("../models/links");

const addLink = async (req, res, next) => {
    try {
        const {eventId, type, usedLimitCount} = req.body;
        let parts = uuidv4().split('-');
        if(type=='unique') parts[2] = "a11a";
        if(type=='couple') parts[2] = "a22a";
        const token = parts.join('-');
        console.log('token ::', token);
        const link = `${process.env.API_URL}/invitations/${eventId}:${token}`;
        const links = await createLink(type, token, usedLimitCount, link);
        return res.status(200).json(links);
    } catch (error) {
        console.log('[createLink] Error:', error.message);
        next(error);
    }
}

const getLinks = async (req, res, next) => {
    try {
        const links = await getAllLinks();
        console.log('links ::', links);
        //if(links.length==0) return res.status(404).json({info: "Aucun lien trouvé."});
        return res.status(200).json(links);
    } catch (error) {
        console.log('[getLinks] Error:', error.message);
        next(error);
    }
}

module.exports = {addLink, getLinks};