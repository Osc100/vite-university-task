import { useFirestoreCollection } from "@/lib/hooks/useFirestoreCollection";
import { createFileRoute } from "@tanstack/react-router";
import {
  ShoppingBag,
  PlusCircle,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  ImagePlus, // Added for image upload
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  deleteDoc,
  doc,
  addDoc,
  collection,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { SearchBar } from "@/components/search-bar";

// Interface for the "connection"
interface Category {
  id: string;
  name: string;
  description: string;
}

// Product interface updated with imageBase64
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string; // The connection
  imageBase64?: string; // New field for the image
}

// Helper to format price
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price || 0);
};

// New route path
export const Route = createFileRoute("/products")({
  component: ProductPage,
});

function ProductPage() {
  // --- Data Fetching ---
  const { data: products, reload: refetchProducts } =
    useFirestoreCollection<Product>("products", {
      pageSize: 1000,
    });
  const { data: categories } = useFirestoreCollection<Category>("categories", {
    pageSize: 1000,
  });

  // --- State Management ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Initial state for the product form
  const initialProductState = {
    id: "",
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    imageBase64: "", // New field
  };
  const [currentProduct, setCurrentProduct] = useState<
    Omit<Product, "id"> & { id: string }
  >(initialProductState);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Memos & Filters ---
  const categoryMap = useMemo(() => {
    if (!categories) return new Map<string, string>();
    return new Map(categories.map((cat) => [cat.id, cat.name]));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query) ||
        (categoryMap.get(product.categoryId) || "")
          .toLowerCase()
          .includes(query),
    );
  }, [products, searchQuery, categoryMap]);

  // --- Event Handlers ---

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // New: Handler for image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // --- Firestore Document Size Limit Check ---
    // Firestore documents have a 1 MiB limit. Base64 encoding adds ~33% overhead.
    // Setting a ~1MB limit on the original file is safest.
    if (file.size > 1024 * 1024) {
      toast.error("Image is too large. Please use an image under 1MB.");
      e.target.value = ""; // Reset the input
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCurrentProduct((prev) => ({
        ...prev,
        imageBase64: reader.result as string,
      }));
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // New: Handler to remove the image from state
  const removeImage = () => {
    setCurrentProduct((prev) => ({ ...prev, imageBase64: "" }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.name.trim() || !currentProduct.categoryId) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        name: currentProduct.name.trim(),
        description: currentProduct.description.trim(),
        price: Number(currentProduct.price) || 0,
        categoryId: currentProduct.categoryId,
        imageBase64: currentProduct.imageBase64 || "", // Save image
        createdAt: new Date(),
      });
      resetForm();
      setIsModalOpen(false);
      toast.success("Added product successfully");
      await refetchProducts();
    } catch (error) {
      console.error("Error adding product: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !currentProduct.name.trim() ||
      !currentProduct.id ||
      !currentProduct.categoryId
    )
      return;

    setIsLoading(true);
    try {
      await updateDoc(doc(db, "products", currentProduct.id), {
        name: currentProduct.name.trim(),
        description: currentProduct.description.trim(),
        price: Number(currentProduct.price) || 0,
        categoryId: currentProduct.categoryId,
        imageBase64: currentProduct.imageBase64 || "", // Update image
        updatedAt: new Date(),
      });
      resetForm();
      setIsModalOpen(false);
      toast.success("Updated product successfully");
      await refetchProducts();
    } catch (error) {
      console.error("Error updating product: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete({ id: product.id, name: product.name });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteDoc(doc(db, "products", productToDelete.id));
      toast.success("Deleted product successfully");
      await refetchProducts();
    } catch (error) {
      console.error("Error deleting product: ", error);
      toast.error("Failed to delete product. Please try again.");
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleEditClick = (product: Product) => {
    // Ensure imageBase64 is an empty string if it's null/undefined
    setCurrentProduct({ ...product, imageBase64: product.imageBase64 || "" });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCurrentProduct(initialProductState);
    setIsEditMode(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Products
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search products by name, category, or description..."
            />
            <button
              className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition duration-150 ease-in-out whitespace-nowrap"
              type="button"
              onClick={handleAddClick}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Product
            </button>
          </div>
        </div>
      </header>

      {/* Results Count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
          {searchQuery && (
            <span>
              {" "}
              for "<span className="font-medium">{searchQuery}</span>"
            </span>
          )}
        </div>
      )}

      {/* Product Grid/Table View */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        {/* Table Header - Added 'Image' column */}
        <div className="hidden border-b border-gray-200 bg-gray-50 p-4 font-semibold text-gray-600 md:grid md:grid-cols-[0.5fr_2fr_1.5fr_1fr_3fr_1fr] md:gap-4">
          <div className="truncate">Image</div>
          <div className="truncate">Name</div>
          <div className="truncate">Category</div>
          <div className="truncate">Price</div>
          <div className="truncate">Description</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Table Body - Map over filtered products */}
        {filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchQuery
              ? "No products found matching your search."
              : "No products found."}
          </div>
        ) : (
          filteredProducts.map((prod) => (
            <div
              key={`prod-${prod.id}`}
              className="border-b border-gray-100 p-4 hover:bg-indigo-50 transition duration-100 ease-in-out last:border-b-0 md:grid md:grid-cols-[0.5fr_2fr_1.5fr_1fr_3fr_1fr] md:gap-4 md:items-center"
            >
              {/* New: Image Cell */}
              <div className="flex items-center md:py-0 pb-2 md:pb-0">
                {prod.imageBase64 ? (
                  <img
                    src={prod.imageBase64}
                    alt={prod.name}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="text-base font-semibold text-indigo-600 truncate my-1 md:my-0">
                <span className="md:hidden font-semibold text-gray-500">
                  Name:{" "}
                </span>
                {prod.name}
              </div>

              {/* Category */}
              <div className="text-sm text-gray-700 truncate mb-2 md:mb-0">
                <span className="md:hidden font-semibold text-gray-500">
                  Category:{" "}
                </span>
                {categoryMap.get(prod.categoryId) || (
                  <span className="italic text-gray-400">Uncategorized</span>
                )}
              </div>

              {/* Price */}
              <div className="text-sm font-medium text-gray-900 truncate mb-2 md:mb-0">
                <span className="md:hidden font-semibold text-gray-500">
                  Price:{" "}
                </span>
                {formatPrice(prod.price)}
              </div>

              {/* Description */}
              <div className="text-sm text-gray-500 truncate mb-2 md:mb-0">
                <span className="md:hidden font-semibold text-gray-500">
                  Description:{" "}
                </span>
                {prod.description}
              </div>

              {/* Actions (Edit/Delete) */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="p-2 text-indigo-500 hover:text-indigo-700 rounded-full hover:bg-indigo-100 transition duration-150"
                  onClick={() => handleEditClick(prod)}
                  aria-label={`Edit ${prod.name}`}
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition duration-150"
                  onClick={() => handleDeleteClick(prod)}
                  aria-label={`Delete ${prod.name}`}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* Increased max-w-lg for more space */}
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition duration-150"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={isEditMode ? handleEditProduct : handleAddProduct}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto" // Make form scrollable
            >
              {/* Product Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={currentProduct.name}
                  onChange={(e) =>
                    setCurrentProduct((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter product name"
                />
              </div>

              {/* Category Select */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category *
                </label>
                <select
                  id="category"
                  required
                  value={currentProduct.categoryId}
                  onChange={(e) =>
                    setCurrentProduct((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {(categories || []).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Input */}
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price *
                </label>
                <input
                  type="number"
                  id="price"
                  required
                  value={currentProduct.price}
                  onChange={(e) =>
                    setCurrentProduct((prev) => ({
                      ...prev,
                      price: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* New: Image Upload Section */}
              <div>
                <label
                  htmlFor="image-selector"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Image
                </label>
                {currentProduct.imageBase64 ? (
                  // Image Preview
                  <div className="relative group">
                    <img
                      id="image-selector"
                      src={currentProduct.imageBase64}
                      alt="Product Preview"
                      className="w-full h-48 rounded-md object-cover border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  // Upload Button
                  <label
                    htmlFor="image-upload"
                    className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImagePlus className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP (Max 1MB)
                      </p>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={currentProduct.description}
                  onChange={(e) =>
                    setCurrentProduct((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter product description"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !currentProduct.name.trim() ||
                    !currentProduct.categoryId
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                >
                  {isLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Adding..."
                    : isEditMode
                      ? "Update Product"
                      : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Unchanged) */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                Confirm Deletion
              </h2>
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="text-gray-400 hover:text-gray-600 transition duration-150"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the product{" "}
                <span className="font-semibold text-red-600">
                  "{productToDelete.name}"
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-150"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
