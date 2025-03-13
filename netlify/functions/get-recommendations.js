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
    const { favoriteBooks, genres, mood, length, additionalInfo } = requestBody;
    
    // Get number of recommendations (default to 5 if not specified)
    const numRecommendations = requestBody.numRecommendations || 5;
    
    console.log(`Generating ${numRecommendations} recommendations for books similar to: ${favoriteBooks}`);
    
    // Define the example book structure for clarity
    const exampleBooks = [
      {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "description": "A classic novel about wealth and the American Dream in the 1920s."
      },
      {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee", 
        "description": "A powerful story about racial inequality in the American South."
      }
    ];
    
    // Create a simpler prompt for OpenAI that focuses on the book list only
    const prompt = `
      Generate ${numRecommendations} book recommendations based on these preferences:
      
      Favorite books: ${favoriteBooks}
      ${genres ? `Preferred genres: ${genres}` : ''}
      ${mood ? `Preferred mood: ${mood}` : ''}
      ${length ? `Length preference: ${length}` : ''}
      ${additionalInfo ? `Additional information: ${additionalInfo}` : ''}
      
      Format each recommendation as a JSON object with title, author, and description fields.
      Return ONLY a valid JSON array of ${numRecommendations} book objects like this:
      ${JSON.stringify(exampleBooks, null, 2)}
      
      Important: Return ONLY the JSON array, nothing else.
    `;
    
    // Call OpenAI API with very explicit instructions
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a book recommendation system that returns only structured JSON data, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    
    // Extract the response content
    const content = response.data.choices[0].message.content.trim();
    console.log("Raw response from OpenAI:", content.substring(0, 100) + "...");
    
    // Try to parse the response as JSON
    let books;
    try {
      // Try direct parsing first
      books = JSON.parse(content);
      
      // If the result isn't an array, look for an array in the response
      if (!Array.isArray(books)) {
        console.log("Response is JSON but not an array, searching for array...");
        // Look for arrays in the response
        if (books.recommendations && Array.isArray(books.recommendations)) {
          books = books.recommendations;
        } else if (books.books && Array.isArray(books.books)) {
          books = books.books;
        } else {
          // No array found, throw error to trigger fallback
          throw new Error("Response is not an array or doesn't contain an array property");
        }
      }
    } catch (parseError) {
      console.log("Direct JSON parse failed:", parseError.message);
      
      // Try to extract a JSON array with regex as fallback
      const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          books = JSON.parse(arrayMatch[0]);
          console.log("Successfully extracted and parsed JSON array");
        } catch (extractError) {
          console.error("Failed to parse extracted JSON array:", extractError.message);
          // Fall back to generating books from scratch
          books = null;
        }
      } else {
        // No JSON array found, books remains null
        console.error("Could not find a JSON array in the response");
        books = null;
      }
    }
    
    // Validate books array or generate fallback
    if (!books || !Array.isArray(books) || books.length === 0) {
      console.log("Creating fallback recommendations based on user input");
      
      // Generate fallback recommendations based on user input
      const fallbackGenres = genres ? genres.split(',').map(g => g.trim()) : ["Fiction"];
      const fallbackAuthors = ["J.K. Rowling", "Stephen King", "Agatha Christie", "James Patterson", "Dan Brown"];
      const fallbackTitles = [
        "The Silent Echo", "Midnight Whispers", "The Hidden Path", "Echoes of Tomorrow", 
        "The Forgotten Garden", "Shadows of the Past", "The Last Secret", "Beyond the Horizon"
      ];
      
      books = [];
      for (let i = 0; i < Math.min(numRecommendations, 5); i++) {
        books.push({
          title: fallbackTitles[i % fallbackTitles.length],
          author: fallbackAuthors[i % fallbackAuthors.length],
          description: `A ${fallbackGenres[i % fallbackGenres.length].toLowerCase()} book that matches your preferences for ${mood || "engaging"} reading.`
        });
      }
    }
    
    // Ensure we have the correct number of recommendations
    if (books.length > numRecommendations) {
      books = books.slice(0, numRecommendations);
    }
    
    // Add book cover images using Google Books API
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      try {
        // Ensure the book has all required properties
        if (!book.title || !book.author || !book.description) {
          throw new Error("Book is missing required properties");
        }
        
        // Search Google Books API for the book
        const bookQuery = `${book.title} ${book.author}`;
        console.log(`Fetching cover for: ${bookQuery}`);
        
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
        console.log(`Error processing book "${book.title || 'Unknown'}":`, error.message);
        // Ensure all book properties exist
        book.title = book.title || "Unknown Title";
        book.author = book.author || "Unknown Author";
        book.description = book.description || "A book matching your preferences.";
        book.imageUrl = `https://via.placeholder.com/128x192/5b21b6/ffffff?text=Book`;
      }
    }
    
    // Create the final response
    const recommendationsData = {
      recommendations: books
    };
    
    // Return the enhanced recommendations
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recommendationsData)
    };
    
  } catch (error) {
    console.log('Error in serverless function:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error getting recommendations', 
        message: error.message 
      })
    };
  }
};
