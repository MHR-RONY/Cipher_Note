import type { PaginationData } from "@/lib/api";

export function Pagination({ pagination, onPage }: { pagination: PaginationData; onPage: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;
  return <nav className="pagination" aria-label="Pagination">
    <button type="button" className="button button-secondary" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>Previous</button>
    <span className="mono">Page {pagination.page} of {pagination.totalPages}</span>
    <button type="button" className="button button-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)}>Next</button>
  </nav>;
}
