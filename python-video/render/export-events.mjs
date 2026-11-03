// Exporta a timeline (duração + eventos sonoros + capítulos) para JSON.
import { writeFileSync } from 'fs';
import { buildTimeline } from '../src/timeline.js';
const tl = buildTimeline();
const chapters = tl.scenes.map((s) => ({ t: +s.start.toFixed(3), kind: s.kind, title: s.kind === 'mission' ? s.mission.title : s.kind }));
writeFileSync(process.argv[2] || 'audio/events.json', JSON.stringify({ duration: tl.duration, events: tl.events, chapters }));
console.log('duração', tl.duration.toFixed(2), 'eventos', tl.events.length);
