import { Plus } from "lucide-react";

export function QuickAddForm({ quickAddItemAction }: { quickAddItemAction: (formData: FormData) => Promise<void> }) {
  return (
    <form
      action={quickAddItemAction}
      className="mb-4 flex items-center gap-3 rounded-[12px] border border-[#232323] bg-[#141414] px-4 py-3"
    >
      <Plus className="h-4 w-4 flex-shrink-0 text-[#ff8a70]" />
      <input
        type="text"
        name="quickAddText"
        placeholder='Add a task — try "Fix platform signage tomorrow #retrofit @sam /Client Deliverables"'
        required
        className="flex-1 bg-transparent text-[13.5px] text-[#e5e5e0] outline-none placeholder:text-[#5a5a56]"
      />
      <span className="whitespace-nowrap rounded-[5px] bg-[#202020] px-[7px] py-[2px] font-[family-name:var(--font-mono-label)] text-[10px] font-semibold uppercase tracking-[0.05em] text-[#8f8f8a]">
        Quick-Add
      </span>
    </form>
  );
}
