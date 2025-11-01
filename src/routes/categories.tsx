import { useFirestoreCollection } from "@/lib/hooks/useFirestoreCollection";
import { createFileRoute } from "@tanstack/react-router";
import {
  Tag,
  PlusCircle,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
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

interface Category {
  id: string;
  name: string;
  description: string;
}

export const Route = createFileRoute("/categories")({
  component: CategoryPage,
});

function CategoryPage() {
  const { data: categories, reload: refetch } =
    useFirestoreCollection<Category>("categories", {
      pageSize: 1000,
    });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [currentCategory, setCurrentCategory] = useState({
    id: "",
    name: "",
    description: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        category.id.toLowerCase().includes(query),
    );
  }, [categories, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory.name.trim()) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, "categories"), {
        name: currentCategory.name.trim(),
        description: currentCategory.description.trim(),
        createdAt: new Date(),
      });
      resetForm();
      setIsModalOpen(false);
      toast.success("Added category successfully");
      await refetch();
    } catch (error) {
      console.error("Error adding category: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory.name.trim() || !currentCategory.id) return;

    setIsLoading(true);
    try {
      await updateDoc(doc(db, "categories", currentCategory.id), {
        name: currentCategory.name.trim(),
        description: currentCategory.description.trim(),
        updatedAt: new Date(),
      });
      resetForm();
      setIsModalOpen(false);
      toast.success("Updated category successfully");
      await refetch();
    } catch (error) {
      console.error("Error updating category: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete({ id: category.id, name: category.name });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteDoc(doc(db, "categories", categoryToDelete.id));
      toast.success("Deleted category successfully");
      await refetch();
    } catch (error) {
      console.error("Error deleting category: ", error);
      toast.error("Failed to delete category. Please try again.");
    } finally {
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleEditClick = (category: Category) => {
    setCurrentCategory({
      id: category.id,
      name: category.name,
      description: category.description,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCurrentCategory({
      id: "",
      name: "",
      description: "",
    });
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
            <Tag className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Product Categories
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search categories by name, description, or ID..."
            />
            <button
              className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition duration-150 ease-in-out whitespace-nowrap"
              type="button"
              onClick={handleAddClick}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Category
            </button>
          </div>
        </div>
      </header>

      {/* Results Count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredCategories.length} of {categories.length} categories
          {searchQuery && (
            <span>
              {" "}
              for "<span className="font-medium">{searchQuery}</span>"
            </span>
          )}
        </div>
      )}

      {/* Category Grid/Table View */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="hidden border-b border-gray-200 bg-gray-50 p-4 font-semibold text-gray-600 md:grid md:grid-cols-[1fr_2fr_3fr_1fr] md:gap-4">
          <div className="truncate">ID</div>
          <div className="truncate">Name</div>
          <div className="truncate">Description</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Table Body - Map over filtered categories */}
        {filteredCategories.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchQuery
              ? "No categories found matching your search."
              : "No categories found."}
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={`cat-${cat.id}`}
              className="border-b border-gray-100 p-4 hover:bg-indigo-50 transition duration-100 ease-in-out last:border-b-0 md:grid md:grid-cols-[1fr_2fr_3fr_1fr] md:gap-4 md:items-center"
            >
              {/* ID */}
              <div className="text-sm font-medium text-gray-900 truncate">
                <span className="md:hidden font-semibold text-gray-500">
                  ID:{" "}
                </span>
                {cat.id}
              </div>

              {/* Name */}
              <div className="text-base font-semibold text-indigo-600 truncate my-1 md:my-0">
                <span className="md:hidden font-semibold text-gray-500">
                  Name:{" "}
                </span>
                {cat.name}
              </div>

              {/* Description */}
              <div className="text-sm text-gray-500 truncate mb-2 md:mb-0">
                <span className="md:hidden font-semibold text-gray-500">
                  Description:{" "}
                </span>
                {cat.description}
              </div>

              {/* Actions (Edit/Delete) */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="p-2 text-indigo-500 hover:text-indigo-700 rounded-full hover:bg-indigo-100 transition duration-150"
                  onClick={() => handleEditClick(cat)}
                  aria-label={`Edit ${cat.name}`}
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition duration-150"
                  onClick={() => handleDeleteClick(cat)}
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? "Edit Category" : "Add New Category"}
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
              onSubmit={isEditMode ? handleEditCategory : handleAddCategory}
              className="p-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={currentCategory.name}
                  onChange={(e) =>
                    setCurrentCategory((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter category name"
                />
              </div>

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
                  value={currentCategory.description}
                  onChange={(e) =>
                    setCurrentCategory((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter category description"
                />
              </div>

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
                  disabled={isLoading || !currentCategory.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                >
                  {isLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Adding..."
                    : isEditMode
                      ? "Update Category"
                      : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && categoryToDelete && (
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
                Are you sure you want to delete the category{" "}
                <span className="font-semibold text-red-600">
                  "{categoryToDelete.name}"
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
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
