"use client";

import React from 'react';

interface ExampleStep {
  actor: string;
  action: string;
  cue?: number;
  type: 'need' | 'offer' | 'work' | 'transfer' | 'result';
}

interface ExampleCardProps {
  title: string;
  steps: ExampleStep[];
  conclusion?: string;
  className?: string;
}

const stepStyles = {
  need: 'bg-amber-50 border-amber-200 text-amber-900',
  offer: 'bg-blue-50 border-blue-200 text-blue-900',
  work: 'bg-green-50 border-green-200 text-green-900',
  transfer: 'bg-purple-50 border-purple-200 text-purple-900',
  result: 'bg-gray-50 border-gray-200 text-gray-900',
};

const stepIcons = {
  need: '📋',
  offer: '💰',
  work: '⚙️',
  transfer: '➡️',
  result: '✅',
};

export default function ExampleCard({ title, steps, conclusion, className = '' }: ExampleCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">📖</span>
        {title}
      </h3>
      
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`${stepStyles[step.type]} border rounded-lg p-4 flex items-center gap-3`}
          >
            <span className="text-2xl">{stepIcons[step.type]}</span>
            <div className="flex-1">
              <p className="font-medium">{step.actor}</p>
              <p className="text-sm opacity-80">{step.action}</p>
              {step.cue !== undefined && (
                <p className="text-xs mt-1 font-mono bg-white/50 px-2 py-0.5 rounded inline-block">
                  {step.cue > 0 ? '+' : ''}{step.cue} CU
                </p>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="text-gray-400 text-2xl">↓</div>
            )}
          </div>
        ))}
      </div>

      {conclusion && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm">
          <span className="font-medium">Conclusión: </span>{conclusion}
        </div>
      )}
    </div>
  );
}