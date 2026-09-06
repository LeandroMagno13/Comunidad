"use client";

import React from 'react';

interface ComparisonRow {
  concept: string;
  current: string;
  proposed: string;
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  title?: string;
  className?: string;
}

export default function ComparisonTable({ rows, title, className = '' }: ComparisonTableProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      {title && (
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-semibold text-gray-900">
          {title}
        </div>
      )}
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 font-semibold text-gray-700">Concepto</th>
            <th className="px-4 py-3 font-semibold text-gray-700 text-center">Economía Actual</th>
            <th className="px-4 py-3 font-semibold text-gray-700 text-center">Nuestra Hipótesis</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 font-medium text-gray-900">{row.concept}</td>
              <td className="px-4 py-3 text-gray-600 text-center">{row.current}</td>
              <td className="px-4 py-3 text-blue-700 font-medium text-center">{row.proposed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}