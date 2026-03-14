import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalRecords,
    onPageChange
}) => {
    if (totalPages <= 0) return null;

    const handlePageChange = (page: number) => {
        onPageChange(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Exibição Controlada</p>
                <p className="text-xs font-bold text-blue-900">
                    Página <span className="text-blue-600">{currentPage}</span> de <span className="text-blue-600">{totalPages}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    Registos: <span className="text-blue-600">{totalRecords}</span>
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200 transition-all shadow-sm active:scale-95"
                >
                    <ChevronLeft size={16} />
                    Anterior
                </button>
                <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = totalPages > 5
                            ? (currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i))
                            : i + 1;
                        return (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200 transition-all shadow-sm active:scale-95"
                >
                    Próximo
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
