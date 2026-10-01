import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Page } from '../components/chrome';
import { PLATFORM_FEE } from '../lib/guides';
import { NotFound } from './NotFound';
import './info.css';

/*
  Help, About, Privacy and Terms. Written for this prototype as it really is: a sample network that runs in your
  browser, takes no payment and sends nothing anywhere. Reachable from every footer, signed in or out.
*/

export type InfoKey = 'help' | 'about' | 'privacy' | 'terms';

const fee = `${Math.round(PLATFORM_FEE * 100)}%`;

export const infoPages: Record<InfoKey, { title: string; sub: string; body: ReactNode }> = {
  help: {
    title: 'Help',
    sub: 'How PathedIn works, and answers to the questions people ask first.',
    body: (
      <>
        <h2 id="paths">Your Path</h2>
        <p>Your Path is your career drawn as a line: the steps you’ve taken, the one you’re on now, and where you want to go. People see the step you’re on; Settings decides who sees the rest.</p>
        <h3>Why does PathedIn show me certain people?</h3>
        <p>Everyone is shown because of how their Path relates to yours. Path Twins share your steps, Peers are at your step now, People Ahead took the step you’re weighing, Guides reached where you’re going, and Explorers arrived there from somewhere else.</p>
        <h2 id="requests">Path Requests and messages</h2>
        <p>A Path Request asks someone about one stretch of their Path, such as “MSc Chem → CRO”, so they know exactly what you’re asking. They can accept, suggest a time or say not now. Once you’re talking, it continues in Messages.</p>
        <h2 id="guides">Path Guides and sessions</h2>
        <p>Path Guides are people who made a move you’re weighing and offer to help. Office Hours are always free. Guides can also offer paid 1:1 calls, mentorship, reviews, interview prep and group sessions, priced in Canadian dollars.</p>
        <h3>How do I change or cancel a session?</h3>
        <p>
          Open <Link to="/sessions">Your sessions</Link> from the menu under your photo. Each session can be added to your calendar, moved to another open time, or cancelled. After a session you can review it, and your review appears on the Guide’s profile.
        </p>
        <h3>How do I become a Guide?</h3>
        <p>
          Choose <Link to="/guide/setup">Become a Path Guide</Link>. You pick moves from your own Path, set what you offer and when, and go live. Your Guide hub shows who has booked you and what you’d keep.
        </p>
        <h2 id="communities">Communities</h2>
        <p>Path Communities are built around a journey, like “Chemistry → Pharmaceutical R&amp;D”. Everything you post shows where you are on that route, so replies come from people who can actually speak to it.</p>
        <h2 id="safety">Safety</h2>
        <p>Use the “…” menu on any post to report it or block its author. Reported posts leave your feed straight away. Blocked people can’t send you requests or messages; you can unblock them in Settings.</p>
      </>
    ),
  },
  about: {
    title: 'About PathedIn',
    sub: 'A professional network organised around career Paths.',
    body: (
      <>
        <p>Most networks ask who you know. PathedIn asks who you should know to get where you want to go, and answers with the people whose Paths cross yours: the ones beside you, a step ahead, and already where you’re heading.</p>
        <p>Everything on PathedIn hangs off the Path. Posts say why they’re in your feed, communities form around journeys rather than industries, and Path Guides help with the exact moves they’ve made.</p>
        <h2>This prototype</h2>
        <p>You’re looking at a working prototype. The people, companies and Paths in it are fictional; universities are real places used only as settings. The portraits are generated faces of people who don’t exist. Nothing you do here leaves your browser.</p>
      </>
    ),
  },
  privacy: {
    title: 'Privacy',
    sub: 'What PathedIn keeps, and who sees it.',
    body: (
      <>
        <h2>In this prototype</h2>
        <p>Everything you do (your profile edits, posts, messages, bookings, saved items and settings) is stored in this browser’s local storage and nowhere else. PathedIn has no server here: nothing is sent, sold or shared. Clearing your browser’s site data, or Reset in Settings, removes it.</p>
        <h2>Who sees your Path</h2>
        <p>The step you’re on is visible to everyone, because it’s how people find you. In Settings you decide whether your whole Path is visible to everyone, your connections, or only you, and whether you appear in “here now” counts.</p>
        <h2>Payments</h2>
        <p>The prototype takes no payment and never asks for card details. Prices are shown so you can see how Guides work.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms',
    sub: 'The short version of how PathedIn works for members and Guides.',
    body: (
      <>
        <h2>For everyone</h2>
        <p>Speak from your own Path. Be specific and kind, don’t misrepresent where you’ve been, and don’t use what people share with you anywhere else without asking.</p>
        <h2>For Path Guides</h2>
        <p>You can only guide moves you’ve made yourself, and your Path is shown with everything you offer. Office Hours and answers are free. For paid sessions, you set the price and PathedIn keeps {fee}, paying you the rest monthly. If you can’t make a session, move it or cancel it as early as you can.</p>
        <h2>Prototype</h2>
        <p>This is a prototype with sample people. No money moves, no account is created, and these terms are a preview of what the real thing would say.</p>
      </>
    ),
  },
};

const order: InfoKey[] = ['help', 'about', 'privacy', 'terms'];

/** The page itself; `standalone` drops the app's page frame for the signed-out intro. */
export function InfoBody({ k, standalone }: { k: InfoKey; standalone?: boolean }) {
  const page = infoPages[k];
  return (
    <div className={`info ${standalone ? 'info--standalone' : ''}`}>
      {standalone && (
        <header className="info__head">
          <h1 className="info__title">{page.title}</h1>
          <p className="info__sub">{page.sub}</p>
        </header>
      )}
      <nav className="info__nav" aria-label="Help and policies">
        {order.map((o) => (
          <NavLink key={o} to={`/${o}`} className={({ isActive }) => `info__tab ${isActive ? 'is-on' : ''}`}>
            {infoPages[o].title.replace(' PathedIn', '')}
          </NavLink>
        ))}
      </nav>
      <article className="info__body">{page.body}</article>
    </div>
  );
}

export const isInfoKey = (s: string): s is InfoKey => s in infoPages;

export function InfoScreen({ k }: { k: InfoKey }) {
  if (!infoPages[k]) return <NotFound />;
  return (
    <Page title={infoPages[k].title} subtitle={infoPages[k].sub} back="Home">
      <InfoBody k={k} />
    </Page>
  );
}
