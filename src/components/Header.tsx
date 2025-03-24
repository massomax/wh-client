import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  children?: React.ReactNode;
}

export default function Header({ title, showBackButton = true, children }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="header">
      {showBackButton && (
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Назад
        </button>
      )}
      {title && <div className="header-title">{title}</div>}
      {children && <div className="button-group">{children}</div>}
    </div>
  );
}
