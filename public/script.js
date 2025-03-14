document.addEventListener('DOMContentLoaded', function() {
    // Library Manager - handles saving and retrieving books
    const libraryManager = {
        // Store saved books
        books: [],
        
        // Initialize the library
        init: function() {
            this.loadFromStorage();
            this.setupLibraryButton();
            this.updateLibraryCount();
        },
        
        // Load books from localStorage
        loadFromStorage: function() {
            const saved = localStorage.getItem('mysticalLibrary');
            if (saved) {
                try {
                    this.books = JSON.parse(saved);
                } catch (error) {
                    console.error('Error loading library:', error);
                    this.books = [];
                }
            }
        },
        
        // Save books to localStorage
        saveToStorage: function() {
            localStorage.setItem('mysticalLibrary', JSON.stringify(this.books));
        },
        
        // Add a book to the library
        addBook: function(book) {
            // Check if book already exists in library
            if (!this.isInLibrary(book)) {
                // Add save timestamp
                const bookWithTimestamp = {
                    ...book,
                    savedAt: new Date().toISOString()
                };
                
                this.books.push(bookWithTimestamp);
                this.saveToStorage();
                this.updateLibraryCount();
                return true;
            }
            return false;
        },
        
        // Check if a book is already in the library
        isInLibrary: function(book) {
            return this.books.some(savedBook => 
                savedBook.title === book.title && 
                savedBook.author === book.author
            );
        },
        
        // Remove a book from the library
        removeBook: function(book) {
            const initialCount = this.books.length;
            this.books = this.books.filter(savedBook => 
                !(savedBook.title === book.title && savedBook.author === book.author)
            );
            
            // If a book was removed, save the changes
            if (initialCount !== this.books.length) {
                this.saveToStorage();
                this.updateLibraryCount();
                return true;
            }
            return false;
        },
        
        // Get all saved books
        getAllBooks: function() {
            return [...this.books];
        },
        
        // Create and set up the library button in the header
        setupLibraryButton: function() {
            const headerContainer = document.querySelector('header .container');
            
            if (headerContainer) {
                // Create the library button if it doesn't exist
                if (!document.getElementById('library-button')) {
                    const libraryButton = document.createElement('div');
                    libraryButton.id = 'library-button';
                    libraryButton.className = 'library-button';
                    
                    // Create the counter element
                    const counter = document.createElement('span');
                    counter.id = 'library-counter';
                    counter.className = 'library-counter';
                    counter.textContent = this.books.length;
                    
                    // Hide counter if empty
                    if (this.books.length === 0) {
                        counter.style.display = 'none';
                    }
                    
                    // Create the icon
                    libraryButton.innerHTML = '📚';
                    libraryButton.appendChild(counter);
                    
                    // Add click event to show library
                    libraryButton.addEventListener('click', () => this.showLibrary());
                    
                    // Insert before theme toggle
                    const themeToggle = document.getElementById('theme-toggle');
                    if (themeToggle) {
                        headerContainer.insertBefore(libraryButton, themeToggle);
                    } else {
                        headerContainer.appendChild(libraryButton);
                    }
                }
            }
        },
        
        // Update the library count displayed on the button
        updateLibraryCount: function() {
            const counter = document.getElementById('library-counter');
            if (counter) {
                counter.textContent = this.books.length;
                
                // Show/hide based on count
                if (this.books.length > 0) {
                    counter.style.display = 'flex';
                } else {
                    counter.style.display = 'none';
                }
            }
        },
        
        // Show the library modal with all saved books
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
        
        // Close the library modal
        closeLibrary: function() {
            const modal = document.getElementById('library-modal-overlay');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        },
        
        // Clear all books from library
        clearLibrary: function() {
            this.books = [];
            this.saveToStorage();
            this.updateLibraryCount();
        }
    };

    // Enhanced user preferences analyzer
    const preferencesAnalyzer = {
        // Analyze text input for key themes
        analyzeText: function(text) {
            const lowerText = text.toLowerCase();
            
            // Define theme patterns
            const themes = {
                spiritual: this.countMatches(lowerText, ['spirit', 'soul', 'divine', 'sacred', 'meditation', 'mindful', 'consciousness', 'enlighten']),
                philosophical: this.countMatches(lowerText, ['meaning', 'existence', 'truth', 'reality', 'philosophy', 'ethics', 'moral', 'wisdom']),
                personal_growth: this.countMatches(lowerText, ['growth', 'journey', 'transformation', 'healing', 'discover', 'self', 'improve', 'change']),
                fantasy: this.countMatches(lowerText, ['magic', 'fantasy', 'mythical', 'myth', 'creature', 'dragon', 'wizard', 'spell', 'enchant']),
                science: this.countMatches(lowerText, ['science', 'physics', 'biology', 'chemistry', 'astronomy', 'tech', 'future', 'space']),
                history: this.countMatches(lowerText, ['history', 'ancient', 'medieval', 'century', 'war', 'civilization', 'empire', 'era']),
                mystery: this.countMatches(lowerText, ['mystery', 'detective', 'crime', 'solve', 'clue', 'suspense', 'thriller']),
                romance: this.countMatches(lowerText, ['love', 'romance', 'relationship', 'passion', 'heart', 'emotion', 'feeling'])
            };
            
            // Get dominant themes (score > 0)
            const dominantThemes = Object.entries(themes)
                .filter(([_, score]) => score > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([theme, _]) => theme);
                
            return dominantThemes;
        },
        
        // Count matches for a set of keywords
        countMatches: function(text, keywords) {
            return keywords.reduce((count, word) => {
                const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
                const matches = text.match(regex) || [];
                return count + matches.length;
            }, 0);
        },
        
        // Get selected values from multiple-select or checkboxes
        getSelectedValues: function(elementId) {
            const element = document.getElementById(elementId);
            if (!element) return [];
            
            if (element.type === 'select-multiple') {
                return Array.from(element.selectedOptions).map(opt => opt.value);
            } else if (element.type === 'checkbox') {
                const checkboxes = document.querySelectorAll(`input[name="${element.name}"]:checked`);
                return Array.from(checkboxes).map(cb => cb.value);
            }
            
            return [element.value];
        },
        
        // Create enhanced recommendation request
        createEnhancedRequest: function() {
            // Get basic form values
            const favoriteBooks = document.getElementById('favorite-books')?.value || '';
            const favoriteAuthors = document.getElementById('favorite-authors')?.value || '';
            const genres = document.getElementById('genres')?.value || '';
            const mood = document.getElementById('mood')?.value || '';
            const length = document.getElementById('length')?.value || '';
            const additionalInfo = document.getElementById('additional-info')?.value || '';
            
            // Get advanced form values if they exist
            const readingLevel = document.getElementById('reading-level')?.value || 'Intermediate';
            const writingStyle = document.getElementById('writing-style')?.value || '';
            
            // Get selected themes if the element exists
            let selectedThemes = [];
            if (document.getElementById('themes')) {
                selectedThemes = this.getSelectedValues('themes');
            }
            
            // Get other optional form values
            const bookAge = document.getElementById('book-age')?.value || '';
            const emotionalImpact = document.getElementById('emotional-impact')?.value || '';
            const includeObscureTitles = document.getElementById('include-obscure')?.checked || false;
            const similarityLevel = document.getElementById('similarity-level')?.value || '3';
            
            // Get all user feedback
            const userFeedback = JSON.parse(localStorage.getItem('bookFeedback') || '{}');
            
            // Analyze text inputs for themes
            const combinedText = `${favoriteBooks} ${favoriteAuthors} ${additionalInfo}`;
            const analyzedThemes = this.analyzeText(combinedText);
            
            // Create enhanced request object
            return {
                favoriteBooks,
                favoriteAuthors,
                genres,
                mood,
                length,
                additionalInfo,
                readingLevel,
                writingStyle,
                // Combine selected and analyzed themes, removing duplicates
                themes: [...new Set([...selectedThemes, ...analyzedThemes])],
                bookAge,
                emotionalImpact,
                includeObscureTitles,
                similarityLevel,
                userFeedback,
                // Enhanced prompt for better results
                enhancedPrompt: this.generateEnhancedPrompt({
                    favoriteBooks,
                    favoriteAuthors,
                    genres,
                    mood,
                    length,
                    readingLevel,
                    themes: [...new Set([...selectedThemes, ...analyzedThemes])],
                    writingStyle,
                    bookAge,
                    emotionalImpact,
                    includeObscureTitles,
                    similarityLevel,
                    additionalInfo
                })
            };
        },
        
        // Generate enhanced prompt for better recommendations
        generateEnhancedPrompt: function(preferences) {
            return `Generate personalized book recommendations for a reader with the following preferences:
- Favorite books: ${preferences.favoriteBooks || 'Not specified'}
- Favorite authors: ${preferences.favoriteAuthors || 'Not specified'}
- Genres of interest: ${preferences.genres || 'Not specified'}
- Current mood: ${preferences.mood || 'Not specified'}
- Preferred length: ${preferences.length || 'Not specified'}
- Reading experience level: ${preferences.readingLevel || 'Intermediate'}
- Themes they're drawn to: ${preferences.themes.join(', ') || 'Not specified'}
- Writing style preference: ${preferences.writingStyle || 'Not specified'}
- Book age preference: ${preferences.bookAge || 'Not specified'}
- Emotional impact desired: ${preferences.emotionalImpact || 'Not specified'}
- Include obscure titles: ${preferences.includeObscureTitles ? 'Yes' : 'No'}
- How similar to favorites (1-5): ${preferences.similarityLevel || '3'}

Additional context: ${preferences.additionalInfo || 'Not provided'}

For each recommendation, provide:
1. Title
2. Author
3. A mystical description that connects the book to the reader's journey
4. How this book aligns with their preferences
5. A spiritual or mystical insight the book might offer them
6. If available, an image URL for the book cover

Ensure the recommendations are diverse yet relevant, and provide books that will resonate with the reader's spiritual journey and preferences.`;
        }
    };

    // Handle form submission with enhanced functionality
    const form = document.getElementById('recommendation-form');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            // Prevent the default form submission
            e.preventDefault();
            
            // Show loading spinner
            document.getElementById('loading').style.display = 'block';
            document.getElementById('result-section').style.display = 'none';
            document.getElementById('result-section').classList.remove('visible');
            
            try {
                // Get enhanced request data
                const requestData = preferencesAnalyzer.createEnhancedRequest();
                
                // Call our serverless function
                const response = await fetch('/api/get-recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
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
    
    // Function to display recommendations
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
            
            // Check if book is in library
            const isInLibrary = libraryManager.isInLibrary(book);
            
            // Add tarot card elements and structure
            bookCard.innerHTML = `
                <div class="tarot-number">${romanize(index + 1)}</div>
                <img src="${imageUrl}" alt="${book.title} cover">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <p class="read-more">Click to reveal the oracle's wisdom</p>
                    <button class="library-toggle-btn ${isInLibrary ? 'in-library' : ''}">
                        ${isInLibrary ? '✓ In Library' : '+ Add to Library'}
                    </button>
                    <div class="tarot-symbol">${tarotSymbols[index % tarotSymbols.length]}</div>
                </div>
            `;
            
            // Add click event to open modal with book details
            bookCard.addEventListener('click', function(e) {
                // Don't trigger modal if clicking the library button
                if (!e.target.classList.contains('library-toggle-btn')) {
                    openBookModal(book, index, tarotSymbols[index % tarotSymbols.length], imageUrl);
                }
            });
            
            // Find and add event listener to library toggle button
            const libraryToggleBtn = bookCard.querySelector('.library-toggle-btn');
            if (libraryToggleBtn) {
                libraryToggleBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent opening the modal
                    
                    if (libraryManager.isInLibrary(book)) {
                        // Remove from library
                        libraryManager.removeBook(book);
                        libraryToggleBtn.classList.remove('in-library');
                        libraryToggleBtn.textContent = '+ Add to Library';
                    } else {
                        // Add to library
                        libraryManager.addBook(book);
                        libraryToggleBtn.classList.add('in-library');
                        libraryToggleBtn.textContent = '✓ In Library';
                    }
                });
            }
            
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
    }
    
    // Function to open the book modal
    function openBookModal(book, index, symbol, imageUrl) {
        const modalOverlay = document.getElementById('modal-overlay');
        const bookModal = modalOverlay.querySelector('.book-modal');
        
        // Check if the book is in the library
        const isInLibrary = libraryManager.isInLibrary(book);
        
        // Get additional book details if available
        const alignment = book.alignment || book.celestialAlignment || generateCelestialAlignment();
        const insight = book.insight || book.mysticalInsight || '';
        
        // Set modal content
        bookModal.innerHTML = `
            <div class="modal-number">${romanize(index + 1)}</div>
            <div class="modal-symbol">${symbol}</div>
            <div class="modal-header">
                <h2 class="modal-title">${book.title}</h2>
                <p class="modal-author">by ${book.author}</p>
            </div>
            <img src="${imageUrl}" alt="${book.title}" class="modal-image">
            <p class="modal-description">${book.description}</p>
            
            ${alignment ? `
            <div class="modal-alignment">
                <span class="alignment-label">Celestial Alignment:</span>
                <span class="alignment-text">${alignment}</span>
            </div>` : ''}
            
            ${insight ? `
            <div class="modal-insight">
                <span class="insight-label">Oracle's Insight:</span>
                <span class="insight-text">${insight}</span>
            </div>` : ''}
            
            <div class="feedback-buttons">
                <button class="feedback-btn relevant" data-book="${book.title}" data-feedback="relevant">
                    <span class="feedback-icon">✨</span> This resonates with me
                </button>
                <button class="feedback-btn irrelevant" data-book="${book.title}" data-feedback="irrelevant">
                    <span class="feedback-icon">✖</span> Not for my journey
                </button>
            </div>
            
            <div class="modal-actions">
                <button class="library-toggle-modal-btn ${isInLibrary ? 'in-library' : ''}">
                    ${isInLibrary ? '✓ In Your Library' : '✦ Add to Library ✦'}
                </button>
                <button class="modal-close">Close Revelation</button>
            </div>
        `;
        
        // Add event listener to close button
        bookModal.querySelector('.modal-close').addEventListener('click', closeModal);
        
        // Add event listener to library toggle button
        const libraryToggleBtn = bookModal.querySelector('.library-toggle-modal-btn');
        if (libraryToggleBtn) {
            libraryToggleBtn.addEventListener('click', function() {
                if (libraryManager.isInLibrary(book)) {
                    // Remove from library
                    libraryManager.removeBook(book);
                    libraryToggleBtn.classList.remove('in-library');
                    libraryToggleBtn.textContent = '✦ Add to Library ✦';
                } else {
                    // Add to library
                    libraryManager.addBook(book);
                    libraryToggleBtn.classList.add('in-library');
                    libraryToggleBtn.textContent = '✓ In Your Library';
                }
            });
        }
        
        // Add event listeners to feedback buttons
        const feedbackButtons = bookModal.querySelectorAll('.feedback-btn');
        feedbackButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                storeFeedback(book.title, btn.dataset.feedback);
                
                // Highlight the selected button
                feedbackButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // Show feedback confirmation
                const confirmationMsg = document.createElement('div');
                confirmationMsg.className = 'feedback-confirmation';
                confirmationMsg.textContent = btn.dataset.feedback === 'relevant' 
                    ? 'Thank you! The Oracle will remember your preference.' 
                    : 'Noted. The Oracle will avoid similar recommendations.';
                
                // Replace buttons with confirmation
                const feedbackContainer = bookModal.querySelector('.feedback-buttons');
                feedbackContainer.innerHTML = '';
                feedbackContainer.appendChild(confirmationMsg);
            });
        });
        
        // Show the modal
        modalOverlay.classList.add('active');
        
        // Prevent body scrolling while modal is open
        document.body.style.overflow = 'hidden';
    }
    
    // Store user feedback for better recommendations
    function storeFeedback(bookTitle, feedbackType) {
        // Get existing feedback
        const userFeedback = JSON.parse(localStorage.getItem('bookFeedback') || '{}');
        
        // Add new feedback
        userFeedback[bookTitle] = feedbackType;
        
        // Save to localStorage
        localStorage.setItem('bookFeedback', JSON.stringify(userFeedback));
        
        // Send to API for future learning (if available)
        try {
            fetch('/api/store-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    bookTitle, 
                    feedbackType,
                    timestamp: new Date().toISOString()
                })
            }).catch(err => console.log('Feedback API not available, stored locally only'));
        } catch (error) {
            console.log('Feedback API not available, stored locally only');
        }
    }
    
    // Generate a celestial alignment for books that don't have one
    function generateCelestialAlignment() {
        const celestialBodies = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
        const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const aspects = ['Conjunction', 'Trine', 'Square', 'Opposition', 'Sextile'];
        
        const randomBody = celestialBodies[Math.floor(Math.random() * celestialBodies.length)];
        const randomSign = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
        const randomAspect = aspects[Math.floor(Math.random() * aspects.length)];
        
        return `${randomBody} in ${randomSign} ${randomAspect}`;
    }
    
    // Function to close the modal
    function closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.remove('active');
        
        // Re-enable body scrolling
        document.body.style.overflow = '';
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
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    // Initialize the library manager
    libraryManager.init();

    // Function to add enhanced form fields
    function enhanceRecommendationForm() {
        const form = document.getElementById('recommendation-form');
        if (!form) return;
        
        // Find the submit button to insert before it
        const submitButton = form.querySelector('button[type="submit"]');
        if (!submitButton) return;
        
        // Create a container for advanced options
        const advancedOptionsToggle = document.createElement('div');
        advancedOptionsToggle.className = 'advanced-options-toggle';
        advancedOptionsToggle.innerHTML = `
            <button type="button" id="toggle-advanced" class="toggle-advanced-btn">
                <span class="toggle-icon">✦</span> Reveal Advanced Mystical Options <span class="toggle-icon">✦</span>
            </button>
        `;
        
        // Create advanced options container
        const advancedOptions = document.createElement('div');
        advancedOptions.id = 'advanced-options';
        advancedOptions.className = 'advanced-options';
        advancedOptions.style.display = 'none';
        
        // Add advanced form fields
        advancedOptions.innerHTML = `
            <div class="advanced-options-header">
                <h3>Advanced Mystical Guidance</h3>
                <p>Refine your oracle's revelations with these mystical parameters</p>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="reading-level">Your Reading Experience</label>
                    <select id="reading-level" name="reading-level">
                        <option value="Beginner">Novice Seeker - New to literary journeys</option>
                        <option value="Intermediate" selected>Seasoned Wanderer - Comfortable with most texts</option>
                        <option value="Advanced">Mystical Adept - Seeking profound literary challenges</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="writing-style">Preferred Writing Style</label>
                    <select id="writing-style" name="writing-style">
                        <option value="">Any style that resonates</option>
                        <option value="Lyrical">Lyrical & Poetic</option>
                        <option value="Straightforward">Clear & Straightforward</option>
                        <option value="Philosophical">Philosophical & Contemplative</option>
                        <option value="Descriptive">Rich & Descriptive</option>
                        <option value="Conversational">Warm & Conversational</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Mystical Themes That Call To You</label>
                <div class="themes-container">
                    <div class="theme-option">
                        <input type="checkbox" id="theme-spiritual" name="themes" value="Spiritual">
                        <label for="theme-spiritual">Spiritual Journeys</label>
                    </div>
                    <div class="theme-option">
                        <input type="checkbox" id="theme-philosophical" name="themes" value="Philosophical">
                        <label for="theme-philosophical">Philosophical Quests</label>
                    </div>
                    <div class="theme-option">
                        <input type="checkbox" id="theme-growth" name="themes" value="Personal Growth">
                        <label for="theme-growth">Personal Transformation</label>
                    </div>
                    <div class="theme-option">
                        <input type="checkbox" id="theme-magical" name="themes" value="Magical">
                        <label for="theme-magical">Magical Realms</label>
                    </div>
                    <div class="theme-option">
                        <input type="checkbox" id="theme-cosmic" name="themes" value="Cosmic">
                        <label for="theme-cosmic">Cosmic Mysteries</label>
                    </div>
                    <div class="theme-option">
                        <input type="checkbox" id="theme-historical" name="themes" value="Historical">
                        <label for="theme-historical">Ancient Wisdom</label>
                    </div>
                    <div class="theme-option">
                        <input type="checkbox" id="theme-nature" name="themes" value="Nature">
                        <label for="theme-nature">Nature & Elements</label>
                    </div>
                    <div class="theme-option">
                        <input type="checkbox" id="theme-symbolic" name="themes" value="Symbolic">
                        <label for="theme-symbolic">Symbolism & Archetypes</label>
                    </div>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="book-age">Temporal Energy</label>
                    <select id="book-age" name="book-age">
                        <option value="">Any era that resonates</option>
                        <option value="Classic">Timeless Classics</option>
                        <option value="Modern">Modern Revelations</option>
                        <option value="Recent">Recent Manifestations (Last 5 Years)</option>
                        <option value="Mixed">Balanced Blend of Eras</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="emotional-impact">Desired Emotional Resonance</label>
                    <select id="emotional-impact" name="emotional-impact">
                        <option value="">Open to all energies</option>
                        <option value="Inspiring">Inspiring & Uplifting</option>
                        <option value="Thought-provoking">Thought-provoking & Challenging</option>
                        <option value="Comforting">Comforting & Reassuring</option>
                        <option value="Transformative">Transformative & Life-changing</option>
                        <option value="Enlightening">Enlightening & Awakening</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group toggle-group">
                    <input type="checkbox" id="include-obscure" name="include-obscure">
                    <label for="include-obscure">Include Hidden Gems & Obscure Wisdom</label>
                </div>
                
                <div class="form-group">
                    <label for="similarity-level">Similarity to Your Current Path</label>
                    <div class="similarity-slider-container">
                        <input type="range" id="similarity-level" name="similarity-level" min="1" max="5" value="3">
                        <div class="slider-labels">
                            <span>New Directions</span>
                            <span>Balanced</span>
                            <span>Familiar Waters</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert the advanced options before the submit button
        const formContainer = submitButton.parentElement;
        formContainer.insertBefore(advancedOptionsToggle, submitButton);
        formContainer.insertBefore(advancedOptions, submitButton);
        
        // Add toggle functionality
        const toggleButton = document.getElementById('toggle-advanced');
        toggleButton.addEventListener('click', function() {
            const advancedSection = document.getElementById('advanced-options');
            if (advancedSection.style.display === 'none') {
                advancedSection.style.display = 'block';
                toggleButton.innerHTML = `
                    <span class="toggle-icon">✦</span> Conceal Advanced Mystical Options <span class="toggle-icon">✦</span>
                `;
                
                // Smooth scroll to show the advanced options
                setTimeout(() => {
                    advancedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            } else {
                advancedSection.style.display = 'none';
                toggleButton.innerHTML = `
                    <span class="toggle-icon">✦</span> Reveal Advanced Mystical Options <span class="toggle-icon">✦</span>
                `;
            }
        });
    }
    
    // Call the function to enhance the form
    enhanceRecommendationForm();
});
