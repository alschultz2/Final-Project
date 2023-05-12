/*
 Author: Adam Schultz
 */
const mongoose = require('mongoose');
const stateData = require('verifyStateData');
const State = require('../models/states');
{import("express").RequestHandler}
async function getStates(req, res) {
    const states = await State.find().lean();
    let mergedStates = require('stateDataJS').loadStaticStateData().map(stateData => {
        let mergedState = {
            ...stateData,
            ...states.find(state => state.stateCode == stateData.code)
        }
        delete mergedState.stateCode;
        return mergedState;
    });
    if (req?.query?.contig != null && (req.query.contig.toLowerCase() == 'true' || req.query.contig.toLowerCase() == 'false')) {
        let contig = req.query.contig.toLowerCase() == 'true';
        mergedStates = mergedStates.filter(stateData => (stateData.code == 'AK' || stateData.code == 'HI') != contig);
    }
    res.json(mergedStates);
{import("express").RequestHandler}
async function getState(req, res) {
    res.json(req.stateData);
}
@type { import("express").RequestHandler }
async function getStateProperty(req, res) {
    if (!req?.params?.property) {
        return res.status(400).json({ 'message': 'The state property is required, and is missing.' });
    }
    const statePropertyAliases = new Map([
        ["admitted", "admission_date"],
        ["admission", "admission_date"],
        ["capital", "capital_city"]
    ]);
    const statePropertyLabels = new Map([
        ["admission_date", "admitted"],
        ["capital_city", "capital"]
    ]);
    const statePropertyHandlers = new Map([
        ["population", (pop) => pop.toLocaleString("en-US")]
    ])
    let property = req.params.property.toLowerCase();
    if (statePropertyAliases.has(property)) {
        property = statePropertyAliases.get(property);
    }
    if (req.stateData[property] == null) {
        return res.status(404).json({ 'message': 'That is an invalid state property' });
    }
    let label = statePropertyLabels.has(property) ? statePropertyLabels.get(property) : property
    res.json({
        'state': req.stateData.state,
        [label]: statePropertyHandlers.has(property) ? statePropertyHandlers.get(property)(req.stateData[property]) : req.stateData[property]
    });
}
{import("express").RequestHandler}
async function getStateFunFact(req, res) {
    if (!req.stateData.funfacts || !req.stateData.funfacts.length) {
        return res.status(404).json({ 'message': 'There are no fun facts found for ' + req.stateData.state });
    }

    res.json({
        'funfact': req.stateData.funfacts[Math.floor(Math.random() * req.stateData.funfacts.length)]
    });
}
}
{import("express").RequestHandler}
async function replaceStateFunFact(req, res) {
    if (!req?.body?.index) {
        return res.status(400).json({ 'message': 'The state fun fact index value is required' });
    }
    if (!req?.body?.funfact) {
        return res.status(400).json({ 'message': 'The state fun fact value is required' });
    }
    let index = req.body.index - 1;
    let funfacts = req.stateData.funfacts;
    if (!Array.isArray(funfacts) || !funfacts.length) {
        return res.status(404).json({ 'message': 'Ther are no fun facts that were found for ' + req.stateData.state });
    }
    if (index >= funfacts.length) {
        return res.status(404).json({ 'message': 'There is no fun fact found at that index for ' + req.stateData.state });
    funfacts[index] = req.body.funfact;
    let stateData = await State.findOneAndUpdate({ stateCode: req.stateData.code }, { funfacts }, { upsert: true, setDefaultsOnInsert: true });
    stateData.funfacts = funfacts;
    res.json(stateData);
}
{import("express").RequestHandler}
async function deleteStateFunFact(req, res) {
    if (!req?.body?.index) {
        return res.status(400).json({ 'message': 'The state fun fact index value is required' });
    }
    let index = req.body.index - 1;
    let funfacts = req.stateData.funfacts;
    if (!Array.isArray(funfacts) || !funfacts.length) {
        return res.status(404).json({ 'message': 'There is no fun facts found for ' + req.stateData.state });
    }
    if (index >= funfacts.length) {
        return res.status(404).json({ 'message': 'There is no fun fact found at that index for ' + req.stateData.state });
    }
    funfacts.splice(index, 1);
    let stateData;
    if (funfacts.length) {
        stateData = await State.findOneAndUpdate({ stateCode: req.stateData.code }, { funfacts }, { upsert: true, setDefaultsOnInsert: true });
    } else {
        stateData = await State.findOneAndUpdate({ stateCode: req.stateData.code }, { $unset: { funfacts } });
    }
    stateData.funfacts = funfacts;
    res.json(stateData);
}
module.exports = {
    getStates,
    getState,
    getProperty,
    getFunFact,
    postFunFact,  
    replaceFunFact,
    deleteFunFact
}
