import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Save, Upload, X } from "lucide-react";
import api from "../../api/axios";

const initialForm = {
  category_id: "",
  brand_id: "",
  name: "",
  description: "",
  price: "",
  stock: "",
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState(null);

  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      setError("");

      try {
        const requests = [api.get("/categories"), api.get("/brands")];

        if (isEdit) {
          requests.push(api.get(`/products/${id}`));
        }

        const results = await Promise.all(requests);

        setCategories(results[0].data || []);
        setBrands(results[1].data || []);

        if (isEdit) {
          const product = results[2].data;

          setForm({
            category_id: product.category_id ?? "",
            brand_id: product.brand_id ?? "",
            name: product.name ?? "",
            description: product.description ?? "",
            price: product.price ?? "",
            stock: product.stock ?? "",
          });

          setImages(product.images ?? []);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load product information.",
        );
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const validateForm = () => {
    if (!form.category_id) {
      setError("Please select a category.");
      return false;
    }

    if (!form.name.trim()) {
      setError("Please enter a product name.");
      return false;
    }

    if (form.price === "" || Number(form.price) < 0) {
      setError("Please enter a valid price.");
      return false;
    }

    if (
      form.stock === "" ||
      Number(form.stock) < 0 ||
      !Number.isInteger(Number(form.stock))
    ) {
      setError("Please enter a valid stock quantity.");
      return false;
    }

    return true;
  };

  const uploadProductImages = async (productId, items) => {
    if (!items.length) return;

    const formData = new FormData();

    items.forEach((item) => {
      formData.append("images[]", item.file);
    });

    await api.post(`/products/${productId}/images`, formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setSaving(true);

    try {
      const payload = {
        category_id: form.category_id,
        brand_id: form.brand_id || null,
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);

        if (selectedFiles.length > 0) {
          setUploading(true);
          await uploadProductImages(id, selectedFiles);
          setUploading(false);
        }

        navigate("/admin/products");
        return;
      }

      const res = await api.post("/products", payload);

      const newProductId = res.data?.id;

      if (!newProductId) {
        throw new Error(
          "Product was created successfully but no ID was returned.",
        );
      }

      if (selectedFiles.length > 0) {
        setUploading(true);
        await uploadProductImages(newProductId, selectedFiles);
        setUploading(false);
      }

      navigate("/admin/products");
    } catch (err) {
      setUploading(false);

      setError(
        err.response?.data?.message || err.message || "Failed to save product.",
      );
    } finally {
      setSaving(false);
    }
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);

    if (!files.length) return;

    setImageError("");

    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024,
    );

    if (!validFiles.length) {
      setImageError(
        "Please select valid JPG, PNG, or WEBP images smaller than 5MB.",
      );
      return;
    }

    if (validFiles.length !== files.length) {
      setImageError(
        "Some files were skipped. Only images smaller than 5MB are allowed.",
      );
    }

    const newFiles = validFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e) => {
    addFiles(e.target.files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();

    setIsDragging(false);

    if (saving || uploading) return;

    addFiles(e.dataTransfer.files);
  };

  const removeSelectedFile = (fileId) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((item) => item.id === fileId);

      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      return prev.filter((item) => item.id !== fileId);
    });
  };

  const handleImageDelete = async (publicId) => {
    if (!publicId || deletingImage) return;

    setImageError("");
    setDeletingImage(publicId);

    try {
      const res = await api.delete(`/products/${id}/images`, {
        data: {
          public_id: publicId,
        },
      });

      setImages(res.data?.images || []);
    } catch (err) {
      setImageError(err.response?.data?.message || "Failed to delete image.");
    } finally {
      setDeletingImage(null);
    }
  };

  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [selectedFiles]);

  if (loadingData) {
    return (
      <div className="min-h-125 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 size={24} className="animate-spin text-moss" />

          <p className="text-[13px] text-stone mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-none">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="text-[13px] text-stone">
          Catalog
          <span className="mx-2">/</span>
          Products
          <span className="mx-2">/</span>
          <span className="text-ink">
            {isEdit ? "Edit Product" : "New Product"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          disabled={saving || uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-hairline text-ink text-[13px] font-medium hover:bg-paper transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <h1 className="font-display text-[30px] font-medium text-ink mb-7">
        {isEdit ? "Edit Product" : "New Product"}
      </h1>

      {error && (
        <div className="text-[13px] text-clay bg-clay-tint border border-clay/15 rounded-lg px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)] gap-5 items-start">
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-hairline rounded-xl p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category" required>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                disabled={saving || uploading}
                required
                className={inputClass}
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Brand">
              <select
                name="brand_id"
                value={form.brand_id}
                onChange={handleChange}
                disabled={saving || uploading}
                className={inputClass}
              >
                <option value="">No brand</option>

                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Name" required>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
              maxLength={255}
              disabled={saving || uploading}
              required
              className={inputClass}
            />
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Write a short product description..."
              disabled={saving || uploading}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Price (USD)" required>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={saving || uploading}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Stock" required>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="0"
                disabled={saving || uploading}
                required
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              disabled={saving || uploading}
              className="px-5 py-2.5 rounded-lg border border-hairline text-ink text-[13.5px] font-medium hover:bg-paper transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving || uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}

              {uploading
                ? "Uploading Images..."
                : saving
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Product"}
            </button>
          </div>
        </form>

        <div className="space-y-5">
          <div className="bg-surface border border-hairline rounded-xl p-6">
            <div className="mb-4">
              <h2 className="font-display text-[19px] font-medium text-ink">
                Product Images
              </h2>

              <p className="text-[12px] text-stone mt-1">
                Add clear images to help customers.
              </p>
            </div>

            {imageError && (
              <div className="text-[12px] text-clay bg-clay-tint border border-clay/15 rounded-lg px-3 py-2.5 mb-4">
                {imageError}
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {images.map((img, index) => (
                  <div
                    key={img.public_id || img.id || index}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-hairline bg-paper"
                  >
                    <img
                      src={img.url}
                      alt={`${form.name || "Product"} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {img.is_primary && (
                      <span className="absolute top-2 left-2 text-[9px] font-medium uppercase tracking-wide bg-moss text-white px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleImageDelete(img.public_id)}
                      disabled={deletingImage === img.public_id}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                    >
                      {deletingImage === img.public_id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedFiles.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-moss/30 bg-paper"
                  >
                    <img
                      src={item.preview}
                      alt={`Selected image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    <span className="absolute top-2 left-2 text-[9px] font-medium uppercase tracking-wide bg-moss text-white px-1.5 py-0.5 rounded">
                      New
                    </span>

                    <button
                      type="button"
                      onClick={() => removeSelectedFile(item.id)}
                      disabled={saving || uploading}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();

                if (!saving && !uploading) {
                  setIsDragging(true);
                }
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`min-h-57.5 flex flex-col items-center justify-center text-center border border-dashed rounded-lg px-5 transition-colors ${
                isDragging
                  ? "border-moss bg-moss-tint"
                  : "border-hairline hover:bg-paper"
              } ${saving || uploading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Upload size={32} strokeWidth={1.5} className="text-moss mb-4" />

              <p className="text-[14px] font-medium text-ink">
                Drag & drop images here
              </p>

              <p className="text-[13px] text-stone mt-1">
                or click the button below
              </p>

              <p className="text-[11px] text-stone mt-4">
                JPG, PNG, WEBP up to 5MB each
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || uploading}
                className="mt-4 px-5 py-2 rounded-lg border border-moss/40 text-moss text-[13px] font-medium hover:bg-moss-tint transition-colors disabled:opacity-50"
              >
                Choose Files
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={saving || uploading}
              />
            </div>
          </div>

          <div className="bg-surface border border-hairline rounded-xl p-6">
            <h2 className="font-display text-[19px] font-medium text-ink mb-4">
              Tips
            </h2>

            <div className="space-y-3">
              {[
                "Use a clear and descriptive name",
                "Set a competitive price",
                "Add high quality images",
                "Keep stock updated",
              ].map((tip) => (
                <div key={tip} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-moss-tint flex items-center justify-center shrink-0">
                    <Check size={10} className="text-moss" strokeWidth={3} />
                  </div>

                  <p className="text-[13px] text-stone">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] placeholder:text-stone/60 focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss transition-shadow disabled:opacity-60 disabled:cursor-not-allowed";

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
        {label}
        {required && <span className="text-clay ml-1">*</span>}
      </label>

      {children}
    </div>
  );
}
