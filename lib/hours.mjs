import {businessSeed} from '../config/business.mjs';
const format = new Intl.DateTimeFormat('en-CA',{timeZone:businessSeed.timezone,
  year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function minutes(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? Number(value.slice(0,2))*60 + Number(value.slice(3)) : NaN;
}
function intervals(value) {
  if (!Array.isArray(value)) return null;
  const parsed=[];
  for (const pair of value) {
    if (!Array.isArray(pair) || pair.length!==2) return null;
    const [start,end]=pair.map(minutes);
    if (!Number.isFinite(start+end) || start===end) return null;
    parsed.push([start,end]);
  }
  return parsed;
}
export function openingState(hours, now=new Date()) {
  const schedule=hours?.schedule;
  if (!schedule || !Number.isFinite(now.valueOf())) return 'unknown';
  const p=Object.fromEntries(format.formatToParts(now).map(x=>[x.type,x.value]));
  const today= p.year+'-'+p.month+'-'+p.day;
  const calendar=new Date(today+'T12:00:00Z');
  const day=calendar.getUTCDay();
  calendar.setUTCDate(calendar.getUTCDate()-1);
  const yesterday=calendar.toISOString().slice(0,10);
  const m=Number(p.hour)*60+Number(p.minute);
  const override=Object.hasOwn(schedule.special??{},today);
  const current=intervals(override?schedule.special[today]:schedule.weekly?.[day]);
  if(current?.some(([s,e])=>m>=s && (e<s || m<e))) return 'open';
  // An explicit special date replaces all normal coverage, including yesterday's spill.
  if(override) return current?'closed':'unknown';
  const previous=intervals(schedule.special?.[yesterday]??schedule.weekly?.[(day+6)%7]);
  if(previous?.some(([s,e])=>e<s && m<e)) return 'open';
  return current && previous ? 'closed':'unknown';
}
