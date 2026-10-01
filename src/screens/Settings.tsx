import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../components/chrome';
import { Avatar, Button, Segmented, Switch } from '../components/ui';
import { me, people, ME } from '../data/people';
import { switchTheme } from '../lib/theme';
import { useApp, type Settings as SettingsT, type Theme } from '../lib/store';
import { useUI } from '../lib/ui';
import './settings.css';

/*
  Settings: your account, what PathedIn tells you about, who sees your Path, how it looks, the people you've
  blocked, and your data. Everything is kept on this device in the prototype, so "Reset" really does start over.
*/

function Group({ id, title, sub, children }: { id: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="set-group" aria-labelledby={id}>
      <header className="set-group__head">
        <h2 id={id} className="set-group__h">
          {title}
        </h2>
        {sub && <p className="set-group__sub">{sub}</p>}
      </header>
      <div className="set-card">{children}</div>
    </section>
  );
}

function Row({ title, sub, control, htmlFor }: { title: string; sub?: string; control: ReactNode; htmlFor?: string }) {
  return (
    <div className="set-row">
      <label className="set-row__text" htmlFor={htmlFor}>
        <span className="set-row__title">{title}</span>
        {sub && <span className="set-row__sub">{sub}</span>}
      </label>
      <div className="set-row__control">{control}</div>
    </div>
  );
}

export function Settings() {
  const settings = useApp((s) => s.settings);
  const set = useApp((s) => s.setSettings);
  const theme = useApp((s) => s.theme);
  const blocked = useApp((s) => s.blocked);
  const toggleBlock = useApp((s) => s.toggleBlock);
  const signOut = useApp((s) => s.signOut);
  const forget = useApp((s) => s.forgetAccount);
  const openEdit = useUI((s) => s.openEditProfile);
  const toast = useUI((s) => s.showToast);
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);
  const blockedIds = Object.keys(blocked).filter((id) => blocked[id] && people[id]);
  const notify = (k: keyof SettingsT['notify']) => (v: boolean) => set({ notify: { ...settings.notify, [k]: v } });

  return (
    <Page title="Settings" subtitle="Your account, notifications, privacy and appearance." back="Home">
      <div className="settings">
        <Group id="set-account" title="Account">
          <div className="set-row set-row--me">
            <Avatar id={ME} size={48} peek={false} />
            <span className="set-row__text">
              <span className="set-row__title">{me.name}</span>
              <span className="set-row__sub">{me.headline}</span>
            </span>
            <div className="set-row__control">
              <Button variant="gray" size="small" onClick={() => openEdit()}>
                Edit profile
              </Button>
            </div>
          </div>
          <Row title="Email" sub="maya.okafor@example.com · sample account" control={<span className="set-row__value">Verified</span>} />
          <Row title="Sign-in" sub="Google or email link. PathedIn never asks for a password in this prototype." control={null} />
        </Group>

        <Group id="set-notify" title="Notifications" sub="What PathedIn tells you about, in the app and by email.">
          <Row htmlFor="n-requests" title="Path Requests" sub="Someone asks you about a step on your Path." control={<Switch id="n-requests" label="Path Requests" on={settings.notify.requests} onChange={notify('requests')} />} />
          <Row htmlFor="n-replies" title="Replies and answers" sub="On your questions, conversations and stories." control={<Switch id="n-replies" label="Replies and answers" on={settings.notify.replies} onChange={notify('replies')} />} />
          <Row htmlFor="n-sessions" title="Sessions" sub="Confirmations, changes and a reminder the day before." control={<Switch id="n-sessions" label="Sessions" on={settings.notify.sessions} onChange={notify('sessions')} />} />
          <Row htmlFor="n-milestones" title="Milestones on your Path" sub="When someone reaches a step you’re heading for." control={<Switch id="n-milestones" label="Milestones" on={settings.notify.milestones} onChange={notify('milestones')} />} />
          <Row htmlFor="n-digest" title="Weekly email" sub="Your Path this week, every Monday." control={<Switch id="n-digest" label="Weekly email" on={settings.notify.digest} onChange={notify('digest')} />} />
        </Group>

        <Group id="set-privacy" title="Privacy" sub="Everyone can always see the step you’re on now. These decide the rest.">
          <div className="set-row set-row--stack">
            <span className="set-row__text">
              <span className="set-row__title">Who can see your whole Path</span>
              <span className="set-row__sub">Your past steps and where you’re heading.</span>
            </span>
            <Segmented
              ariaLabel="Who can see your whole Path"
              value={settings.pathVisibility}
              onChange={(v) => set({ pathVisibility: v })}
              options={[
                { value: 'everyone', label: 'Everyone' },
                { value: 'connections', label: 'Connections' },
                { value: 'only-me', label: 'Only me' },
              ]}
            />
          </div>
          <div className="set-row set-row--stack">
            <span className="set-row__text">
              <span className="set-row__title">Who can send you Path Requests</span>
              <span className="set-row__sub">People near your Path are on the same steps, a step behind or a step ahead.</span>
            </span>
            <Segmented
              ariaLabel="Who can send you Path Requests"
              value={settings.requestsFrom}
              onChange={(v) => set({ requestsFrom: v })}
              options={[
                { value: 'anyone', label: 'Anyone' },
                { value: 'near', label: 'People near my Path' },
              ]}
            />
          </div>
          <Row htmlFor="p-presence" title="Show me as here now" sub="Counted in “here now” and listed at your step in communities." control={<Switch id="p-presence" label="Show me as here now" on={settings.showPresence} onChange={(v) => set({ showPresence: v })} />} />
        </Group>

        <Group id="set-look" title="Appearance">
          <div className="set-row set-row--stack">
            <span className="set-row__text">
              <span className="set-row__title">Theme</span>
              <span className="set-row__sub">Soft Cream, Midnight, or follow your device.</span>
            </span>
            <Segmented<Theme>
              ariaLabel="Theme"
              value={theme}
              onChange={(v) => switchTheme(v)}
              options={[
                { value: 'light', label: 'Cream' },
                { value: 'dark', label: 'Midnight' },
                { value: 'system', label: 'Automatic' },
              ]}
            />
          </div>
        </Group>

        <Group id="set-blocked" title="Blocked people" sub="You won’t see their posts, and they can’t send you requests or messages.">
          {blockedIds.length ? (
            blockedIds.map((id) => (
              <div key={id} className="set-row">
                <Avatar id={id} size={36} peek={false} />
                <span className="set-row__text">
                  <span className="set-row__title">{people[id].name}</span>
                  <span className="set-row__sub">{people[id].headline}</span>
                </span>
                <div className="set-row__control">
                  <Button
                    variant="gray"
                    size="small"
                    onClick={() => {
                      toggleBlock(id);
                      toast(`${people[id].first} is unblocked`);
                    }}
                  >
                    Unblock
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="set-empty">Nobody. You can block someone from the “…” menu on any of their posts.</p>
          )}
        </Group>

        <Group id="set-data" title="Your data" sub="In this prototype everything you do is kept in this browser, and nothing leaves it.">
          <Row title="Help and policies" sub="How PathedIn works, privacy and terms." control={<Link to="/help" className="set-link">Open help</Link>} />
          {resetting ? (
            <div className="set-row set-row--confirm">
              <p>Start over? Your bookings, posts, messages, saved items and settings on this device are cleared and you’re signed out.</p>
              <div className="set-row__btns">
                <Button
                  variant="filled"
                  size="small"
                  className="btn--danger"
                  onClick={() => {
                    try {
                      localStorage.removeItem('pathedin:v1');
                    } catch {
                      /* storage blocked: signing out still resets the session */
                    }
                    forget();
                    signOut();
                    navigate('/');
                    window.location.reload();
                  }}
                >
                  Reset and sign out
                </Button>
                <Button variant="plain" size="small" onClick={() => setResetting(false)}>
                  Keep everything
                </Button>
              </div>
            </div>
          ) : (
            <Row
              title="Reset the prototype"
              sub="Clear everything on this device and start from the beginning."
              control={
                <Button variant="gray" size="small" onClick={() => setResetting(true)}>
                  Reset
                </Button>
              }
            />
          )}
          <Row
            title="Sign out"
            sub="Your things stay on this device for next time."
            control={
              <Button
                variant="gray"
                size="small"
                onClick={() => {
                  signOut();
                  navigate('/');
                }}
              >
                Sign out
              </Button>
            }
          />
        </Group>
      </div>
    </Page>
  );
}
