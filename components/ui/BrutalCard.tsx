import React from 'react';

interface BrutalCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const BrutalCard: React.FC<BrutalCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  const baseStyles = 'border-4 border-dark bg-white p-6';
  const shadowStyles = hoverable
    ? 'shadow-[6px_6px_0px_0px_rgba(18,18,18,1)] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer'
    : 'shadow-[6px_6px_0px_0px_rgba(18,18,18,1)]';

  return (
    <div
      className={`${baseStyles} ${shadowStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
