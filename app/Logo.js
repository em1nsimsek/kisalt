export default function Logo() {
  return (
    <a className="logo" href="/" aria-label="Kısalt ana sayfa">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#121821" stroke="#223041" />
        <path d="M9 10l7 6-7 6" fill="none" stroke="#4f8cff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="20" width="7" height="3" rx="1" fill="#ffb454" />
      </svg>
      <span>kısalt</span>
    </a>
  );
}
