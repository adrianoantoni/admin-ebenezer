import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    variant?: 'default' | 'compact';
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    variant = 'default'
}) => {
    if (totalPages <= 1) return null;

    const isCompact = variant === 'compact';

    return (
        <div className={`${isCompact ? 'pt-4 mt-4' : 'pt-6 mt-6'} border-t border-gray-100 flex items-center justify-between`}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default PaginationControls;
