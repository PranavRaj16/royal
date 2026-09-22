"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Upload,
  AlertTriangle,
  X,
  Package,
} from "lucide-react";
import { ICategory } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    category: ICategory | null;
    error: string | null;
  }>({
    open: false,
    category: null,
    error: null,
  });

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (category: ICategory) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setImage(category.image || "");
    setDisplayOrder(category.displayOrder || 0);
    setIsActive(category.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setImage(data.url);
      } else {
        alert(data.error || "Failed to upload image");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description,
      image,
      displayOrder: Number(displayOrder),
      isActive,
    };

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory._id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save category");
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (category: ICategory) => {
    try {
      const res = await fetch(`/api/categories/${category._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to toggle category active status:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      const res = await fetch(`/api/categories/${deleteDialog.category._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteDialog((prev) => ({
          ...prev,
          error: data.error || "Failed to delete category",
        }));
        return;
      }

      setDeleteDialog({ open: false, category: null, error: null });
      fetchCategories();
    } catch {
      setDeleteDialog((prev) => ({
        ...prev,
        error: "Network error occurred while deleting",
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        <span className="text-sm text-gray-500">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#141414] tracking-tight">Categories</h1>
          <p className="text-sm text-[#666059]">
            Organize products into curated collections with dedicated display ordering.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Table / List */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl shadow-xs overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No categories yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Create categories such as Gold Jewellery, Diamond Jewellery, or Watches to organize your products.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#B4833E] text-white text-xs font-semibold rounded-xl"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-[#FAF8F5]/60 transition">
                    <td className="py-4 px-4 text-xs font-semibold text-gray-400">
                      #{cat.displayOrder}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.image || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=200&q=80"}
                          alt={cat.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-[#E8E2D9]"
                        />
                        <div>
                          <span className="font-semibold text-gray-900 block">{cat.name}</span>
                          {cat.description && (
                            <span className="text-xs text-gray-500 block max-w-xs truncate">
                              {cat.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-gray-500">{cat.slug}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        <Package className="w-3 h-3 text-gray-500" />
                        {cat.productCount ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                          cat.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {cat.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteDialog({ open: true, category: cat, error: null })}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E8E2D9] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#141414] mb-1">
              {editingCategory ? "Edit Category" : "New Category"}
            </h2>
            <p className="text-xs text-[#666059] mb-5">
              Set the category name, image, and position in your catalogue navigation.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  placeholder="e.g. Diamond Jewellery"
                  className="w-full px-3 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="diamond-jewellery"
                  className="w-full px-3 py-2.5 border border-[#D9D2C7] rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of items in this collection..."
                  className="w-full px-3 py-2 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>

              {/* Category Image */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Cover Image
                </label>
                <div className="flex items-center gap-4">
                  {image ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E8E2D9] group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}

                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D9D2C7] bg-[#FAF8F5] text-xs font-semibold text-gray-700 hover:bg-[#F3EFEA] transition">
                    <Upload className="w-4 h-4 text-[#B4833E]" />
                    <span>{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Or paste image URL (https://...)"
                  className="mt-2 w-full px-3 py-1.5 border border-[#D9D2C7] rounded-xl text-xs text-gray-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#B4833E] rounded border-gray-300 focus:ring-[#B4833E]"
                    />
                    <span>Active in catalogue</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-5 py-2 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && deleteDialog.category && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8E2D9] shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Category?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Are you sure you want to delete <strong>{deleteDialog.category.name}</strong>?
            </p>

            {deleteDialog.error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {deleteDialog.error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteDialog({ open: false, category: null, error: null })}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
