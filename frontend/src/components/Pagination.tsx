import React from 'react';

type Props = {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
};

export default function Pagination({ page, totalPages, onPage }: Props) {
  return (
    <div className="pager">
      <button className="btn small" onClick={() => onPage(page - 1)} disabled={page <= 1}>Prev</button>
      <div className="muted">Page {page} of {totalPages}</div>
      <button className="btn small" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>Next</button>
    </div>
  );
}
