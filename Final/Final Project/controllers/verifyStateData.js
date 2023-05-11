/*
 Author: Adam Schultz
 */
const State = require('../models/states');
const stateData = async (req, res, next) => {
    if (!req?.params?.state) {
        return res.status(400).json({ 'message': 'The state abbreviation parameter is necessary/required' });
    }
    let stateCode = req.params.state.toUpperCase();
    const staticState = require('stateDataJS').loadStaticStateData(stateCode);
    const state = await State.findOne({ 'stateCode': stateCode }).lean();
    if (!staticState && !state) {
        return res.status(400).json({ 'message': 'That is an invalid state abbreviation parameter' });
    }
    let mergedState = {
        ...staticState,
        ...state
    }
    delete mergedState.stateCode;
    delete mergedState._id;
    delete mergedState.__v;
    req.stateData = mergedState;
    next();
}
module.exports = stateData