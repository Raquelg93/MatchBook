// Fix for the library modal appearing incorrectly
// Replace the showLibrary method in the libraryManager object with this:

showLibrary: function() {
    // Create or get library modal overlay
    let libraryModal = document.getElementById('library-modal-overlay');
    
    if (!libraryModal) {
        libraryModal = document.createElement('div');
        libraryModal.id = 'library-modal-overlay';
        libraryModal.className = 'modal-overlay';
        
        // Close when clicking outside
        libraryModal.addEventListener('click', (e) => {
            if (e.target === libraryModal) {
                this.closeLibrary();
            }
        });
        
        document.body.appendChild(libraryModal);
    }
    
    // Create library modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'book-modal library-modal';
    
    // Create header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h2 class="modal-title">Your Mystical Library</h2>
        <p class="modal-author">Books saved from the Oracle's revelations</p>
    `;
    
    // Create book container
    const booksContainer = document.createElement('div');
    booksContainer.className = 'library-books';
    
    if (this.books.length === 0) {
        // Empty library message
        booksContainer.innerHTML = `
            <div class="empty-library">
                <p>Your mystical library awaits its first tome...</p>
                <p>Click "Save to Library" on any book revelation to begin your collection.</p>
            </div>
        `;
    } else {
        // Sort books by saved date (newest first)
        const sortedBooks = [...this.books].sort((a, b) => 
            new Date(b.savedAt) - new Date(a.savedAt)
        );
        
        // Add each book
        sortedBooks.forEach((book, index) => {
            const bookItem = document.createElement('div');
            bookItem.className = 'library-book-item';
            
            // Format saved date
            const savedDate = new Date(book.savedAt);
            const formattedDate = savedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Use book image or placeholder
            const imageUrl = book.imageUrl || `/api/placeholder/300/450`;
            
            bookItem.innerHTML = `
                <div class="library-item-number">${index + 1}</div>
                <img src="${imageUrl}" alt="${book.title}" class="library-item-image">
                <div class="library-item-info">
                    <h3 class="library-item-title">${book.title}</h3>
                    <p class="library-item-author">by ${book.author}</p>
                    <p class="library-item-date">Saved on ${formattedDate}</p>
                    <button class="library-remove-btn" data-index="${index}">Remove from Library</button>
                </div>
            `;
            
            // Add click handler to view book details
            bookItem.addEventListener('click', (e) => {
                // Don't trigger if clicking the remove button
                if (!e.target.classList.contains('library-remove-btn')) {
                    this.closeLibrary();
                    openBookModal(book, index, '✦', imageUrl);
                }
            });
            
            booksContainer.appendChild(bookItem);
        });
        
        // Add event delegation for remove buttons
        booksContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('library-remove-btn')) {
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                if (!isNaN(index) && index >= 0 && index < sortedBooks.length) {
                    this.removeBook(sortedBooks[index]);
                    this.showLibrary(); // Refresh the library display
                }
            }
        });
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.textContent = 'Close Library';
    closeButton.addEventListener('click', () => this.closeLibrary());
    
    // Add clear library button if there are books
    if (this.books.length > 0) {
        const clearLibraryBtn = document.createElement('button');
        clearLibraryBtn.className = 'clear-library-btn';
        clearLibraryBtn.textContent = 'Clear Entire Library';
        
        clearLibraryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your entire mystical library? This cannot be undone.')) {
                this.clearLibrary();
                this.showLibrary(); // Refresh the display
            }
        });
        
        // Assemble modal with clear button
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(booksContainer);
        modalContent.appendChild(clearLibraryBtn);
        modalContent.appendChild(closeButton);
    } else {
        // Assemble modal without clear button
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(booksContainer);
        modalContent.appendChild(closeButton);
    }
    
    // Add to overlay
    libraryModal.innerHTML = '';
    libraryModal.appendChild(modalContent);
    
    // Show modal
    libraryModal.classList.add('active');
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
},

closeLibrary: function() {
    const modal = document.getElementById('library-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}
