import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between w-full">
      <nav className="flex flex-row gap-4 w-full">
        <div className="px-2 font-bold flex flex-row gap-4">
          <Link to="/">Home</Link>
          <Link to="/catalog">Catalog</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/products">Products</Link>
        </div>
      </nav>
    </header>
  );
}
