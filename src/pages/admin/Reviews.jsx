import { useContext, useEffect, useMemo, useState } from "react";
import {
  Star,
  Trash2,
  RefreshCw,
  MessageSquare,
  StarHalf,
  User,
  Package,
  Search,
  X,
} from "lucide-react";
import api from "../../api/axios";
import { RowSkeleton, StatSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";

const RATINGS = [5, 4, 3, 2, 1];

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [ratingFilter, setRatingFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const { showToast } = useContext(ToastContext);

  const loadReviews = async (rating = ratingFilter, isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get("/admin/reviews", {
        params: rating ? { rating } : {},
      });

      setReviews(res.data?.data || []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load reviews";

      setError(message);

      if (isRefresh) {
        showToast(message, "error");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews(ratingFilter);
  }, [ratingFilter]);

  const filteredReviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return reviews;

    return reviews.filter((review) => {
      const userName = review.user?.name?.toLowerCase() || "";
      const productName = review.product?.name?.toLowerCase() || "";
      const title = review.title?.toLowerCase() || "";
      const comment = review.comment?.toLowerCase() || "";

      return (
        userName.includes(keyword) ||
        productName.includes(keyword) ||
        title.includes(keyword) ||
        comment.includes(keyword)
      );
    });
  }, [reviews, search]);

  const stats = useMemo(() => {
    const total = reviews.length;

    const average =
      total > 0
        ? (
            reviews.reduce(
              (sum, review) => sum + Number(review.rating || 0),
              0,
            ) / total
          ).toFixed(1)
        : "0.0";

    const fiveStar = reviews.filter(
      (review) => Number(review.rating) === 5,
    ).length;

    const lowRating = reviews.filter(
      (review) => Number(review.rating) <= 2,
    ).length;

    return {
      total,
      average,
      fiveStar,
      lowRating,
    };
  }, [reviews]);

  const handleDelete = async (review) => {
    const confirmed = window.confirm(
      "Delete this review? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeletingId(review.id);

      await api.delete(`/reviews/${review.id}`);

      setReviews((prev) => prev.filter((item) => item.id !== review.id));

      showToast("Review deleted successfully");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete review",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilterChange = (rating) => {
    setRatingFilter(rating);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone mb-1">
            Moderation
          </p>

          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-medium text-ink">
              Reviews
            </h1>

            {!loading && (
              <span className="px-2 py-0.5 rounded-md bg-moss-tint text-moss text-[11px] font-medium">
                {reviews.length}
              </span>
            )}
          </div>

          <p className="text-[13px] text-stone mt-1">
            Monitor and manage customer product reviews.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadReviews(ratingFilter, true)}
          disabled={loading || refreshing}
          className="w-10 h-10 rounded-lg border border-hairline bg-surface flex items-center justify-center text-stone hover:text-ink hover:bg-paper transition-colors disabled:opacity-50"
          title="Refresh reviews"
        >
          <RefreshCw
            size={16}
            strokeWidth={1.75}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Statistics */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={MessageSquare}
            label="Total Reviews"
            value={stats.total}
          />

          <StatCard
            icon={Star}
            label="Average Rating"
            value={`${stats.average}/5`}
            valueClass="text-moss"
          />

          <StatCard icon={Star} label="5 Star Reviews" value={stats.fiveStar} />

          <StatCard
            icon={StarHalf}
            label="Low Ratings"
            value={stats.lowRating}
            valueClass={stats.lowRating > 0 ? "text-clay" : "text-ink"}
          />
        </div>
      )}

      {/* Search and Filters */}
      {!loading && reviews.length > 0 && (
        <div className="bg-surface border border-hairline rounded-xl p-4 mb-5">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.75}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, product, title, or comment..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-hairline bg-paper text-[13.5px] text-ink placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Rating Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <FilterPill
                  label="All"
                  active={ratingFilter === ""}
                  onClick={() => handleFilterChange("")}
                />

                {RATINGS.map((rating) => (
                  <FilterPill
                    key={rating}
                    label={`${rating} Star`}
                    rating={rating}
                    active={ratingFilter === String(rating)}
                    onClick={() => handleFilterChange(String(rating))}
                  />
                ))}
              </div>

              <p className="text-[12.5px] text-stone whitespace-nowrap">
                Showing{" "}
                <span className="font-medium text-ink">
                  {filteredReviews.length}
                </span>{" "}
                of {reviews.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center justify-between gap-4 text-[13.5px] text-clay bg-clay-tint border border-clay/15 rounded-lg px-4 py-3 mb-5">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => loadReviews(ratingFilter)}
            className="text-[12.5px] font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-surface border border-hairline rounded-xl overflow-hidden"
            >
              <RowSkeleton />
              <div className="px-5 pb-5">
                <div className="h-3 w-3/4 bg-hairline/40 rounded animate-pulse mb-2" />
                <div className="h-3 w-1/2 bg-hairline/30 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          ratingFilter={ratingFilter}
          onClear={() => setRatingFilter("")}
        />
      ) : filteredReviews.length === 0 ? (
        <SearchEmptyState search={search} onClear={() => setSearch("")} />
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isDeleting={deletingId === review.id}
              onDelete={() => handleDelete(review)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, isDeleting, onDelete }) {
  return (
    <div
      className={`bg-surface border border-hairline rounded-xl p-5 transition-all hover:border-moss/20 hover:shadow-[0_4px_16px_rgba(33,31,27,0.04)] ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Review Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
            <Stars rating={review.rating} />

            {review.title && (
              <span className="text-[14px] font-medium text-ink">
                {review.title}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-stone">
            <span className="inline-flex items-center gap-1">
              <User size={12} strokeWidth={1.75} />
              {review.user?.name || "Unknown customer"}
            </span>

            <span className="hidden sm:inline text-hairline">•</span>

            <span className="inline-flex items-center gap-1">
              <Package size={12} strokeWidth={1.75} />
              <span className="font-medium text-ink">
                {review.product?.name || "Unknown product"}
              </span>
            </span>

            {review.created_at && (
              <>
                <span className="hidden sm:inline text-hairline">•</span>

                <span>
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="w-9 h-9 rounded-lg text-stone hover:bg-clay-tint hover:text-clay flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
          title="Delete review"
        >
          {isDeleting ? (
            <span className="w-4 h-4 border-2 border-clay border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={15} strokeWidth={1.75} />
          )}
        </button>
      </div>

      {review.comment && (
        <div className="mt-4 pt-4 border-t border-hairline">
          <p className="text-[13.5px] text-ink/90 leading-relaxed whitespace-pre-line">
            {review.comment}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, valueClass = "text-ink" }) {
  return (
    <div className="bg-surface border border-hairline rounded-xl p-5">
      <div className="w-9 h-9 rounded-lg bg-moss-tint flex items-center justify-center mb-4">
        <Icon size={17} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className={`font-mono text-[24px] leading-none mb-1.5 ${valueClass}`}>
        {value}
      </p>

      <p className="text-[12.5px] text-stone">{label}</p>
    </div>
  );
}

function Stars({ rating }) {
  const numericRating = Number(rating || 0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((number) => (
        <Star
          key={number}
          size={14}
          strokeWidth={1.75}
          className={
            number <= numericRating
              ? "text-moss fill-moss"
              : "text-hairline fill-hairline/30"
          }
        />
      ))}

      <span className="ml-1 text-[11.5px] font-mono text-stone">
        {numericRating}/5
      </span>
    </div>
  );
}

function FilterPill({ label, rating, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all ${
        active
          ? "bg-ink text-white shadow-[0_2px_4px_rgba(33,31,27,0.1)]"
          : "text-stone hover:bg-paper hover:text-ink"
      }`}
    >
      {rating && (
        <Star
          size={12}
          className={active ? "fill-white" : ""}
          strokeWidth={1.75}
        />
      )}

      {label}
    </button>
  );
}

function EmptyState({ ratingFilter, onClear }) {
  return (
    <div className="bg-surface border border-dashed border-hairline rounded-xl py-20 px-6 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-moss-tint flex items-center justify-center mb-4">
        <MessageSquare size={22} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className="text-[15px] font-medium text-ink mb-1">No reviews found</p>

      <p className="max-w-sm text-[13px] leading-6 text-stone mb-5">
        {ratingFilter
          ? `There are currently no ${ratingFilter}-star reviews.`
          : "Customer reviews will appear here when products receive feedback."}
      </p>

      {ratingFilter && (
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2.5 rounded-lg bg-paper border border-hairline text-[13px] font-medium text-ink hover:bg-hairline/30 transition-colors"
        >
          Show all reviews
        </button>
      )}
    </div>
  );
}

function SearchEmptyState({ search, onClear }) {
  return (
    <div className="bg-surface border border-dashed border-hairline rounded-xl py-16 px-6 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center mb-4">
        <Search size={20} className="text-stone" strokeWidth={1.75} />
      </div>

      <p className="text-[14px] font-medium text-ink mb-1">
        No reviews match your search
      </p>

      <p className="text-[13px] text-stone mb-5">
        No results found for{" "}
        <span className="font-medium text-ink">"{search}"</span>
      </p>

      <button
        type="button"
        onClick={onClear}
        className="text-[13px] font-medium text-moss hover:text-moss-deep transition-colors"
      >
        Clear search
      </button>
    </div>
  );
}
