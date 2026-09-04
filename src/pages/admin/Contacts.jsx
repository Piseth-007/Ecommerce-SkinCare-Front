
import { useContext, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  RefreshCw,
  Mail,
  MessageCircle,
  User,
  Search,
  X,
  Trash2,
  Clock,
  Inbox,
} from "lucide-react";
import api from "../../api/axios";
import { RowSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { showToast } = useContext(ToastContext);

  /* =========================================================
     LOAD CONTACTS
  ========================================================= */

  const loadContacts = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get("/admin/contacts");

      setContacts(res.data?.data || res.data || []);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to load contact messages.";

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
    loadContacts();
  }, []);

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (contactId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(contactId);

      await api.delete(`/admin/contacts/${contactId}`);

      setContacts((prev) =>
        prev.filter((contact) => contact.id !== contactId),
      );

      if (expanded === contactId) {
        setExpanded(null);
      }

      showToast("Contact message deleted successfully.");
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to delete contact message.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredContacts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return contacts;

    return contacts.filter((contact) => {
      const id = String(contact.id || "");

      const name =
        contact.name?.toLowerCase() ||
        contact.user?.name?.toLowerCase() ||
        "";

      const email =
        contact.email?.toLowerCase() ||
        contact.user?.email?.toLowerCase() ||
        "";

      const message =
        contact.message?.toLowerCase() || "";

      return (
        id.includes(keyword) ||
        name.includes(keyword) ||
        email.includes(keyword) ||
        message.includes(keyword)
      );
    });
  }, [contacts, search]);

  const toggleContact = (id) => {
    setExpanded((current) =>
      current === id ? null : id,
    );
  };

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-medium text-ink">
              Contacts
            </h1>

            {!loading && (
              <span className="rounded-md bg-moss-tint px-2 py-0.5 text-[11px] font-medium text-moss">
                {contacts.length}
              </span>
            )}
          </div>

          <p className="mt-1 text-[13px] text-stone">
            Messages from your customers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadContacts(true)}
          disabled={loading || refreshing}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition-colors hover:bg-paper hover:text-ink disabled:opacity-50"
          title="Refresh contacts"
        >
          <RefreshCw
            size={16}
            strokeWidth={1.75}
            className={
              refreshing ? "animate-spin" : ""
            }
          />
        </button>
      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search
            size={16}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search customer or message..."
            className="w-full rounded-lg border border-hairline bg-surface py-2 pl-9 pr-9 text-[13px] text-ink placeholder:text-stone/50 transition-colors focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
          />

          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone hover:text-ink"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && !loading && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-clay/15 bg-clay-tint px-4 py-3 text-[13.5px] text-clay">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => loadContacts()}
            className="text-[12.5px] font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
          <div className="hidden border-b border-hairline px-5 py-3 md:grid md:grid-cols-[0.8fr_1.5fr_1.8fr_1fr]">
            {[
              "ID",
              "Customer",
              "Message",
              "Date",
            ].map((item) => (
              <p
                key={item}
                className="text-[10.5px] font-medium uppercase tracking-widest text-stone"
              >
                {item}
              </p>
            ))}
          </div>

          {Array.from({ length: 6 }).map(
            (_, index) => (
              <RowSkeleton key={index} />
            ),
          )}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState />
      ) : filteredContacts.length === 0 ? (
        <SearchEmptyState
          search={search}
          onClear={clearSearch}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-hairline bg-paper/30">
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                </tr>
              </thead>

              <tbody>
                {filteredContacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    expanded={
                      expanded === contact.id
                    }
                    deleting={
                      deletingId === contact.id
                    }
                    onToggle={() =>
                      toggleContact(contact.id)
                    }
                    onDelete={() =>
                      handleDelete(contact.id)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   CONTACT ROW
========================================================= */

function ContactRow({
  contact,
  expanded,
  deleting,
  onToggle,
  onDelete,
}) {
  const name =
    contact.name ||
    contact.user?.name ||
    "Unknown customer";

  const email =
    contact.email ||
    contact.user?.email ||
    "";

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-hairline transition-colors ${
          expanded
            ? "bg-paper/50"
            : "hover:bg-paper/60"
        }`}
      >
        {/* ID */}

        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-transform ${
                expanded
                  ? "rotate-180 bg-moss-tint"
                  : "bg-paper"
              }`}
            >
              <ChevronDown
                size={14}
                className={
                  expanded
                    ? "text-moss"
                    : "text-stone"
                }
              />
            </div>

            <span className="font-mono text-[13px] font-medium text-ink">
              #{contact.id}
            </span>
          </div>
        </td>

        {/* Customer */}

        <td className="px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-tint">
              <User
                size={14}
                className="text-moss"
                strokeWidth={1.75}
              />
            </div>

            <div className="min-w-0">
              <p className="max-w-45 truncate text-[13.5px] font-medium text-ink">
                {name}
              </p>

              {email && (
                <p className="max-w-45 truncate text-[11.5px] text-stone">
                  {email}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Message */}

        <td className="max-w-[350px] px-5 py-4">
          <p
            className={`text-[13px] text-ink ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {contact.message || "No message"}
          </p>
        </td>

        {/* Date */}

        <td className="px-5 py-4">
          <p className="text-[13px] text-ink">
            {contact.created_at
              ? new Date(
                  contact.created_at,
                ).toLocaleDateString()
              : "-"}
          </p>

          {contact.created_at && (
            <p className="mt-0.5 text-[11.5px] text-stone">
              {new Date(
                contact.created_at,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </td>
      </tr>

      {/* =====================================================
          EXPANDED DETAILS
      ===================================================== */}

      {expanded && (
        <tr className="border-b border-hairline bg-paper/30">
          <td
            colSpan={4}
            className="px-5 py-5"
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto]">

              {/* Message */}

              <div className="rounded-xl border border-hairline bg-surface p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Mail
                    size={16}
                    className="text-moss"
                    strokeWidth={1.75}
                  />

                  <p className="text-[10.5px] font-medium uppercase tracking-widest text-stone">
                    Customer Message
                  </p>
                </div>

                <div className="mb-5">
                  <p className="mb-1 text-[13px] font-medium text-ink">
                    {name}
                  </p>

                  {email && (
                    <p className="text-[12px] text-stone">
                      {email}
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-paper p-4">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-ink">
                    {contact.message ||
                      "No message available."}
                  </p>
                </div>

                {contact.created_at && (
                  <div className="mt-4 flex items-center gap-2 text-[11.5px] text-stone">
                    <Clock size={13} />

                    <span>
                      {new Date(
                        contact.created_at,
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}

              <div className="flex flex-col gap-3 lg:min-w-[190px]">

                {/* Email */}

                {email && (
                  <a
                    href={`mailto:${email}`}
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                    className="flex items-center justify-center gap-2 rounded-lg border border-hairline bg-surface px-4 py-2.5 text-[12.5px] font-medium text-ink transition-colors hover:bg-paper"
                  >
                    <Mail
                      size={14}
                      strokeWidth={1.75}
                    />

                    Email customer
                  </a>
                )}

                {/* Telegram */}

                <a
                  href="https://t.me/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                  className="flex items-center justify-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-[12.5px] font-medium text-white transition-colors hover:bg-moss-deep"
                >
                  <MessageCircle
                    size={14}
                    strokeWidth={1.75}
                  />

                  Contact via Telegram
                </a>

                {/* Delete */}

                <button
                  type="button"
                  disabled={deleting}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-clay/20 bg-clay-tint px-4 py-2.5 text-[12.5px] font-medium text-clay transition-colors hover:bg-clay/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? (
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2
                      size={14}
                      strokeWidth={1.75}
                    />
                  )}

                  Delete message
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* =========================================================
   TABLE HEAD
========================================================= */

function TableHead({ children }) {
  return (
    <th className="px-5 py-3 text-[10.5px] font-medium uppercase tracking-widest text-stone">
      {children}
    </th>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-moss-tint">
        <Inbox
          size={22}
          className="text-moss"
          strokeWidth={1.75}
        />
      </div>

      <p className="mb-1 text-[15px] font-medium text-ink">
        No contact messages
      </p>

      <p className="max-w-sm text-[13px] leading-6 text-stone">
        Messages from your customers will appear
        here.
      </p>
    </div>
  );
}

/* =========================================================
   SEARCH EMPTY STATE
========================================================= */

function SearchEmptyState({
  search,
  onClear,
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper">
        <Search
          size={20}
          className="text-stone"
          strokeWidth={1.75}
        />
      </div>

      <p className="mb-1 text-[14px] font-medium text-ink">
        No messages found
      </p>

      <p className="mb-5 text-[13px] text-stone">
        No results found for{" "}
        <span className="font-medium text-ink">
          "{search}"
        </span>
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
