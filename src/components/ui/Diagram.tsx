"use client";

import React from 'react';

interface DiagramStep {
  label: string;
  type?: 'normal' | 'highlight' | 'arrow' | 'branch';
  subLabel?: string;
}

interface DiagramProps {
  steps: DiagramStep[];
  direction?: 'vertical' | 'horizontal';
  className?: string;
  showNumbers?: boolean;
}

export default function Diagram({ steps, direction = 'vertical', className = '', showNumbers = false }: DiagramProps) {
  return (
    <div className={`flex ${direction === 'vertical' ? 'flex-col' : 'flex-row'} items-center gap-3 ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {index > 0 && direction === 'vertical' && (
            <div className="w-1 h-4 bg-gray-400 flex-shrink-0" />
          )}
          {index > 0 && direction === 'horizontal' && (
            <div className="h-1 w-4 bg-gray-400 flex-shrink-0 self-center" />
          )}
          <div className={`flex flex-col items-center text-center p-3 rounded-lg transition-all ${
            step.type === 'highlight' 
              ? 'bg-blue-100 border-2 border-blue-500 text-blue-900 font-semibold shadow-md' 
              : step.type === 'arrow'
                ? 'text-gray-400'
                : 'bg-white border border-gray-200 text-gray-800 hover:border-blue-300 hover:shadow-sm'
          }`}>
            {showNumbers && (
              <span className="text-xs text-gray-500 mb-1">{index + 1}</span>
            )}
            <span className="font-medium whitespace-nowrap">{step.label}</span>
            {step.subLabel && (
              <span className="text-xs text-gray-500 mt-1 max-w-xs">{step.subLabel}</span>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}