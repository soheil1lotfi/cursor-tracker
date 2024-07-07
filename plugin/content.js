// Indicates whether tracking is currently active
let isTracking = false;
// Stores tracked data for the current session
let trackedData = [];
let hoverTimeout = null; // Timer for hover detection
let currentElement = null; // Currently hovered element
let gazeCoords = { x: 0, y: 0 };


// Function to start tracking
const startTracking = () => {
    if (!isTracking) {
        isTracking = true;
        trackedData = [];

        // Add event listener to track mouse movements
        document.addEventListener('mousemove', trackMouse);
    }
};

// Function to stop tracking
const stopTracking = () => {
    if (isTracking) {
        isTracking = false;

        // Remove the event listener for mouse movements
        document.removeEventListener('mousemove', trackMouse);

        // Send tracked data to the background script for storage
        chrome.runtime.sendMessage({ command: 'updateTrackedData', data: trackedData });
    }
};


// // Function to handle mouse movements and track data //Old function with no click event recording
// const trackMouse = (event) => {
//     const element = document.elementFromPoint(event.clientX, event.clientY);
    
//     if (element !== currentElement) {
//         // If the mouse moves to a new element, clear the previous timer
//         clearTimeout(hoverTimeout);
//         currentElement = element;
        
//         // Start a new timer for the new element
//         hoverTimeout = setTimeout(() => {
//             recordElement(element, event);
//         }, 1000); // 1 second
//     }
// };


// Function to handle mouse movements and track data
const trackMouse = (event) => {
    const element = document.elementFromPoint(event.clientX, event.clientY);

    if (element !== currentElement) {
        // If the mouse moves to a new element, clear the previous timer and remove click listener
        clearTimeout(hoverTimeout);
        if (currentElement) {
            currentElement.removeEventListener('click', handleElementClick, true);
        }

        currentElement = element;

        // Start a new timer for the new element
        hoverTimeout = setTimeout(() => {
            recordElement(element, event, false);
            // Add a click listener to the current element
            element.addEventListener('click', handleElementClick, true);
        }, 1000); // 1 second
    }
};

// Function to handle click events and track data
const handleElementClick = (event) => {
    const element = event.target;
    recordElement(element, event, true);
};


// Function to record the element after the mouse has been over it for 1 second
const recordElement = (element, event, clicked) => {
    
    if (element !== null && element !== undefined) {
        // Get the mouse position relative to the entire webpage
        const pageX = event.clientX + window.scrollX;
        const pageY = event.clientY + window.scrollY;
        
        console.log(pageX)
        // Create an object to store element details
        const elementData = [
            window.location.href, // URL
            element.outerHTML, // Element
            element.className || null, // Element Class
            element.id || null, // Element ID
            pageX || null, // Position X relative to page window
            pageY || null,// Position Y relative to page window
            gazeCoords.x || null,
            gazeCoords.y || null,
            new Date().toISOString(), // Timestamp
            clicked
        ];
        trackedData.push(elementData);
        
        // Debuger log
        console.log(elementData);
        

        // Apply a bright blue border to the element being tracked
        element.style.border = '2px solid #00f';
    
        // Remove the border when the mouse leaves the element
        element.addEventListener('mouseleave', () => {
            element.style.border = 'none';
        });
    }
};


// Initialize the content script by retrieving the tracking state from the background script
chrome.runtime.sendMessage({ command: 'getTrackingState' }, (response) => {
    if (response.isTracking) {
        startTracking();
    }
});

// Listen for messages from the background script to start or stop tracking
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'startTracking') {
        startTracking();
    } 
    else if (message.command === 'stopTracking') {
        stopTracking();
    }
    else if (message.command === 'updateGazeCoords') {
        gazeCoords.x = message.gazeX;
        gazeCoords.y = message.gazeY;
    }
});
