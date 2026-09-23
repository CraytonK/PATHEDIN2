import { useState } from 'react';
import { Page } from '../components/chrome';
import { DefaultRail } from '../components/Rail';
import { PersonRow } from '../components/content';
import { SearchField } from '../components/SearchLayer';
import { people } from '../data/people';
import { relationCopy, relationTo, relationOrder } from '../lib/relations';
import { useApp } from '../lib/store';
import './lists.css';

export function Connections() {
  const connections = useApp((s) => s.connections);
  const [q, setQ] = useState('');
  const ids = Object.keys(connections).filter((id) => connections[id] === 'connected' && people[id]);
  const pending = Object.keys(connections).filter((id) => connections[id] === 'pending');
  const match = (id: string) => !q || people[id].name.toLowerCase().includes(q.toLowerCase()) || people[id].headline.toLowerCase().includes(q.toLowerCase());
  const grouped = relationOrder
    .map((k) => ({ k, ids: ids.filter((id) => relationTo(id).kind === k && match(id)) }))
    .filter((g) => g.ids.length);
  return (
    <Page title="Connections" subtitle={`${ids.length} people, grouped by how their Path relates to yours.`} back="Network" rail={<DefaultRail people={['elena', 'rafael', 'priya']} />}>
      <div className="list-page">
        <SearchField value={q} onChange={setQ} placeholder="Search your connections" />
        {pending.length > 0 && !q && (
          <section className="list-group">
            <h2 className="list-group__h">Waiting to hear back</h2>
            {pending.map((id) => (
              <PersonRow key={id} id={id} compact />
            ))}
          </section>
        )}
        {grouped.map((g) => (
          <section key={g.k} className="list-group">
            <h2 className="list-group__h">{g.k === 'other' ? 'On different Paths' : relationCopy[g.k as keyof typeof relationCopy].plural}</h2>
            {g.ids.map((id) => (
              <PersonRow key={id} id={id} compact />
            ))}
          </section>
        ))}
      </div>
    </Page>
  );
}
