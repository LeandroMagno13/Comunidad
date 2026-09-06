"use client";

import React from 'react';

interface ColumnProps {
  title: string;
  children: React.ReactNode;
  icon?: string;
  color?: string;
  className?: string;
}

interface TwoColumnLayoutProps {
  left: ColumnProps;
  right: ColumnProps;
  className?: string;
}

export default function TwoColumnLayout({ left, right, className = '' }: TwoColumnLayoutProps) {
  return (
    <div className={`grid md:grid-cols-2 gap-8 ${className}`}>
      <Column {...left} />
      <Column {...right} />
    </div>
  );
}

function Column({ title, children, icon, color = 'blue', className = '' }: ColumnProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
  };

  return (
    <div className={`rounded-xl p-6 border ${colorClasses[color as keyof typeof colorClasses]} ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        {icon && <span className="text-2xl">{icon}</span>}
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}