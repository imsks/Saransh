export default function Navbar() {
  return (
    <nav className="sticky top-0 z-[100] h-14 w-full border-b border-line bg-surface">
      <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between px-8 max-[560px]:px-5">
        <span className="font-serif text-lg font-semibold tracking-tight text-ink">Saransh</span>
        <a
          href="https://github.com/imsks/Saransh"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11.5px] font-normal uppercase tracking-wider text-muted transition-colors hover:text-ink"
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  );
}
