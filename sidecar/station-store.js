'use strict';

const WorldModel = require('../frontend/app/worldmodel.js');
const Pipeline = require('../frontend/app/pipeline.js');

function makeStationStore(o) {
  o = o || {};
  const model = o.worldModel || WorldModel;
  let station = null;
  let doc = null;
  let routingPlan = null;

  function validateStationDoc(nextDoc) {
    if (!nextDoc || typeof nextDoc !== 'object' || Array.isArray(nextDoc)) return { ok: false, error: 'farm document required' };
    if (nextDoc.schema && nextDoc.schema !== 'starnet.station') return { ok: false, error: 'unsupported farm schema' };
    if (!nextDoc.rooms || typeof nextDoc.rooms !== 'object' || Array.isArray(nextDoc.rooms)) return { ok: false, error: 'farm rooms required' };
    if (!Array.isArray(nextDoc.order) || nextDoc.order.length < 1) return { ok: false, error: 'farm must contain at least one room' };
    if (!Array.isArray(nextDoc.props)) return { ok: false, error: 'farm props must be an array' };
    let parsed;
    try { parsed = model.deserialize(nextDoc); } catch (e) { return { ok: false, error: (e && e.message) || 'farm rejected' }; }
    if (!parsed || typeof parsed.bayObjects !== 'function' || typeof parsed.serialize !== 'function') return { ok: false, error: 'farm model unavailable' };
    if (!parsed.rooms || !parsed.rooms().length) return { ok: false, error: 'farm must contain at least one room' };
    const plan = Pipeline.compileRoutingPlan(parsed.projectGeometry());
    return { ok: true, station: parsed, doc: parsed.serialize(), routingPlan: plan, routingOk: Pipeline.ok(plan) };
  }

  function setStation(nextDoc) {
    const v = validateStationDoc(nextDoc);
    if (!v.ok) return { ok: false, error: v.error };
    station = v.station;
    doc = v.doc;
    routingPlan = v.routingPlan;
    return { ok: true, rooms: station.rooms().length, props: station.props().length, routingOk: v.routingOk, routingPlan };
  }

  function setSaveDoc(saveDoc) {
    if (!saveDoc || typeof saveDoc !== 'object' || Array.isArray(saveDoc)) return { ok: false, error: 'save document required' };
    if (!saveDoc.station || typeof saveDoc.station !== 'object' || Array.isArray(saveDoc.station)) return { ok: false, error: 'save document farm required' };
    return setStation(saveDoc.station);
  }

  function clearStation() { station = null; doc = null; routingPlan = null; return { ok: true, cleared: true }; }
  function hasStation() { return !!station; }
  function getStation() { return doc; }
  function getRoutingPlan() { return routingPlan; }
  // (multi-bay) dockId = the bay the run is at; the station model resolves that bay's room (or the agent's desk room)
  function bayObjects(agentId, dockId) { return station ? station.bayObjects(agentId, dockId) : null; }

  return { validateStationDoc, setStation, setSaveDoc, clearStation, hasStation, getStation, getRoutingPlan, bayObjects };
}

module.exports = { makeStationStore };
