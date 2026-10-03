function Header({ title }) {
  return (
    <header className="h-16 bg-card-bg border-b border-card-border flex items-center px-8 sticky top-0 z-10">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
    </header>
  );
}

export default Header;