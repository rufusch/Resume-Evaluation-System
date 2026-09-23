import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const normStatus = (status || '').toUpperCase();

  if (normStatus === 'FULL MATCH') {
    return (
      <span className="status-pill status-full">
        <CheckCircle2 size={12} strokeWidth={2.5} />
        Full Match
      </span>
    );
  }

  if (normStatus === 'PARTIAL MATCH') {
    return (
      <span className="status-pill status-partial">
        <AlertCircle size={12} strokeWidth={2.5} />
        Partial Match
      </span>
    );
  }

  if (normStatus === 'NOT EVIDENCED' || normStatus === 'MISSING') {
    return (
      <span className="status-pill status-missing">
        <XCircle size={12} strokeWidth={2.5} />
        Not Evidenced
      </span>
    );
  }

  return (
    <span className="status-pill status-uncertain">
      <HelpCircle size={12} strokeWidth={2.5} />
      Uncertain
    </span>
  );
}
