const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get API key from environment variable
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }
    
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const { favoriteBooks, favoriteAuthors, genres, mood, length, additionalInfo, enhancedPrompt } = requestBody;
    
    // Create enhanced prompt for OpenAI with stronger emphasis on similarity
    const prompt = `
      Generate personalized book recommendations that are VERY SIMILAR to the books and authors mentioned by the reader. Focus on providing books that strongly match the style, themes, tone, and content of their favorites.
      
      Reader's preferences:
      - Favorite books: ${favoriteBooks || 'Not specified'}
      - Favorite authors: ${favoriteAuthors || 'Not specified'}
      - Genres of interest: ${genres || 'Not specified'}
      - Current mood: ${mood || 'Not specified'}
      - Preferred length: ${length || 'Not specified'}
      
      Additional context: ${additionalInfo || 'Not provided'}
      
      IMPORTANT: The recommendations should be HIGHLY SIMILAR to the books they mentioned. For each book they listed, provide 1-2 titles that:
      1. Share the same writing style
      2. Feature similar themes, settings, or character dynamics
      3. Would strongly appeal to fans of that specific book
      4. Provide a similar reading experience or emotional response
      
      Prioritize books that are direct matches in style and content over more loosely related titles. If they mentioned specific elements they enjoyed (like particular characters, settings, or plot devices), focus on books that contain those same elements.
      
      Provide a detailed response in JSON format with the following structure:
      {
        "recommendations": [
          {
            "title": "Book Title",
            "author": "Author Name",
            "description": "A mystical description of the book that connects it to the reader's journey AND SPECIFICALLY explains how this book is similar to one of their mentioned favorites."
          }
        ]
      }
    `;
    
    // Call OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that specializes in book recommendations, with a focus on finding extremely similar books to what users already enjoy. Your responses should be in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5  // Lower temperature for more deterministic results
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    
    // Extract the response content
    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Could not parse JSON response from OpenAI' })
      };
    }
    
    const recommendationsData = JSON.parse(jsonMatch[0]);
    
    // Add book cover images using Google Books API
    const recommendations = recommendationsData.recommendations;
    
    // Process each recommendation to add book cover images
    for (let i = 0; i < recommendations.length; i++) {
      const book = recommendations[i];
      try {
        // Search Google Books API for the book
        const bookQuery = `${book.title} ${book.author}`;
        const googleBooksResponse = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookQuery)}&maxResults=1`
        );
        
        // Extract image URL if available
        if (googleBooksResponse.data.items && 
            googleBooksResponse.data.items[0].volumeInfo.imageLinks &&
            googleBooksResponse.data.items[0].volumeInfo.imageLinks.thumbnail) {
          book.imageUrl = googleBooksResponse.data.items[0].volumeInfo.imageLinks.thumbnail;
        } else {
          // Fallback to a placeholder if no image is available
          book.imageUrl = `https://via.placeholder.com/128x192/5b21b6/ffffff?text=${encodeURIComponent(book.title.substring(0, 20))}`;
        }
      } catch (error) {
        console.log(`Error fetching book cover for ${book.title}:`, error);
        // Fallback to a placeholder on error
        book.imageUrl = `https://via.placeholder.com/128x192/5b21b6/ffffff?text=${encodeURIComponent(book.title.substring(0, 20))}`;
      }
    }
    
    // Add mystical celestial alignment to each recommendation
    recommendations.forEach(book => {
      // Generate celestial alignment if not present
      if (!book.celestialAlignment) {
        const celestialBodies = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
        const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const aspects = ['Conjunction', 'Trine', 'Square', 'Opposition', 'Sextile'];
        
        const randomBody = celestialBodies[Math.floor(Math.random() * celestialBodies.length)];
        const randomSign = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
        const randomAspect = aspects[Math.floor(Math.random() * aspects.length)];
        
        book.celestialAlignment = `${randomBody} in ${randomSign} ${randomAspect}`;
      }
    });
    
    // Return the enhanced recommendations
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recommendationsData)
    };
    
  } catch (error) {
    console.log('Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error getting recommendations', 
        message: error.message 
      })
    };
  }
};
