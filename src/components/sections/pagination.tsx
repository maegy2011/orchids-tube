"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

import { useI18n } from "@/lib/i18n-context";

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { t, direction } = useI18n();
  // If we are using infinite scroll, this component might be redundant, 
  // but we keep it for backward compatibility or as a fallback.
  
  const pages = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  const PrevIcon = direction === 'rtl' ? ChevronsRight : ChevronsLeft;
  const NextIcon = direction === 'rtl' ? ChevronsLeft : ChevronsRight;
  const SinglePrevIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const SingleNextIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title={t('firstPage')}
        >
          <PrevIcon size={20} />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title={t('previous')}
        >
          <SinglePrevIcon size={20} />
        </button>
  
        <div className="flex items-center gap-1">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "w-10 h-10 rounded-lg text-sm font-bold transition-all",
                currentPage === page
                  ? "bg-foreground text-background shadow-md scale-105"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {page}
            </button>
          ))}
        </div>
  
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title={t('next')}
        >
          <SingleNextIcon size={20} />
        </button>
  
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title={t('lastPage')}
        >
          <NextIcon size={20} />
        </button>
    </div>
  );
}
