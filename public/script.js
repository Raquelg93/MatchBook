document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission - Make sure this is working
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
    }
    
    // Function to open the book modal
    function openBookModal(book, index, symbol, imageUrl) {
        const modalOverlay = document.getElementById('modal-overlay');
        const bookModal = modalOverlay.querySelector('.book-modal');
        
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
            <button class="modal-close">Close Revelation</button>
        `;
        
        // Add event listener to close button
        bookModal.querySelector('.modal-close').addEventListener('click', closeModal);
        
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
