let isTracking = false;
let trackedData = '';

// Function to start tracking
const startTracking = () => {
    if (!isTracking) {
        isTracking = true;
        trackedData = '';

        // Add event listener for mousemove
        document.addEventListener('mousemove', trackMouse);
    }
};

// Function to stop tracking
const stopTracking = () => {
    if (isTracking) {
        isTracking = false;

        // Remove event listener for mousemove
        document.removeEventListener('mousemove', trackMouse);

        // Send tracked data to background script
        chrome.runtime.sendMessage({ command: 'updateTrackedData', data: trackedData });
    }
};

// Function to track mouse movements
const trackMouse = (event) => {
    const x = event.clientX;
    const y = event.clientY;
    const element = document.elementFromPoint(x, y);
    
    // Check if the element is not null and is not undefined before accessing its properties
    if (element !== null && element !== undefined) {
        // Apply a bright blue border to the chosen element
        element.style.border = '2px solid #00f'; // Bright blue color
        
        // Log the coordinates and the DOM element
        const elementData = `Mouse at (${x}, ${y}) over element: ${element}\n`;
        trackedData += elementData;
        console.log(element)
        element.addEventListener('mouseleave', () => {element.style.border = 'none'; // Remove the border
        });
    }
};

// Initialize content script by retrieving tracking state from background script
chrome.runtime.sendMessage({ command: 'getTrackingState' }, (response) => {
    if (response.isTracking) {
        startTracking();
    }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'startTracking') {
        startTracking();
    } else if (message.command === 'stopTracking') {
        stopTracking();
    }
});
