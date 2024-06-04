// Get references to the start and stop buttons
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
// Get reference to the textarea where tracked data will be displayed
const trackedDataTextarea = document.getElementById('trackedData');

// Function to update the visibility of the start and stop buttons based on the tracking state
const updateButtonStates = (trackingStarted) => {
    if (trackingStarted) {
        startButton.style.display = 'none'; // Hide the start button
        stopButton.style.display = 'inline-block'; // Show the stop button
    } else {
        startButton.style.display = 'inline-block'; // Show the start button
        stopButton.style.display = 'none'; // Hide the stop button
    }
};

// Add click event listeners to start and stop buttons to toggle tracking
startButton.addEventListener('click', () => {
    // Send a message to the background script to toggle tracking
    chrome.runtime.sendMessage({ command: 'toggleTracking' });
});

stopButton.addEventListener('click', () => {
    // Send a message to the background script to toggle tracking
    chrome.runtime.sendMessage({ command: 'toggleTracking' });
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'trackingStarted') {
        // Update the button states when tracking has started
        updateButtonStates(true);
    } else if (message.command === 'trackingStopped') {
        // Update the button states when tracking has stopped
        updateButtonStates(false);
    } else if (message.command === 'updateTrackedDataAll') {
        // Update the textarea with the tracked data
        trackedDataTextarea.value = JSON.stringify(message.data, null, 2); // Pretty print JSON
    }
});

// Initialize button states based on the current tracking state
chrome.runtime.sendMessage({ command: 'getTrackingState' }, (response) => {
    // Update the button states according to the current tracking state
    updateButtonStates(response.isTracking);
});
