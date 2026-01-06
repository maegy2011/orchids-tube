"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { t, direction } = useI18n();
  
  const pages = [];
  const maxVisiblePages = 3;
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  const PrevIcon = direction === 'rtl' ? ChevronsRight : ChevronsLeft;
  const NextIcon = direction === 'rtl' ? ChevronsLeft : ChevronsRight;
  const SinglePrevIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const SingleNextIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={scrollToTop}
          className="p-2 rounded-xl hover:bg-muted text-foreground/60 hover:text-foreground transition-all flex items-center gap-1 sm:px-3"
          title={t('back_to_top') || "الرجوع للأعلى"}
        >
          <ArrowUp size={18} />
          <span className="hidden sm:inline text-xs font-bold">{t('top') || "أعلى"}</span>
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
          title={t('firstPage')}
        >
          <PrevIcon size={18} />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
          title={t('previous')}
        >
          <SinglePrevIcon size={18} />
        </button>
  
        <div className="flex items-center gap-1">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-bold transition-all",
                currentPage === page
                  ? "bg-foreground text-background shadow-lg scale-110"
                  : "text-foreground/70 hover:bg-muted"
              )}
            >
              {page}
            </button>
          ))}
        </div>
  
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
          title={t('next')}
        >
          <SingleNextIcon size={18} />
        </button>
  
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
          title={t('lastPage')}
        >
          <NextIcon size={18} />
        </button>
    </div>
  );
}
