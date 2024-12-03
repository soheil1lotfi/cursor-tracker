// Indicates whether tracking is currently active
let isTracking = false;
// Stores tracked data for the current session
let trackedData = [];
let hoverTimeout = null; // Timer for hover detection
let currentElement = null; // Currently hovered element
let gazeCoords = { x: 0, y: 0 };

let gazeTrackingEnabled = false;
let showGazeLocation = false;
let tagSize = 200;

// Function to toggle apriltags visibility
const toggleApriltags = (enabled) => {
    const apriltags = document.querySelectorAll('.apriltag');
    console.log(`Toggling apriltags: ${enabled ? 'show' : 'hide'}`); // Debug log
    apriltags.forEach(tag => {
        tag.style.display = enabled ? 'block' : 'none';
        console.log(`Apriltag visibility set to: ${tag.style.display}`); // Debug log
    });
};

// Function to update tag size
const updateTagSize = (size) => {
    const apriltags = document.querySelectorAll('.apriltag');
    apriltags.forEach(tag => {
        tag.style.width = `${size}px`;
        tag.style.height = `${size}px`;
    });
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'toggleGazeTracking') {
        gazeTrackingEnabled = message.enabled;
        toggleApriltags(gazeTrackingEnabled);
    } else if (message.command === 'toggleGazeLocation') {
        showGazeLocation = message.enabled;
        gazeCircle.style.display = showGazeLocation ? 'block' : 'none';
    } else if (message.command === 'updateTagSize') {
        tagSize = message.size;
        updateTagSize(tagSize);
    }
});

// Initialize apriltags
const injectApriltag = (filePath, position) => {
    const imgURL = chrome.runtime.getURL(filePath);
    const img = document.createElement("img");
    img.src = imgURL;
    img.width = tagSize;
    img.height = tagSize;
    img.className = 'apriltag';
    img.style.position = "fixed";
    img.style.zIndex = "9999";
    img.style.pointerEvents = "none";
    img.style.display = "none"; // Ensure initially hidden
    // Set position based on which corner is specified
    if (position === "top-left") {
        img.style.top = "0";
        img.style.left = "0";
    } else if (position === "top-right") {
        img.style.top = "0";
        img.style.right = "0";
    } else if (position === "bottom-left") {
        img.style.bottom = "0";
        img.style.left = "0";
    } else if (position === "bottom-right") {
        img.style.bottom = "0";
        img.style.right = "0";
    }
    document.body.appendChild(img);
};

injectApriltag("apriltags/tag36h11-0.svg", "top-left");
injectApriltag("apriltags/tag36h11-1.svg", "top-right");
injectApriltag("apriltags/tag36h11-2.svg", "bottom-right");
injectApriltag("apriltags/tag36h11-3.svg", "bottom-left");

////////////////////////////////
// Create the gaze circle
const gazeCircle = document.createElement("div");
gazeCircle.id = "gaze-circle";
gazeCircle.style.position = "absolute";
gazeCircle.style.width = "20px";
gazeCircle.style.height = "20px";
gazeCircle.style.backgroundColor = "blue";
gazeCircle.style.borderRadius = "50%";
gazeCircle.style.pointerEvents = "none";
gazeCircle.style.zIndex = "9999";
gazeCircle.style.display = "none";
document.body.appendChild(gazeCircle);

// Smoothing variables
let smoothedX = null;
let smoothedY = null;
const smoothingFactor = 0.8; // Adjust between 0.0 and 1.0 for desired smoothing

// Function to update gaze circle with smoothing
function updateGazeCircle(rawX, rawY) {
    rawX = rawX * window.innerWidth
    rawY = window.innerHeight - (rawY * window.innerHeight)

    if (smoothedX === null || smoothedY === null) {
        // Initialize smoothed values if not already set
        smoothedX = rawX;
        smoothedY = rawY;
    } else {
        // Apply smoothing
        smoothedX = smoothedX * smoothingFactor + rawX * (1.0 - smoothingFactor);
        smoothedY = smoothedY * smoothingFactor + rawY * (1.0 - smoothingFactor);
    }

    // Update the circle's position
    gazeCircle.style.left = `${smoothedX}px`;
    gazeCircle.style.top = `${smoothedY}px`;
    gazeCircle.style.display = "block"; // Show the circle
}

//////////////////////////////////////
// Establish a long-lived connection with the background script
const port = chrome.runtime.connect({ name: 'gazeTracking' });

port.onMessage.addListener((message) => {
    gazeCoords.x = message.gazeX;
    gazeCoords.y = message.gazeY;
    console.log('Received Gaze Coordinates:', gazeCoords);

    updateGazeCircle(gazeCoords.x , gazeCoords.y)


    const element = document.elementFromPoint(gazeCoords.x, gazeCoords.y);
    
    // Apply a bright blue border to the element being tracked
    element.style.border = '2px solid #00f';


});




function injectSvgToCorner(filePath, position) {
    // Get the full URL of the SVG file
    const imgURL = chrome.runtime.getURL(filePath);
    console.log(`Loading SVG from: ${imgURL}`);

    // Create an img element
    const img = document.createElement("img");
    img.src = imgURL; // Set the image source to the SVG URL
    img.width = 200; // Adjust width as needed
    img.height = 200; // Adjust height as needed

    // Set necessary styles
    img.style.position = "fixed";
    img.style.zIndex = "9999";
    img.style.pointerEvents = "none";

    // Set position based on which corner is specified
    if (position === "top-left") {
        img.style.top = "0";
        img.style.left = "0";
    } else if (position === "top-right") {
        img.style.top = "0";
        img.style.right = "0";
    } else if (position === "bottom-left") {
        img.style.bottom = "0";
        img.style.left = "0";
    } else if (position === "bottom-right") {
        img.style.bottom = "0";
        img.style.right = "0";
    }

    // // Append the img to the body
    // document.body.appendChild(img);

    // // Log to confirm that the element was appended successfully
    // console.log(`Injected SVG in ${position}`, img);
}
injectSvgToCorner("apriltags/tag36h11-0.svg", "top-left");
injectSvgToCorner("apriltags/tag36h11-1.svg", "top-right");
injectSvgToCorner("apriltags/tag36h11-2.svg", "bottom-right");
injectSvgToCorner("apriltags/tag36h11-3.svg", "bottom-left");

// Function to create and display the countdown overlay
const showCountdownOverlay = (callback) => {
    const overlay = document.createElement('div');
    overlay.id = 'countdown-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.color = 'white';
    overlay.style.fontSize = '48px';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';
    overlay.style.transition = 'opacity 0.3s ease'; // Add transition for smoother appearance
    document.body.appendChild(overlay);

    let countdown = 3;
    overlay.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown -= 1;
        if (countdown > 0) {
            overlay.textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            document.body.removeChild(overlay);
            callback();
        }
    }, 1000);
};

// Function to start tracking
const startTracking = () => {
    if (!isTracking) {
        showCountdownOverlay(() => {
            isTracking = true;
            trackedData = [];

            // Add event listener to track mouse movements
            document.addEventListener('mousemove', trackMouse);

            // If gaze tracking is enabled, start recording gaze data
            if (gazeTrackingEnabled) {
                port.onMessage.addListener(recordGazeData);
            }
        });
    }
};

// Function to continue tracking
const continueTracking = () => {
    console.log('Attempting to continue tracking');
    console.log('Current isTracking state:', isTracking); // Debugging log
    if (!isTracking) { // Ensure this condition is correct
        console.log('Showing countdown overlay for continue tracking');
        showCountdownOverlay(() => {
            isTracking = true;
            console.log('Tracking continued after countdown');

            // Add event listener to track mouse movements
            document.addEventListener('mousemove', trackMouse);

            // If gaze tracking is enabled, start recording gaze data
            if (gazeTrackingEnabled) {
                port.onMessage.addListener(recordGazeData);
            }
        });
    } else {
        console.log('Tracking is already active, no need to continue');
    }
};

// Function to stop tracking
const stopTracking = () => {
    if (isTracking) {
        isTracking = false;

        // Remove the event listener for mouse movements
        document.removeEventListener('mousemove', trackMouse);

        // If gaze tracking was enabled, stop recording gaze data
        if (gazeTrackingEnabled) {
            port.onMessage.removeListener(recordGazeData);
        }

        // Send tracked data to the background script for storage
        chrome.runtime.sendMessage({ command: 'updateTrackedData', data: trackedData });
    }
};

// Function to record gaze data
const recordGazeData = (message) => {
    if (gazeTrackingEnabled) {
        const gazeData = {
            x: message.gazeX,
            y: message.gazeY,
            timestamp: new Date().toISOString()
        };
        chrome.runtime.sendMessage({ command: 'recordGazeData', data: gazeData });
    }
};

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
        
        // Debug log
        console.log(elementData);

        // Apply a bright blue border to the element being tracked
        element.style.outline = '2px solid #00f';
        setTimeout(() => {
            element.style.outline = 'none';
        }, 1000);
        // Remove the border when the mouse leaves the element
        // element.addEventListener('mouseleave', () => {
        //     element.style.outline = 'none';
        // });
    }
};


// Initialize the content script by retrieving the tracking state from the background script
chrome.runtime.sendMessage({ command: 'getTrackingState' }, (response) => {
    if (response.isTracking) {
        startTracking();
    }
});

// Function to pause tracking
const pauseTracking = () => {
    if (isTracking) {
        isTracking = false;
        console.log('Tracking paused');

        // Remove the event listener for mouse movements
        document.removeEventListener('mousemove', trackMouse);

        // If gaze tracking was enabled, stop recording gaze data
        if (gazeTrackingEnabled) {
            port.onMessage.removeListener(recordGazeData);
        }
    }
};

// Listen for messages from the background script to start, stop, or pause tracking
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message.command);
    if (message.command === 'startTracking') {
        startTracking();
    } 
    else if (message.command === 'stopTracking') {
        stopTracking();
    }
    else if (message.command === 'pauseTracking') {
        pauseTracking();
    }
    else if (message.command === 'continueTracking') {
        continueTracking();
    }
    else if (message.command === 'updateGazeCoords') {
        gazeCoords.x = message.gazeX;
        gazeCoords.y = message.gazeY;
        console.log('Gaze Coordinates:', message.gazeX, message.gazeY);
        sendResponse({ status: "success" }); // Optionally respond
    }
});

