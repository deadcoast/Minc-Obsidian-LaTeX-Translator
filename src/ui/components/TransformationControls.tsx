// src/components/TransformationControls.tsx
import React from 'react';
import { ParserOptions } from '@core/parser';

interface TransformationControlsProps {
  options: ParserOptions;
  onOptionsChange: (options: ParserOptions) => void;
}

export const TransformationControls: React.FC<TransformationControlsProps> = ({
  options,
  onOptionsChange
}) => {
  return (
    <div className="transformation-controls">
      <h3>Transformation Options</h3>
      <div className="controls-grid">
        {Object.entries(options).map(([key, value]) => (
          <div key={key} className="control-item">
            <label>
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => 
                  onOptionsChange({
                    ...options,
                    [key]: e.target.checked
                  })
                }
              />
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};