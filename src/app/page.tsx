"use client";

import { useState, useRef, useEffect } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import FeedFilterBar from "@/components/sections/feed-filter-bar";
import VideoGrid from "@/components/sections/video-grid";
import Pagination from "@/components/sections/pagination";
import { useI18n } from "@/lib/i18n-context";
import { getDaysUntilRamadan } from "@/lib/date-utils";

    export default function Home() {
      const [searchQuery, setSearchQuery] = useState("");
      const [sidebarOpen, setSidebarOpen] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const [totalPages, setTotalPages] = useState(50);
      const [isGridLoading, setIsGridLoading] = useState(false);
      const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);
      const { showRamadanCountdown } = useI18n();
      const gridRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        setDaysUntilRamadan(getDaysUntilRamadan());
      }, []);

      const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
      const mainPaddingTop = isRamadanCountdownVisible ? 'pt-[104px] sm:pt-[100px]' : 'pt-[64px]';



  // Persistence to "save scroll position" and state
  useEffect(() => {
    const savedQuery = localStorage.getItem("searchQuery");
    const savedPage = localStorage.getItem("currentPage");
    const savedScroll = localStorage.getItem("scrollPosition");

    if (savedQuery) setSearchQuery(savedQuery);
    if (savedPage) setCurrentPage(parseInt(savedPage));
    
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll));
      }, 500);
    }

    const handleScroll = () => {
      localStorage.setItem("scrollPosition", window.scrollY.toString());
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem("searchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage.toString());
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Move to top of video grid when navigating to other page
    if (gridRef.current) {
      const headerOffset = 80;
      const elementPosition = gridRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSearchQuery(category);
    setCurrentPage(1);
  };

    return (
      <div className="min-h-screen bg-background">
        <Masthead 
          onSearch={handleSearch} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          externalLoading={isGridLoading}
        />
          <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className={`mr-0 lg:mr-[240px] ${mainPaddingTop} transition-all duration-300`}>

          <FeedFilterBar onCategoryChange={handleCategoryChange} />
          
          <div ref={gridRef} />
  
          <VideoGrid 
            searchQuery={searchQuery} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage}
            onTotalPagesChange={setTotalPages}
            onLoadingChange={setIsGridLoading}
          />

          <div className="py-8 flex justify-center border-t border-border mt-8">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages || 10} 
              onPageChange={handlePageChange} 
            />
          </div>
      </main>
    </div>
  );
}
