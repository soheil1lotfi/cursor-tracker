// Indicates whether tracking is currently active
let isTracking = false;
// Stores tracked data for the current session
let trackedData = [];
let hoverTimeout = null; // Timer for hover detection
let currentElement = null; // Currently hovered element


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


// Function to handle mouse movements and track data
const trackMouse = (event) => {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    
    if (element !== currentElement) {
        // If the mouse moves to a new element, clear the previous timer
        clearTimeout(hoverTimeout);
        currentElement = element;
        
        // Start a new timer for the new element
        hoverTimeout = setTimeout(() => {
            recordElement(element, event);
        }, 1000); // 1 second
    }
};


// Function to record the element after the mouse has been over it for 1 second
const recordElement = (element, event) => {
    if (element !== null && element !== undefined) {
        // Get the mouse position relative to the entire webpage
        const clientX = event.clientX;
        const clientY = event.clientY;
        const pageX = event.pageX;
        const pageY = event.pageY;
        const screenX = event.screenX + window.scrollX;
        const screenY = event.screenY + window.scrollY;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        
        // Create an object to store element details
        const elementData = [
            window.location.href, // URL
            element.outerHTML, // Element
            element.className || '', // Element Class
            element.id || '', // Element ID
            pageX, // Position X relative to page window
            pageY, // Position Y relative to page window
            screenX, 
            screenY,
            clientX, 
            clientY, 
            scrollX, 
            scrollY
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
    } else if (message.command === 'stopTracking') {
        stopTracking();
    }
});
