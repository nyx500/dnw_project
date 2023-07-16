

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
};

