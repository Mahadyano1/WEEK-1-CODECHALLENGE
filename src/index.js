
document.addEventListener("DOMContentLoaded", function() {
    // Define variables to store references to relevant DOM elements
    const filmSelector = document.getElementById("films");
    const imageDisplay = document.getElementById("poster");
    const filmTitleDisplay = document.getElementById("title");
    const duration = document.getElementById("runtime");
    const synopsis = document.getElementById("film-info");
    const screeningTime = document.getElementById("showtime");
    const availableTickets = document.getElementById("ticket-num");
    const purchaseButton = document.querySelector("div button");
    // API endpoint URL for fetching film information
    const apiEndpoint = "https://json-server-flatdango.onrender.com/films";
  
    // Function to fetch and display movies from the API
    async function retrieveMovies() {
      // Clear existing options in the film selector
      filmSelector.innerHTML = "";
  
      try {
        let res = await fetch(apiEndpoint);
        let movies = await res.json();
  
        // Iterate through each movie fetched from the API
        movies.forEach(movie => {
          // Create a list item for each movie
          let listItem = document.createElement("li");
          listItem.textContent = movie.title.toUpperCase();
          listItem.style.cursor = "pointer";
          listItem.id = movie.id;
          listItem.classList.add("film", "item");
          // Append a delete button to each list item
          listItem.innerHTML += `<button id="D${movie.id}" style="border-radius:5px">Delete</button>`;
  
          // Append the list item to the film selector
          filmSelector.append(listItem);
  
          // If a movie is sold out, add a sold-out class to it
          if (movie.capacity - movie.tickets_sold === 0) {
            listItem.classList.add("sold-out");
          }
  
          // Add an event listener to display movie details when clicked
          listItem.addEventListener("click", () => displayMovieDetails(movie));
          // Add an event listener to the delete button to remove the movie without propagating the click event
          document.getElementById(`D${movie.id}`).addEventListener("click", (event) => {
            event.stopPropagation();
            removeMovie(movie.id);
          });
        });
  
        // Display details of the first movie by default
        displayMovieDetails(movies[0]);
      } catch (error) {
        // Log error to console if there's an issue fetching films
        console.error('Error fetching films:', error);
      }
    }
  
    // Call retrieveMovies function to load movies
    retrieveMovies();
  
    // Function to display details of a selected movie
    function displayMovieDetails(movie) {
      // Update the DOM elements with the movie details
      availableTickets.textContent = movie.capacity - movie.tickets_sold;
      imageDisplay.src = movie.poster;
      imageDisplay.alt = movie.title;
      filmTitleDisplay.textContent = movie.title;
      duration.textContent = movie.runtime + " minutes";
      synopsis.textContent = movie.description;
      screeningTime.textContent = movie.showtime;
      // Update purchase button text based on ticket availability
      purchaseButton.textContent = availableTickets.textContent > 0 ? "Buy Tickets" : "SOLD OUT";
  
      // Add event listener to handle ticket purchase
      purchaseButton.addEventListener("click", () => ticketPurchase(movie), {once: true});
    }
  
    // Function to delete a movie using its identifier
    async function removeMovie(identifier) {
      try {
        let res = await fetch(`${apiEndpoint}/${identifier}`, {
          method: "DELETE",
          // Set headers for the DELETE request
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        });
        // Await the response from the DELETE request
        let outcome = await res.json();
        // Log the outcome of deletion
        console.log(outcome);
  
        // Refresh the movie list after deletion
        retrieveMovies();
      } catch (error) {
        // Alert the user if there's an error deleting the film
        alert('Error deleting film:', error);
      }
    }
  
    // Function to handle ticket purchasing
    async function ticketPurchase(movie) {
      // Check if there are available tickets before proceeding
      if (availableTickets.textContent > 0) {
        // Increment the count of tickets sold for the movie
        movie.tickets_sold++;
        try {
          let res = await fetch(`${apiEndpoint}/${movie.id}`, {
            method: "PATCH",
            // Set headers for the PATCH request
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            // Pass the updated tickets sold count in the request body
            body: JSON.stringify({ tickets_sold: movie.tickets_sold }),
          });
          // Refreshed movie data after updating tickets sold
          let refreshedMovie = await res.json();
          // Update the displayed ticket availability
          availableTickets.textContent = refreshedMovie.capacity - refreshedMovie.tickets_sold;
  
          // If there are no tickets left, update the button to show "SOLD OUT"
          if (availableTickets.textContent == 0) {
            purchaseButton.textContent = "SOLD OUT";
            document.getElementById(movie.id).classList.add("sold-out");
          }
  
          // Post to a separate tickets endpoint to record the ticket sale
          await fetch("https://json-server-flatdango.onrender.com/tickets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            // The request body includes the film id and the number of tickets sold (1 in this case)
            body: JSON.stringify({
              film_id: movie.id,
              tickets: 1,
            }),
          });
        } catch (error) {
          // Alert the user if there's an error purchasing the ticket
          alert('Error purchasing ticket:', error);
        }
      }
    }
  });