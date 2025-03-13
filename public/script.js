document.addEventListener('DOMContentLoaded', function() {
    // Initialize library features after DOM is loaded
    initializeLibrary();
    
    // Handle form submission
    const form = document.getElementById('recommendation-form');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            // Prevent the default form submission
            e.preventDefault();
            
            // Get form values
            const favoriteBooks = document.getElementById('favorite-books').value;
            const favoriteAuthors = document.getElementById('favorite-authors').value;
            const genres = document.getElementById('genres').value;
            const mood = document.getElementById('mood').value;
            const length = document.getElementById('length').value;
            const additionalInfo = document.getElementById('additional-info').value;
            
            // Show loading spinner
            document.getElementById('loading').style.display = 'block';
            document.getElementById('result-section').style.display = 'none';
            document.getElementById('result-section').classList.remove('visible');
            
            try {
                // Call our serverless function
                const response = await fetch('/api/get-recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        favoriteBooks,
                        favoriteAuthors,
                        genres,
                        mood,
                        length,
                        additionalInfo
                    })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.message || 'Error getting recommendations');
                }
                
                // Display recommendations
                displayRecommendations(data.recommendations);
                
            } catch (error) {
                console.error('Error:', error);
                alert('Error getting recommendations: ' + error.message);
            } finally {
                // Hide loading spinner
                document.getElementById('loading').style.display = 'none';
            }
        });
    } else {
        console.error('Form element not found!');
    }
    
    function displayRecommendations(recommendations) {
        const bookListElement = document.getElementById('book-list');
        bookListElement.innerHTML = '';
        
        // Tarot symbols to rotate through
        const tarotSymbols = ['☽', '☼', '★', '♆', '⚶', '☿', '♀', '♃', '♄', '⚸'];
        
        // Create modal overlay if it doesn't exist
        if (!document.getElementById('modal-overlay')) {
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'modal-overlay';
            modalOverlay.className = 'modal-overlay';
            modalOverlay.innerHTML = '<div class="book-modal"></div>';
            
            // Close modal when clicking outside the modal content
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) {
                    closeModal();
                }
            });
            
            // Close modal on escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeModal();
                }
            });
            
            document.body.appendChild(modalOverlay);
        }
        
        recommendations.forEach((book, index) => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            
            // Use the provided image URL or a placeholder
            const imageUrl = book.imageUrl || `/api/placeholder/300/450`;
            
            // Add tarot card elements and structure
            bookCard.innerHTML = `
                <div class="tarot-number">${romanize(index + 1)}</div>
                <img src="${imageUrl}" alt="${book.title} cover">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <p class="read-more">Click to reveal the oracle's wisdom</p>
                    <div class="tarot-symbol">${tarotSymbols[index % tarotSymbols.length]}</div>
                </div>
            `;
            
            // Add click event to open modal with book details
            bookCard.addEventListener('click', function() {
                openBookModal(book, index, tarotSymbols[index % tarotSymbols.length], imageUrl);
            });
            
            bookListElement.appendChild(bookCard);
        });
        
        document.getElementById('result-section').style.display = 'block';
        
        // Add smooth scroll to results
        document.getElementById('result-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // Trigger the visibility animation
        setTimeout(() => {
            document.getElementById('result-section').classList.add('visible');
        }, 100);
        
        // After adding all cards, add saved badges
        setTimeout(addSavedBadgesToCards, 100);
    }
    
    // Library functionality
    function initializeLibrary() {
        // Library panel toggle
        const libraryTab = document.getElementById('library-tab');
        const libraryPanel = document.getElementById('library-panel');
        const libraryClose = document.getElementById('library-close');
        const bodyOverlay = document.getElementById('body-overlay');
        
        if (libraryTab && libraryPanel && libraryClose && bodyOverlay) {
            // Open library panel
            libraryTab.addEventListener('click', function() {
                libraryPanel.classList.add('open');
                bodyOverlay.classList.add('visible');
                displaySavedBooks();
            });
            
            // Close library panel
            libraryClose.addEventListener('click', function() {
                libraryPanel.classList.remove('open');
                bodyOverlay.classList.remove('visible');
            });
            
            // Close library when clicking on overlay
            bodyOverlay.addEventListener('click', function() {
                libraryPanel.classList.remove('open');
                bodyOverlay.classList.remove('visible');
            });
        }
        
        // Display saved books on initial load
        displaySavedBooks();
    }
    
    // Function to open the book modal
    function openBookModal(book, index, symbol, imageUrl) {
        const modalOverlay = document.getElementById('modal-overlay');
        const bookModal = modalOverlay.querySelector('.book-modal');
        
        // Check if book is already saved
        const savedBooks = getSavedBooks();
        const isBookSaved = savedBooks.some(savedBook => 
            savedBook.title === book.title && savedBook.author === book.author
        );
        
        // Set modal content with save button
        bookModal.innerHTML = `
            <div class="modal-number">${romanize(index + 1)}</div>
            <div class="modal-symbol">${symbol}</div>
            <div class="modal-header">
                <h2 class="modal-title">${book.title}</h2>
                <p class="modal-author">by ${book.author}</p>
            </div>
            <img src="${imageUrl}" alt="${book.title}" class="modal-image">
            <p class="modal-description">${book.description}</p>
            <div class="modal-actions">
                <button class="save-to-library-button ${isBookSaved ? 'saved' : ''}" data-index="${index}">
                    ${isBookSaved ? 'Saved to Library ✓' : 'Save to Library'}
                </button>
                <button class="modal-close">Close Revelation</button>
            </div>
        `;
        
        // Add event listener to close button
        bookModal.querySelector('.modal-close').addEventListener('click', closeModal);
        
        // Add event listener to save button
        const saveButton = bookModal.querySelector('.save-to-library-button');
        saveButton.addEventListener('click', function() {
            const bookToSave = {
                title: book.title,
                author: book.author,
                description: book.description,
                imageUrl: imageUrl,
                symbol: symbol,
                index: index
            };
            
            saveBookToLibrary(bookToSave, saveButton);
        });
        
        // Show the modal
        modalOverlay.classList.add('active');
        
        // Prevent body scrolling while modal is open
        document.body.style.overflow = 'hidden';
    }
    
    // Function to close the modal
    function closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.remove('active');
        
        // Re-enable body scrolling
        document.body.style.overflow = '';
    }
    
    // Save book to library (localStorage)
    function saveBookToLibrary(book, buttonElement) {
        // Get current saved books from localStorage
        const savedBooks = getSavedBooks();
        
        // Check if book is already saved
        const bookIndex = savedBooks.findIndex(savedBook => 
            savedBook.title === book.title && savedBook.author === book.author
        );
        
        // If book is not saved, add it to the array
        if (bookIndex === -1) {
            savedBooks.push(book);
            
            // Update localStorage
            localStorage.setItem('savedBooks', JSON.stringify(savedBooks));
            
            // Update button text and style
            buttonElement.textContent = 'Saved to Library ✓';
            buttonElement.classList.add('saved');
            
            // Show saved badge on the card
            const cards = document.querySelectorAll('.book-card');
            if (cards[book.index]) {
                // Create badge if it doesn't exist
                let badge = cards[book.index].querySelector('.saved-badge');
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'saved-badge';
                    badge.textContent = 'Saved';
                    cards[book.index].appendChild(badge);
                }
                
                // Make badge visible with animation
                setTimeout(() => {
                    badge.classList.add('visible');
                }, 10);
            }
            
            // Show notification
            showNotification('Book added to your library!');
        }
    }
    
    // Get saved books from localStorage
    function getSavedBooks() {
        const savedBooksJson = localStorage.getItem('savedBooks');
        return savedBooksJson ? JSON.parse(savedBooksJson) : [];
    }
    
    // Display saved books in the library panel
    function displaySavedBooks() {
        const savedBooksContainer = document.getElementById('saved-books');
        const emptyLibrary = document.getElementById('empty-library');
        
        if (!savedBooksContainer) return;
        
        // Get saved books from localStorage
        const savedBooks = getSavedBooks();
        
        // Clear container except for the empty message
        const children = Array.from(savedBooksContainer.children);
        children.forEach(child => {
            if (child.id !== 'empty-library') {
                savedBooksContainer.removeChild(child);
            }
        });
        
        // Show empty library message if no books saved
        if (savedBooks.length === 0) {
            if (emptyLibrary) emptyLibrary.style.display = 'block';
            return;
        } else {
            if (emptyLibrary) emptyLibrary.style.display = 'none';
        }
        
        // Add each saved book to the container
        savedBooks.forEach((book, index) => {
            const bookElement = document.createElement('div');
            bookElement.className = 'saved-book';
            bookElement.innerHTML = `
                <img src="${book.imageUrl}" alt="${book.title}" class="saved-book-image">
                <div class="saved-book-info">
                    <h3 class="saved-book-title">${book.title}</h3>
                    <p class="saved-book-author">by ${book.author}</p>
                    <p class="saved-book-description">${book.description}</p>
                    <div class="saved-book-actions">
                        <button class="view-book-button" data-index="${index}">View Details</button>
                        <button class="remove-book-button" data-index="${index}">Remove</button>
                    </div>
                </div>
            `;
            
            savedBooksContainer.appendChild(bookElement);
        });
        
        // Add event listeners to view buttons
        const viewButtons = document.querySelectorAll('.view-book-button');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                viewSavedBook(savedBooks[index]);
            });
        });
        
        // Add event listeners to remove buttons
        const removeButtons = document.querySelectorAll('.remove-book-button');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeBookFromLibrary(index);
            });
        });
    }
    
    // View a saved book in the modal
    function viewSavedBook(book) {
        // Close the library panel
        document.getElementById('library-panel').classList.remove('open');
        document.getElementById('body-overlay').classList.remove('visible');
        
        // Open the modal with the book details
        openBookModal(book, book.index, book.symbol, book.imageUrl);
    }
    
    // Remove book from library
    function removeBookFromLibrary(index) {
        // Get current saved books
        const savedBooks = getSavedBooks();
        
        // Remove the book at the specified index
        savedBooks.splice(index, 1);
        
        // Update localStorage
        localStorage.setItem('savedBooks', JSON.stringify(savedBooks));
        
        // Update the display
        displaySavedBooks();
        
        // Show notification
        showNotification('Book removed from your library');
    }
    
    // Show a notification message
    function showNotification(message) {
        // Check if notification container exists, create if not
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
            `;
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            background: var(--mystical-gradient);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            font-family: 'Cinzel', serif;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Add saved badges to book cards when displaying recommendations
    function addSavedBadgesToCards() {
        const savedBooks = getSavedBooks();
        const cards = document.querySelectorAll('.book-card');
        
        cards.forEach((card, index) => {
            const title = card.querySelector('.book-title').textContent;
            const author = card.querySelector('.book-author').textContent.replace('by ', '');
            
            // Check if this book is saved
            const isSaved = savedBooks.some(book => 
                book.title === title && book.author === author
            );
            
            if (isSaved) {
                // Create badge if it doesn't exist
                let badge = card.querySelector('.saved-badge');
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'saved-badge';
                    badge.textContent = 'Saved';
                    card.appendChild(badge);
                }
                
                // Make badge visible
                setTimeout(() => {
                    badge.classList.add('visible');
                }, 500 + (index * 100)); // Staggered animation
            }
        });
    }
    
    // Function to convert numbers to Roman numerals for the tarot cards
    function romanize(num) {
        const roman = {
            M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90,
            L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1
        };
        let str = '';
        
        for (let i of Object.keys(roman)) {
            const q = Math.floor(num / roman[i]);
            num -= q * roman[i];
            str += i.repeat(q);
        }
        
        return str;
    }

    // Dark Mode Toggle Implementation
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // Apply the theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Toggle dark mode
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
});
