import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => (
  <div className={`mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-10 pt-4 md:px-8 ${className}`}>
    {children}
  </div>
);

export default PageContainer;
