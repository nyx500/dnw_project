
// Execute code only when 'body' tag is loaded
document.querySelector('body').onload = function() {
    
    // Share button functionality: add alert when click event happens for each 'share' button on each published article Author's home page
    [...document.getElementsByClassName('share-button')].forEach((button) => {
        button.addEventListener("click", function() {
            // Share button ID is always 'share-button-<article-id>', so split this string and get the id from the end of the string
            let sharingLink = `${window.location.origin}/reader/article?id=${button.id.split("share-button-")[1]}`;
            alert("Sharing Link: " + sharingLink);
        });
    });

    // Functionality to scroll to errors if they exist after a POST request
    var errorsContainer = document.querySelector('#errors-container');
    if (errorsContainer)
    {
        scrollToErrors(errorsContainer);
    }

    /** Functionality to toggle menu on smaller screens when menu button is clicked
     * Ref: https://www.devwares.com/blog/how-to-create-a-beautiful-responsive-navbar-using-tailwind-css/
    */
    const menuButton = document.querySelector('button.menu-button');
    const menu = document.querySelector('.hidden-menu');
    const nav = document.querySelector('nav');
    if (menuButton){
        menuButton.addEventListener('click', () => {
            menu.classList.toggle('hidden');
            nav.classList.toggle('py-0');
        });
    }

    // Applies dark mode if it is selected in sessionStorage when the page loads
    applyDarkModeToHTML();
    // Allows toggling of the dark mode by clicking on 'Dark Mode' button
    toggleDarkMode();
};

/////////////////////////////////////////////////////////////////HELPER FUNCTIONS////////////////////////////////////////////////////////////////////////////////////////
/** Function to scroll to the errors container on the Comments form on the View Article page if errors exist
 * Ref - instructions how to scroll smoothly to element:
 * https://stackoverflow.com/questions/49820013/javascript-scrollintoview-smooth-scroll-and-offset
*/
function scrollToErrors(element) {
    var offset = 200;
    var elementPosition = element.getBoundingClientRect().top;
    console.log(element.getBoundingClientRect());
    var offsetPosition = elementPosition + window.scrollY - offset;
    window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
   });
}

/* Dark mode functionality */
function toggleDarkMode() {
    // Select and store dark mode button from document
    var button = document.querySelector('#darkmode-button');
    // Toggles the temporary dark mode session variable when click event on the Dark Mode button
    button.addEventListener("click", function() {
        // Select the object which stores if dark mode is off/on from sessionStorage
        var darkVariable = sessionStorage.getItem('dark');
        // To turn dark mode on if it is not:
        if (darkVariable === undefined || darkVariable === null || darkVariable === 'off')
        {   
            // Update 'dark' session variable to 'on'
            sessionStorage.setItem('dark', 'on');
            // Add the 'dark' class to the DOM's 'html' element
            document.documentElement.classList.add("dark");
            // Change the text inside the Dark Mode button to 'Light Mode'
            button.innerHTML = "Light Mode";
            // Change the color of the SVG menu icon in the navbar on smaller screens (not accessible with Tailwind!) from black to light grey
            document.querySelector('#menu-icon').style.stroke = "lightgrey";
        }
        // To turn dark mode off:
        else
        {   
            sessionStorage.setItem('dark', 'off');
            document.documentElement.classList.remove("dark");
            button.innerHTML = "Dark Mode";
            document.querySelector('#menu-icon').style.stroke = "black";
        }
    });
}

// When the page loads, check if sessionStorage has recorded dark mode as on: if it is on, add 'dark' to <html>'s class list
function applyDarkModeToHTML() {
    var darkVariable = sessionStorage.getItem('dark');
    if (darkVariable === 'on')
    {   
        document.querySelector('#darkmode-button').innerHTML = "Light Mode";
        // Check if the DOM's <html> element contains the 'dark' class: if not, then add it to the class list
        if (!document.documentElement.classList.contains('dark'))
        {
            document.documentElement.classList.add("dark");
        }
        // Change menu icon to light grey on dark screens (as it is on a black navbar)
        document.querySelector('#menu-icon').style.stroke = "lightgrey";
    } else {
        document.querySelector('#darkmode-button').innerHTML = "Dark Mode";
        if (document.documentElement.classList.contains('dark'))
        {
            document.documentElement.classList.remove("dark");
        } 
        // Change menu icon back to black on light mode
        document.querySelector('#menu-icon').style.stroke = "black";
    }
}