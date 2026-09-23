import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Page } from '../components/chrome';
import { DefaultRail } from '../components/Rail';
import { Avatar, Button, Rich } from '../components/ui';
import { IconFlag, IconSignpost } from '../components/icons';
import { notificationList } from '../data/social';
import type { Notification } from '../data/types';
import { useApp } from '../lib/store';
import { springs } from '../lib/motion';
import './lists.css';

const groups: Notification['group'][] = ['Today', 'This week', 'Earlier'];

function Lead({ n }: { n: Notification }) {
  if (n.actor) return <Avatar id={n.actor} size={44} />;
  return <span className="notif__glyph">{n.kind === 'decision' ? <IconSignpost size={22} /> : <IconFlag size={22} />}</span>;
}

export function Notifications() {
  const readAll = useApp((s) => !!s.readNotifications.all);
  const markRead = useApp((s) => s.markNotificationsRead);
  const unread = notificationList.filter((n) => n.unread).length;
  return (
    <Page
      title="Notifications"
      subtitle="What moved along your Path."
      back="Home"
      rail={<DefaultRail />}
      trailing={
        !readAll && unread > 0 ? (
          <Button variant="plain" size="small" onClick={markRead}>
            Mark all as read
          </Button>
        ) : undefined
      }
    >
      <div className="list-page">
        {groups.map((g) => {
          const items = notificationList.filter((n) => n.group === g);
          if (!items.length) return null;
          return (
            <section key={g} className="list-group">
              <h2 className="list-group__h">{g}</h2>
              {items.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.smooth, delay: i * 0.03 }}>
                  <Link to={n.href} className={`notif ${n.unread && !readAll ? 'is-unread' : ''}`}>
                    <Lead n={n} />
                    <div className="notif__body">
                      <p className="t-subhead">
                        <Rich text={n.text} />
                      </p>
                      {n.context && <p className="notif__context t-footnote">{n.context}</p>}
                      <p className="t-caption1 c-3">{n.ago}</p>
                    </div>
                    {n.unread && !readAll && <span className="notif__dot" aria-label="Unread" />}
                  </Link>
                </motion.div>
              ))}
            </section>
          );
        })}
      </div>
    </Page>
  );
}
