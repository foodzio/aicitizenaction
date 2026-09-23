// Publish the data as well as the site (docs/content-architecture.md): /api/bodies.json etc.
import { data, SECTIONS } from '../../lib/data.mjs';

export const getStaticPaths = () => SECTIONS.map(section => ({ params: { section } }));

export const GET = ({ params }) => {
  const records = data().records.filter(r => r._section === params.section);
  const body = {
    about: 'AI Citizen Action directory data. Verification is three-state: true (page opened, route seen), false (cited, unread — a lead), null (unchecked).',
    section: params.section,
    count: records.length,
    generated: new Date().toISOString(),
    records
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'content-type': 'application/json' } });
};
