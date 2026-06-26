const COFFEE_URL = 'https://www.buymeacoffee.com/DIRTYmasterchief';

/** Subtle "Buy me a coffee" support link (shared with the ClipHive project). */
export default function SupportLink() {
  return (
    <a
      className="support-link"
      href={COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Support DevGuessr"
    >
      <svg
        className="support-icon"
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M5 9h10v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z" />
        <path d="M15 11h2a2 2 0 0 1 0 4h-2" />
        <line x1="7" y1="7" x2="13" y2="7" />
      </svg>
      <span>Buy me a coffee</span>
    </a>
  );
}
