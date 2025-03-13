document.addEventListener('DOMContentLoaded', function() {
    // Library function for book recommendation processing
    const bookLibrary = {
        // Store cached recommendations
        cachedRecommendations: [],
        
        // Process book recommendations based on user input
        processRecommendations: function(userInput) {
            // This function will be called by the fetch API response handler
            // It performs additional processing on the raw API response
            
            if (!userInput || !Array.isArray(userInput)) {
                return [];
            }
            
            // Process and enhance each recommendation
            return userInput.map(book => {
                // Add mystical descriptions if not present
                if (!book.description || book.description.trim() === '') {
                    book.description = this.generateMysticalDescription(book.title, book.author);
                }
                
                // Add genre tags if not present
                if (!book.genres || !Array.isArray(book.genres) || book.genres.length === 0) {
                    book.genres = this.inferGenres(book.title, book.description);
                }
                
                // Add celestial alignment
                book.celestialAlignment = this.getCelestialAlignment();
                
                // Add reading mood
                book.readingMood = this.getReadingMood(book);
                
                return book;
            });
        },
        
        // Generate a mystical description for books without one
        generateMysticalDescription: function(title, author) {
            const mysticalPhrases = [
                "The cosmic energies align when one opens this tome of wisdom.",
                "As the moon waxes and wanes, so too does the journey within these pages.",
                "The ancient stars have guided many souls to the revelations contained herein.",
                "Like a tarot reading that unveils hidden truths, this book reveals layers of meaning with each reading.",
                "The universe conspired to bring this book into your path at this precise moment."
            ];
            
            const randomPhrase = mysticalPhrases[Math.floor(Math.random() * mysticalPhrases.length)];
            return `${randomPhrase} "${title}" by ${author} resonates with the seeker's journey, offering insights that transcend the ordinary. The words within speak directly to those who listen with both mind and spirit.`;
        },
        
        // Infer genres based on title and description
        inferGenres: function(title, description) {
            const genreKeywords = {
                'Fantasy': ['magic', 'wizard', 'dragon', 'spell', 'kingdom', 'quest', 'sword', 'mythical', 'creature'],
                'Mystery': ['detective', 'crime', 'solve', 'murder', 'case', 'investigation', 'clue', 'suspicious'],
                'Science Fiction': ['space', 'alien', 'future', 'technology', 'robot', 'galaxy', 'planet', 'dystopian'],
                'Romance': ['love', 'heart', 'passion', 'relationship', 'marriage', 'affection', 'desire'],
                'Historical': ['history', 'century', 'ancient', 'era', 'period', 'historical', 'past', 'war'],
                'Spiritual': ['spirit', 'soul', 'journey', 'enlightenment', 'wisdom', 'meditation', 'cosmic'],
                'Self-Help': ['growth', 'improve', 'success', 'habit', 'motivation', 'inspire', 'change']
            };
            
            const contentToCheck = (title + ' ' + description).toLowerCase();
            const matchedGenres = [];
            
            for (const [genre, keywords] of Object.entries(genreKeywords)) {
                if (keywords.some(keyword => contentToCheck.includes(keyword))) {
                    matchedGenres.push(genre);
                }
            }
            
            // If no genres matched, return some default mystical genres
            return matchedGenres.length > 0 ? matchedGenres : ['Mystical', 'Esoteric Wisdom', 'Transformative'];
        },
        
        // Get a celestial alignment for the book
        getCelestialAlignment: function() {
            const celestialBodies = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
            const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
            const aspects = ['Conjunction', 'Trine', 'Square', 'Opposition', 'Sextile'];
            
            const randomBody = celestialBodies[Math.floor(Math.random() * celestialBodies.length)];
            const randomSign = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
            const randomAspect = aspects[Math.floor(Math.random() * aspects.length)];
            
            return `${randomBody} in ${randomSign} ${randomAspect}`;
        },
        
        // Get a reading mood for the book
        getReadingMood: function(book) {
            const moods = [
                'Best read under moonlight for full effect',
                'Read during dawn for heightened awareness',
                'Perfect for contemplative evening reflection',
                'Connects most strongly during the full moon',
                'Meditate before reading to unlock deeper meanings',
                'Read with a crystal nearby to amplify insights',
                'Most powerful when read in solitude and silence',
                'Share with kindred spirits for collective wisdom'
            ];
            
            return moods[Math.floor(Math.random() * moods.length)];
        },
        
        // Save recommendations to cache
        saveToCache: function(recommendations) {
            this.cachedRecommendations = recommendations;
            // You could also save to localStorage for persistence between sessions
            localStorage.setItem('cachedBookRecommendations', JSON.stringify(recommendations));
        },
        
        // Get recommendations from cache
        getFromCache: function() {
            // Try to get from memory first
            if (this.cachedRecommendations.length > 0) {
                return this.cachedRecommendations;
            }
            
            // Try to get from localStorage
            const cached = localStorage.getItem('cachedBookRecommendations');
            if (cached) {
                this.cachedRecommendations = JSON.parse(cached);
                return this.cachedRecommendations;
            }
            
            return [];
        }
    };

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
                
                // Process the recommendations using our library function
                const processedRecommendations = bookLibrary.processRecommendations(data.recommendations);
                
                // Save to cache for future use
                bookLibrary.saveToCache(processedRecommendations);
                
                // Display recommendations
                displayRecommendations(processedRecommendations);
                
            } catch (error) {
                console.error('Error:', error);
                alert('Error getting recommendations: ' + error.message);
                
                // Try to display cached recommendations if available
                const cachedRecommendations = bookLibrary.getFromCache();
                if (cachedRecommendations.length > 0) {
                    console.log('Using cached recommendations');
                    displayRecommendations(cachedRecommendations);
                }
            } finally {
                // Hide loading spinner
                document.getElementById('loading').style.display = 'none';
            }
        });
    } else {
        console.error('Form element not found!');
    }
    
    // Create modal overlay immediately on page load to ensure it's available
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
        
        document.body.appendChild(modalOverlay);
    }
    
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    function displayRecommendations(recommendations) {
        const bookListElement = document.getElementById('book-list');
        bookListElement.innerHTML = '';
        
        // Tarot symbols to rotate through
        const tarotSymbols = ['☽', '☼', '★', '♆', '⚶', '☿', '♀', '♃', '♄', '⚸'];
        
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
    }
    
    // Function to open the book modal
    function openBookModal(book, index, symbol, imageUrl) {
        const modalOverlay = document.getElementById('modal-overlay');
        if (!modalOverlay) {
            console.error('Modal overlay not found');
            return;
        }
        
        const bookModal = modalOverlay.querySelector('.book-modal');
        if (!bookModal) {
            console.error('Book modal not found');
            return;
        }
        
        // Set modal content with enhanced mystical information
        bookModal.innerHTML = `
            <div class="modal-number">${romanize(index + 1)}</div>
            <div class="modal-symbol">${symbol}</div>
            <div class="modal-header">
                <h2 class="modal-title">${book.title}</h2>
                <p class="modal-author">by ${book.author}</p>
            </div>
            <img src="${imageUrl}" alt="${book.title}" class="modal-image">
            <div class="modal-content">
                <p class="modal-description">${book.description}</p>
                
                ${book.genres && book.genres.length > 0 ? 
                  `<div class="modal-genres">
                     <span class="modal-label">Mystical Alignments:</span>
                     <div class="genre-tags">${book.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}</div>
                   </div>` : ''}
                
                ${book.celestialAlignment ? 
                  `<div class="modal-alignment">
                     <span class="modal-label">Celestial Influence:</span>
                     <span class="alignment-text">${book.celestialAlignment}</span>
                   </div>` : ''}
                
                ${book.readingMood ? 
                  `<div class="modal-mood">
                     <span class="modal-label">Oracle's Guidance:</span>
                     <span class="mood-text">${book.readingMood}</span>
                   </div>` : ''}
            </div>
            <button class="modal-close">Close Revelation</button>
        `;
        
        // Add event listener to close button
        const closeButton = bookModal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }
        
        // Show the modal
        modalOverlay.classList.add('active');
        
        // Prevent body scrolling while modal is open
        document.body.style.overflow = 'hidden';
    }
    
    // Function to close the modal
    function closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            
            // Re-enable body scrolling
            document.body.style.overflow = '';
        }
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
    
    // Add stars to the background
    function createStars() {
        const stars = document.getElementById('stars');
        if (stars) {
            for (let i = 0; i < 100; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.top = `${Math.random() * 100}%`;
                star.style.left = `${Math.random() * 100}%`;
                star.style.animationDelay = `${Math.random() * 5}s`;
                stars.appendChild(star);
            }
        }
    }
    
    // Call function to create stars
    createStars();
});
