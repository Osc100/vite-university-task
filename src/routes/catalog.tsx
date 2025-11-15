import { useFirestoreCollection } from "@/lib/hooks/useFirestoreCollection";
import { createFileRoute } from "@tanstack/react-router";
// --- NUEVO: Iconos para los botones de paginación ---
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { formatPrice } from "@/lib/export";

// --- Required Interfaces (copied from products page) ---
// (Sin cambios)
interface Category {
  id: string;
  name: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string; // The connection
  imageBase64?: string; // Image field
}

// --- NUEVO: Constante para el tamaño de página ---
const PRODUCTS_PER_PAGE = 8; // Puedes ajustar este número

// --- New Route Definition ---
export const Route = createFileRoute("/catalog")({
  component: CatalogPage,
});

function CatalogPage() {
  // --- Data Fetching ---
  // (Sin cambios)
  const { data: categories, loading: categoriesLoading } =
    useFirestoreCollection<Category>("categories", {
      pageSize: 1000,
    });

  const { data: products, loading: productsLoading } =
    useFirestoreCollection<Product>("products", {
      pageSize: 1000,
    });

  // --- State for selected category ---
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  // --- NUEVO: State para la página actual ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- Effect to set default category ---
  // (Sin cambios)
  useEffect(() => {
    if (!selectedCategoryId && categories && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // --- Memoized Filtering ---
  // (Sin cambios - esta es la lista *completa* de productos filtrados)
  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId || !products) return [];
    return products.filter(
      (product) => product.categoryId === selectedCategoryId,
    );
  }, [products, selectedCategoryId]);

  // --- NUEVO: Memos para la paginación ---

  // Calcula el número total de páginas basado en los productos filtrados
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  }, [filteredProducts.length]);

  // Obtiene solo los productos para la página actual
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  // --- NUEVO: Handlers para cambiar de página ---
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name || "";

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      {/* Header Section (Sin cambios) */}
      <header className="mb-4">
        <div className="flex items-center space-x-3">
          <ShoppingBag className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Product Catalog
          </h1>
        </div>
      </header>

      {/* --- Top Scrollable Category Bar --- */}
      <nav className="mb-8">
        <h2 className="text-sm font-semibold text-gray-600 mb-2">Categories</h2>
        {categoriesLoading && (
          <div className="w-full bg-gray-200 rounded-full h-8 animate-pulse" />
        )}
        <div className="flex space-x-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-transparent">
          {categories.map((cat) => (
            <button
              key={cat.id}
              // --- MODIFICADO: Resetea la página al cambiar de categoría ---
              onClick={() => {
                setSelectedCategoryId(cat.id);
                setCurrentPage(1); // Resetea a la página 1
              }}
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-150 ${selectedCategoryId === cat.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* --- Products Grid Section --- */}
      <section>
        {/* Section Header (Sin cambios) */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {selectedCategoryName
            ? `Showing ${selectedCategoryName}`
            : "Select a category"}
        </h2>

        {/* Loading Skeleton (Sin cambios) */}
        {productsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={`product-array-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  i
                  }`}
                className="bg-white rounded-xl shadow-lg animate-pulse"
              >
                <div className="w-full h-48 bg-gray-200 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-6 bg-gray-200 rounded w-1/3 pt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State (Sin cambios) */}
        {/* Sigue usando filteredProducts.length para saber si la *categoría* está vacía */}
        {!productsLoading &&
          filteredProducts.length === 0 &&
          selectedCategoryId && (
            <div className="text-center p-12 bg-white rounded-xl shadow-lg">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No Products Found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no products listed in the "{selectedCategoryName}"
                category.
              </p>
            </div>
          )}

        {/* Product Grid */}
        {!productsLoading && paginatedProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white shadow-lg rounded-xl overflow-hidden flex flex-col group transition-all duration-200 hover:shadow-2xl"
              >
                {/* Image Section (Sin cambios) */}
                <div className="w-full aspect-video bg-gray-100 relative overflow-hidden">
                  {prod.imageBase64 ? (
                    <img
                      src={prod.imageBase64}
                      alt={prod.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <ShoppingBag className="h-16 w-16" />
                    </div>
                  )}
                </div>

                {/* Content Section (Sin cambios) */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {prod.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 flex-1 truncate">
                    {prod.description}
                  </p>
                  <p className="text-xl font-bold text-indigo-600 mt-4">
                    {formatPrice(prod.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous</span>
            </button>
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
