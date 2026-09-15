export function QuickAddForm({ quickAddItemAction }: { quickAddItemAction: (formData: FormData) => Promise<void> }) {
  return (
    <form action={quickAddItemAction} className="mt-6 flex items-center gap-2 rounded-lg border border-neutral-800 bg-[#0d0d0d] px-3 py-2">
      <span className="font-mono text-xs text-neutral-600">+</span>
      <input
        type="text"
        name="quickAddText"
        placeholder="Quick-Add a task — try @assignee, #label, ~list, or a date like tomorrow"
        required
        className="flex-1 bg-transparent text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-[#ff6b4a] hover:text-[#ff8a70]"
      >
        Add
      </button>
    </form>
  );
}
