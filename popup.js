// Get references to the start and stop buttons
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const trackedDataTextarea = document.getElementById('trackedData');

// Function to update button states
const updateButtonStates = (trackingStarted) => {
    if (trackingStarted) {
        startButton.style.display = 'none';
        stopButton.style.display = 'inline-block';
    } else {
        startButton.style.display = 'inline-block';
        stopButton.style.display = 'none';
    }
};

// Add click event listeners to start and stop buttons
startButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'toggleTracking' });
});

stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'toggleTracking' });
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'trackingStarted') {
        updateButtonStates(true);
    } else if (message.command === 'trackingStopped') {
        updateButtonStates(false);
    } else if (message.command === 'updateTrackedDataAll') {
        trackedDataTextarea.value = JSON.stringify(message.data);
    }
});

// Initialize button states
chrome.runtime.sendMessage({ command: 'getTrackingState' }, (response) => {
    updateButtonStates(response.isTracking);
});
