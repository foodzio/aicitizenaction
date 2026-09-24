// Publish the data as well as the site (docs/content-architecture.md): /api/bodies.json etc.
import { data, placeToContact, SECTIONS } from '../../lib/data.mjs';

export const getStaticPaths = () => SECTIONS.map(section => ({ params: { section } }));

export const GET = ({ params }) => {
  const all = data().records.filter(r => r._section === params.section);
  const records = params.section === 'channels' ? all.filter(placeToContact) : all;
  const body = {
    about: 'AI Citizen Action directory data. Channel records are published here only when a reviewed route explicitly accepts contact and is currently open or limited. Route verified still records technical retrieval separately.',
    section: params.section,
    count: records.length,
    excluded_count: all.length - records.length,
    generated: new Date().toISOString(),
    records
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'content-type': 'application/json' } });
};
