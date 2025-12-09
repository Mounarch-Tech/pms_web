// Pagination.jsx
import React from 'react';
import './Pagination_model.css'; // Optional: Create a separate CSS file for styling

const Pagination_model = ({ currentPage, totalPages, onPageChange, maxVisiblePages = 5 }) => {
    if (totalPages <= 1) return null; // Don't show pagination if there's only one or no page

    const getPageNumbers = () => {
        const pages = [];
        let startPage, endPage;

        if (totalPages <= maxVisiblePages) {
            // Show all pages
            startPage = 1;
            endPage = totalPages;
        } else {
            // Calculate start and end pages
            const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
            const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;

            if (currentPage <= maxPagesBeforeCurrent) {
                // Current page is near the beginning
                startPage = 1;
                endPage = maxVisiblePages;
            } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                // Current page is near the end
                startPage = totalPages - maxVisiblePages + 1;
                endPage = totalPages;
            } else {
                // Current page is somewhere in the middle
                startPage = currentPage - maxPagesBeforeCurrent;
                endPage = currentPage + maxPagesAfterCurrent;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
            >
                Previous
            </button>

            {/* Show First Page and Ellipsis if necessary */}
            {pageNumbers[0] > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
                    >
                        1
                    </button>
                    {pageNumbers[0] > 2 && <span className="pagination-ellipsis">...</span>}
                </>
            )}

            {/* Show Page Numbers */}
            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                    aria-label={`Go to page ${number}`}
                >
                    {number}
                </button>
            ))}

            {/* Show Last Page and Ellipsis if necessary */}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
            >
                Next
            </button>
        </div>
    );
};

export default Pagination_model;
// localhost