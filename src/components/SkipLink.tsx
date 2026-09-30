/*
  The first thing a keyboard reaches: a way past the top bar to the page itself. It stays out of sight until
  it has focus. The app routes on the hash, so it moves focus itself rather than following "#main".
*/
export function SkipLink() {
  return (
    <a
      className="skip-link"
      href="#main"
      onClick={(e) => {
        e.preventDefault();
        const main = document.getElementById('main');
        main?.focus();
        main?.scrollIntoView({ block: 'start' });
      }}
    >
      Skip to content
    </a>
  );
}
