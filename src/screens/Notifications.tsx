import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Page } from '../components/chrome';
import { DefaultRail } from '../components/Rail';
import { Avatar, Button, Rich } from '../components/ui';
import { IconCalendar, IconFlag, IconSignpost } from '../components/icons';
import { dayLabel, fmtTime } from '../lib/booking';
import { bookingTitle } from '../lib/guides';
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

/** Your sessions in the next week, as reminders. Off when you switch session notifications off in Settings. */
function useReminders() {
  const bookings = useApp((s) => s.bookings);
  const on = useApp((s) => s.settings.notify.sessions);
  if (!on) return [];
  const now = Date.now();
  return bookings
    .filter((b) => +new Date(b.at) > now && +new Date(b.at) - now < 7 * 86_400_000)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at));
}

export function Notifications() {
  const reminders = useReminders();
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
        {reminders.length > 0 && (
          <section className="list-group">
            <h2 className="list-group__h">Coming up</h2>
            <div className="card-stack card-stack--rows">
              {reminders.map((b) => {
                const at = new Date(b.at);
                const soon = +at - Date.now() < 2 * 86_400_000;
                return (
                  <Link key={b.id} to="/sessions" className={`notif ${soon ? 'is-unread' : ''}`}>
                    <span className="notif__glyph">
                      <IconCalendar size={22} />
                    </span>
                    <div className="notif__body">
                      <p className="t-subhead">
                        <strong>{bookingTitle(b)}</strong> is {['Today', 'Tomorrow'].includes(dayLabel(at)) ? dayLabel(at).toLowerCase() : `on ${dayLabel(at)}`} at {fmtTime(at)}
                      </p>
                      <p className="notif__context t-footnote">{b.topic}</p>
                      <p className="t-caption1 c-3">Add it to your calendar, change the time or cancel in Your sessions</p>
                    </div>
                    {soon && <span className="notif__dot" aria-label="Soon" />}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        {groups.map((g) => {
          const items = notificationList.filter((n) => n.group === g);
          if (!items.length) return null;
          return (
            <section key={g} className="list-group">
              <h2 className="list-group__h">{g}</h2>
              <div className="card-stack card-stack--rows">
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
              </div>
            </section>
          );
        })}
      </div>
    </Page>
  );
}
