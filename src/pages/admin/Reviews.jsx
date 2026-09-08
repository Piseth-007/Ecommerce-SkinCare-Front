import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import api from "../../api/axios";
import { RowSkeleton, StatSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";
import { useAdminNotifications } from "../../context/AdminNotificationsContext";

const RATINGS = [5, 4, 3, 2, 1];
const PER_PAGE = 10;

export default function Reviews() {
  const { markViewed } = useAdminNotifications();

  useEffect(() => {
    markViewed("reviews");
  }, [markViewed]);

  const { showToast } = useContext(ToastContext);

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    fiveStar: 0,
    lowRating: 0,
  });

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [ratingFilter, setRatingFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const loadReviews = useCallback(
    async ({ rating = "", refresh = false, initial = false, signal } = {}) => {
      try {
        setError("");

        if (initial) {
          setLoading(true);
        } else if (refresh) {
          setRefreshing(true);
        } else {
          setTableLoading(true);
        }

        const params = rating ? { rating } : {};

        const response = await api.get("/admin/reviews", {
          params,
          signal,
        });

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setReviews(data);

        const responseStats = response.data?.stats;

        if (responseStats) {
          setStats({
            total: Number(responseStats.total || 0),
            average: Number(responseStats.average || 0),
            fiveStar: Number(responseStats.fiveStar || 0),
            lowRating: Number(responseStats.lowRating || 0),
          });
        } else if (initial) {
          setStats(calculateStats(data));
        }

        setPage(1);
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          return;
        }

        const message =
          err.response?.data?.message || "Failed to load reviews.";

        setError(message);

        if (refresh || !initial) {
          showToast(message, "error");
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setTableLoading(false);
          setRefreshing(false);
        }
      }
    },
    [showToast],
  );

  useEffect(() => {
    const controller = new AbortController();

    loadReviews({
      rating: "",
      initial: true,
      signal: controller.signal,
    });

    return () => controller.abort();
  }, [loadReviews]);

  const handleRatingFilter = useCallback(
    async (rating) => {
      setRatingFilter(rating);
      setSearch("");
      setPage(1);

      await loadReviews({
        rating,
      });
    },
    [loadReviews],
  );

  const handleRefresh = useCallback(() => {
    loadReviews({
      rating: ratingFilter,
      refresh: true,
    });
  }, [loadReviews, ratingFilter]);

  const filteredReviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return reviews;
    }

    return reviews.filter((review) => {
      const userName = String(review.user?.name || "").toLowerCase();
      const userEmail = String(review.user?.email || "").toLowerCase();
      const productName = String(review.product?.name || "").toLowerCase();
      const title = String(review.title || "").toLowerCase();
      const comment = String(review.comment || "").toLowerCase();

      return (
        userName.includes(keyword) ||
        userEmail.includes(keyword) ||
        productName.includes(keyword) ||
        title.includes(keyword) ||
        comment.includes(keyword)
      );
    });
  }, [reviews, search]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PER_PAGE));

  const currentPage = Math.min(page, totalPages);

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;

    return filteredReviews.slice(start, start + PER_PAGE);
  }, [filteredReviews, currentPage]);

  const paginationStart =
    filteredReviews.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;

  const paginationEnd = Math.min(
    currentPage * PER_PAGE,
    filteredReviews.length,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async (review) => {
    const confirmed = window.confirm(
      "Delete this review? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(review.id);

      await api.delete(`/reviews/${review.id}`);

      setReviews((current) => current.filter((item) => item.id !== review.id));

      setStats((current) => {
        const rating = Number(review.rating || 0);
        const total = Math.max(0, current.total - 1);

        const previousAverage =
          Number(current.average || 0) * Number(current.total || 0);

        const average =
          total > 0 ? Math.max(0, (previousAverage - rating) / total) : 0;

        return {
          total,
          average,
          fiveStar: Math.max(0, current.fiveStar - (rating === 5 ? 1 : 0)),
          lowRating: Math.max(0, current.lowRating - (rating <= 2 ? 1 : 0)),
        };
      });

      showToast("Review deleted successfully.");

      setPage((currentPage) => {
        const remaining = Math.max(0, filteredReviews.length - 1);
        const nextTotalPages = Math.max(1, Math.ceil(remaining / PER_PAGE));

        return Math.min(currentPage, nextTotalPages);
      });
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete review.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-stone">
            Moderation
          </p>

          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-medium text-ink">
              Reviews
            </h1>

            {!loading && (
              <span className="rounded-md bg-moss-tint px-2 py-0.5 text-[11px] font-medium text-moss">
                {stats.total}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          title="Refresh reviews"
          aria-label="Refresh reviews"
        >
          <RefreshCw
            size={16}
            strokeWidth={1.75}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      {loading ? (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={MessageSquare}
            label="Total Reviews"
            value={stats.total}
          />

          <StatCard
            icon={Star}
            label="Average Rating"
            value={`${Number(stats.average || 0).toFixed(1)}/5`}
            valueClass="text-moss"
          />

          <StatCard icon={Star} label="5 Star Reviews" value={stats.fiveStar} />

          <StatCard
            icon={AlertTriangle}
            label="Low Ratings"
            value={stats.lowRating}
            valueClass={stats.lowRating > 0 ? "text-clay" : "text-ink"}
          />
        </div>
      )}

      {!loading && (
        <div className="mb-5 rounded-xl border border-hairline bg-surface p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:w-72 lg:shrink-0">
              <Search
                size={15}
                strokeWidth={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reviews..."
                className="w-full rounded-lg border border-hairline bg-paper py-2 pl-9 pr-9 text-[13px] text-ink placeholder:text-stone/50 transition-colors focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-stone transition-colors hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <FilterPill
                label="All"
                active={ratingFilter === ""}
                onClick={() => handleRatingFilter("")}
              />

              {RATINGS.map((rating) => (
                <FilterPill
                  key={rating}
                  label={`${rating} Star`}
                  rating={rating}
                  active={ratingFilter === String(rating)}
                  onClick={() => handleRatingFilter(String(rating))}
                />
              ))}
            </div>

            <p className="shrink-0 whitespace-nowrap text-[12px] text-stone lg:ml-auto">
              <span className="font-medium text-ink">
                {filteredReviews.length}
              </span>{" "}
              {filteredReviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-clay/15 bg-clay-tint px-4 py-3 text-[13.5px] text-clay">
          <span>{error}</span>

          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 text-[12.5px] font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-hairline bg-surface"
            >
              <RowSkeleton />

              <div className="px-5 pb-5">
                <div className="mb-2 h-3 w-3/4 animate-pulse rounded bg-hairline/40" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-hairline/30" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          ratingFilter={ratingFilter}
          onClear={() => handleRatingFilter("")}
        />
      ) : filteredReviews.length === 0 ? (
        <SearchEmptyState search={search} onClear={() => setSearch("")} />
      ) : (
        <>
          <div className="relative">
            {tableLoading && (
              <div className="absolute inset-0 z-10 rounded-xl bg-surface/60 backdrop-blur-[1px]">
                <div className="flex h-full min-h-40 items-center justify-center">
                  <RefreshCw
                    size={20}
                    strokeWidth={1.75}
                    className="animate-spin text-moss"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              {paginatedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isDeleting={deletingId === review.id}
                  onDelete={() => handleDelete(review)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[12px] text-stone">
              Showing{" "}
              <span className="font-medium text-ink">{paginationStart}</span> to{" "}
              <span className="font-medium text-ink">{paginationEnd}</span> of{" "}
              <span className="font-medium text-ink">
                {filteredReviews.length}
              </span>
            </p>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                onNext={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function calculateStats(reviews) {
  const total = reviews.length;

  if (total === 0) {
    return {
      total: 0,
      average: 0,
      fiveStar: 0,
      lowRating: 0,
    };
  }

  const ratings = reviews.map((review) => Number(review.rating || 0));

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / total;

  return {
    total,
    average,
    fiveStar: ratings.filter((rating) => rating === 5).length,
    lowRating: ratings.filter((rating) => rating <= 2).length,
  };
}

function ReviewCard({ review, isDeleting, onDelete }) {
  const rating = Number(review.rating || 0);

  return (
    <article
      className={`rounded-xl border border-hairline bg-surface p-4 transition-all sm:p-5 ${
        isDeleting
          ? "pointer-events-none opacity-50"
          : "hover:border-moss/20 hover:shadow-[0_4px_16px_rgba(33,31,27,0.04)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Stars rating={rating} />

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

            {review.user?.email && (
              <>
                <span className="hidden text-hairline sm:inline">•</span>
                <span className="truncate">{review.user.email}</span>
              </>
            )}

            <span className="hidden text-hairline sm:inline">•</span>

            <span className="inline-flex min-w-0 items-center gap-1">
              <Package size={12} strokeWidth={1.75} />

              <span className="truncate font-medium text-ink">
                {review.product?.name || "Unknown product"}
              </span>
            </span>

            {review.created_at && (
              <>
                <span className="hidden text-hairline sm:inline">•</span>

                <time dateTime={review.created_at}>
                  {formatDate(review.created_at)}
                </time>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone transition-colors hover:bg-clay-tint hover:text-clay disabled:opacity-50"
          title="Delete review"
          aria-label="Delete review"
        >
          {isDeleting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-clay border-t-transparent" />
          ) : (
            <Trash2 size={15} strokeWidth={1.75} />
          )}
        </button>
      </div>

      {review.comment && (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink/90">
            {review.comment}
          </p>
        </div>
      )}
    </article>
  );
}

function StatCard({ icon: Icon, label, value, valueClass = "text-ink" }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-moss-tint">
        <Icon size={17} className="text-moss" strokeWidth={1.75} />
      </div>

      <p
        className={`mb-1.5 font-mono text-[22px] leading-none sm:text-[24px] ${valueClass}`}
      >
        {value}
      </p>

      <p className="text-[12.5px] text-stone">{label}</p>
    </div>
  );
}

function Stars({ rating }) {
  const normalizedRating = Math.max(0, Math.min(5, rating));

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${normalizedRating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((number) => {
        const fillPercentage = Math.max(
          0,
          Math.min(1, normalizedRating - number + 1),
        );

        return (
          <span key={number} className="relative inline-flex h-3.5 w-3.5">
            <Star
              size={14}
              strokeWidth={1.75}
              className="absolute inset-0 fill-hairline/30 text-hairline"
            />

            {fillPercentage > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{
                  width: `${fillPercentage * 100}%`,
                }}
              >
                <Star
                  size={14}
                  strokeWidth={1.75}
                  className="fill-moss text-moss"
                />
              </span>
            )}
          </span>
        );
      })}

      <span className="ml-1 text-[11.5px] font-mono text-stone">
        {normalizedRating.toFixed(1)}/5
      </span>
    </div>
  );
}

function FilterPill({ label, rating, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-[12px] font-medium transition-all ${
        active
          ? "bg-moss text-white shadow-[0_2px_4px_rgba(33,31,27,0.1)]"
          : "text-stone hover:bg-paper hover:text-ink"
      }`}
      aria-pressed={active}
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

function Pagination({ currentPage, totalPages, onPrevious, onNext }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
      </button>

      <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-ink px-3 text-[12px] font-medium text-white">
        {currentPage}
      </div>

      <span className="text-[12px] text-stone">of {totalPages}</span>

      <button
        type="button"
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function EmptyState({ ratingFilter, onClear }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-moss-tint">
        <MessageSquare size={22} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className="mb-1 text-[15px] font-medium text-ink">No reviews found</p>

      <p className="mb-5 max-w-sm text-[13px] leading-6 text-stone">
        {ratingFilter
          ? `There are currently no ${ratingFilter}-star reviews.`
          : "Customer reviews will appear here when products receive feedback."}
      </p>

      {ratingFilter && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-hairline bg-paper px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-hairline/30"
        >
          Show all reviews
        </button>
      )}
    </div>
  );
}

function SearchEmptyState({ search, onClear }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper">
        <Search size={20} className="text-stone" strokeWidth={1.75} />
      </div>

      <p className="mb-1 text-[14px] font-medium text-ink">
        No reviews match your search
      </p>

      <p className="mb-5 text-[13px] text-stone">
        No results found for{" "}
        <span className="font-medium text-ink">"{search}"</span>
      </p>

      <button
        type="button"
        onClick={onClear}
        className="text-[13px] font-medium text-moss transition-colors hover:text-moss-deep"
      >
        Clear search
      </button>
    </div>
  );
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
