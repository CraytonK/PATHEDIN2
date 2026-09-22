import { Link } from 'react-router-dom';
import { Page } from '../components/chrome';
import { Button } from '../components/ui';
import './lists.css';

export function NotFound() {
  return (
    <Page title="Off the map" back>
      <div className="empty">
        <svg width="120" height="48" viewBox="0 0 120 48" aria-hidden="true">
          <path d="M8 24h44" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 24h52" stroke="var(--label-3)" strokeWidth="4" strokeLinecap="round" strokeDasharray="0 9" />
          <circle cx="8" cy="24" r="6" fill="var(--bg)" stroke="var(--ink)" strokeWidth="3.5" />
          <circle cx="56" cy="24" r="9" fill="var(--tint)" />
        </svg>
        <p className="t-title3">This Path doesn’t lead anywhere yet.</p>
        <p className="t-subhead c-2">The page you’re looking for may have moved.</p>
        <Link to="/">
          <Button variant="filled" size="medium">
            Back to Home
          </Button>
        </Link>
      </div>
    </Page>
  );
}
