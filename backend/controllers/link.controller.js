const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { createLink } = require("../models/links");

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

module.exports = {addLink};