import React from 'react';

interface BrutalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'border-4 border-dark font-bold px-6 py-3 transition-all';
  const shadowStyles = 'shadow-[6px_6px_0px_0px_rgba(18,18,18,1)] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[4px] hover:translate-y-[4px]';

  const variantStyles = {
    primary: 'bg-cool-blue text-dark',
    secondary: 'bg-bg-light text-dark',
    danger: 'bg-alert-orange text-dark',
  };

  return (
    <button
      className={`${baseStyles} ${shadowStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
