import test from 'node:test';
import assert from 'node:assert/strict';
import {openingState} from '../lib/hours.mjs';
const hours={schedule:{weekly:{3:[],4:[['18:00','02:00']],5:[['08:00','22:00']]},special:{}}};
test('Riyadh midnight and close boundary',()=>{
  assert.equal(openingState(hours,new Date('2026-11-26T22:30:00Z')),'open');
  assert.equal(openingState(hours,new Date('2026-11-26T23:00:00Z')),'closed');
});
test('local holiday overrides the previous evening and missing schedules are unknown',()=>{
  const h=structuredClone(hours); h.schedule.special['2026-11-27']=[];
  assert.equal(openingState(h,new Date('2026-11-26T22:30:00Z')),'closed');
  assert.equal(openingState({},new Date()),'unknown');
});
