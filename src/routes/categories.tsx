import { useFirestoreCollection } from "@/lib/hooks/useFirestoreCollection";
import { createFileRoute } from "@tanstack/react-router";
import { Tag, PlusCircle, Pencil, Trash2 } from "lucide-react"; // Import necessary Lucide icons

interface Category {
  id: string;
  name: string;
  description: string;
}

export const Route = createFileRoute("/categories")({
  component: CategoryPage,
});

function CategoryPage() {
  const { data: categories } = useFirestoreCollection<Category>("categories");

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      {/* Header Section */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Tag className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Product Categories
          </h1>
        </div>
        <button
          className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition duration-150 ease-in-out"
          type="button"
          // Add your onClick handler for adding a new category here
          onClick={() => console.log("Add New Category")}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add New Category
        </button>
      </header>

      {/* Category Grid/Table View */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="hidden border-b border-gray-200 bg-gray-50 p-4 font-semibold text-gray-600 md:grid md:grid-cols-[1fr_2fr_3fr_1fr] md:gap-4">
          <div className="truncate">ID</div>
          <div className="truncate">Name</div>
          <div className="truncate">Description</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Table Body - Map over categories */}
        {categories.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No categories found.
          </div>
        ) : (
          categories.map((cat) => (
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
                  onClick={() => console.log("Edit", cat.id)}
                  aria-label={`Edit ${cat.name}`}
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition duration-150"
                  onClick={() => console.log("Delete", cat.id)}
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
