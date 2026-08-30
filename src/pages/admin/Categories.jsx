import { useState } from "react";
import { Tag as TagIcon, Sparkles } from "lucide-react";
import CategoriesPanel from "./CategoriesPanel";
import SkinTypesPanel from "./SkinTypesPanel";

const TABS = [
  { key: "categories", label: "Categories", icon: TagIcon },
  { key: "skin-types", label: "Skin Types", icon: Sparkles },
];

export default function Categories() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-[28px] font-medium text-ink">
          {activeTab === "categories" ? "Categories" : "Skin Types"}
        </h1>

        <div className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-surface p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all ${
                activeTab === key
                  ? "bg-moss text-white shadow-[0_2px_8px_rgba(63,88,67,0.15)]"
                  : "text-stone hover:text-ink hover:bg-paper"
              }`}
            >
              <Icon size={15} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "categories" ? <CategoriesPanel /> : <SkinTypesPanel />}
    </div>
  );
}
