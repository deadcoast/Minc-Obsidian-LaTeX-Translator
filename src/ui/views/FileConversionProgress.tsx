import React from 'react';

interface FileConversionProgressProps {
  current: number;
  total: number;
}

export const FileConversionProgress: React.FC<FileConversionProgressProps> = ({
  current,
  total,
}: FileConversionProgressProps) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className='file-conversion-progress'>
      <div className='progress-text'>
        Converting files: {current} / {total} ({percentage}%)
      </div>
      <div className='progress-bar-container'>
        <div className='progress-bar' style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
