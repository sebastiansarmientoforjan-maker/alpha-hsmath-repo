import React from 'react';

interface BrutalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const BrutalInput: React.FC<BrutalInputProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-shadow ${className}`}
        {...props}
      />
    </div>
  );
};
