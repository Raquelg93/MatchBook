document.addEventListener('DOMContentLoaded', function () {
    // Handle form submission
    document.getElementById('recommendation-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        // Get form values
        const favoriteBooks = document.getElementById('favorite-books').value;
        const genres = document.getElementById('genres').value;
        const mood = document.getElementById('mood').value;
        const length = document.getElementById('length').value;
        const additionalInfo = document.getElementById('additional-info').value;

        // Show loading spinner
        document.getElementById('loading').style.display = 'block';
        document.getElementById('result-section').style.display = 'none';

        try {
            // Call our serverless function
            const response = await fetch('/api/get-recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    favoriteBooks,
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

    function displayRecommendations(recommendations) {
        const bookListElement = document.getElementById('book-list');
        bookListElement.innerHTML = '';

        recommendations.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';

            // Use a placeholder image if none provided
            const imageUrl = book.imageUrl || `/api/placeholder/300/200`;

            bookCard.innerHTML = `
                <img src="${imageUrl}" alt="${book.title} cover">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <p class="book-description">${book.description}</p>
                </div>
            `;

            bookListElement.appendChild(bookCard);
        });

        document.getElementById('result-section').style.display = 'block';
    }
});