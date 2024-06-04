// Indicates whether tracking is currently active
let isTracking = false;
// Stores tracked data for the current session
let trackedData = '';

// Function to start tracking
const startTracking = () => {
    if (!isTracking) {
        isTracking = true;
        trackedData = '';

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
    const x = event.clientX;
    const y = event.clientY;
    // Get the topmost DOM element at the mouse pointer's coordinates
    const element = document.elementFromPoint(x, y);
    
    // Check if the element is valid before accessing its properties
    if (element !== null && element !== undefined) {
        // Apply a bright blue border to the element being tracked
        element.style.border = '2px solid #00f'; // Bright blue color
        
        // Create an object to store element details
        const elementData = {
            id: element.id || '',
            class: element.className || '',
            data: element.outerHTML
        };
        // Append the element data to the tracked data string
        trackedData += JSON.stringify(elementData) + '\n';
        console.log(elementData);

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
