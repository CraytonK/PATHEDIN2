import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../components/chrome';
import { SearchField, SearchResults } from '../components/SearchLayer';
import { search } from '../lib/search';
import './lists.css';

export function SearchScreen() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  return (
    <Page title="Search" back>
      <div className="list-page">
        <SearchField value={q} onChange={setQ} autoFocus placeholder="Destinations, people, communities" onCancel={() => navigate(-1)} />
        <SearchResults q={q} onPick={(href) => navigate(href)} onSuggest={(s) => navigate(`/discover?to=${search(s)[0]?.id ?? 'pharma-rnd'}`)} />
      </div>
    </Page>
  );
}
