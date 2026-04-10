"use client";

interface TopBarProps {
  children?: React.ReactNode;
}

export function TopBar({ children }: TopBarProps) {
  // Breadcrumb bar removed — all pages render their own header inline
  void children;
  return null;
}
