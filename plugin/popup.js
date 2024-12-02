const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const trackedDataTextarea = document.getElementById('trackedData');
const exportButton = document.getElementById('exportButton');
const downloadCsvButton = document.getElementById('downloadCsvButton');
const gazeTrackingToggle = document.getElementById('gazeTrackingToggle');
const showGazeLocationToggle = document.getElementById('showGazeLocationToggle');
const tagSizeInput = document.getElementById('tagSizeInput');
const downloadGazeCsvButton = document.getElementById('downloadGazeCsvButton');

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

// Function to update the visibility of additional options based on the gaze tracking toggle
gazeTrackingToggle.addEventListener('change', () => {
    const isChecked = gazeTrackingToggle.checked;
    chrome.storage.local.set({ gazeTrackingEnabled: isChecked }, () => {
        console.log(`Gaze Tracking set to: ${isChecked}`);
    });
    document.getElementById('showGazeLocationContainer').style.display = isChecked ? 'block' : 'none';
    document.getElementById('tagSizeContainer').style.display = isChecked ? 'block' : 'none';

    // Send message to content script to show/hide apriltags
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'toggleGazeTracking', enabled: isChecked });
    });
});

// Function to handle the show gaze location toggle
showGazeLocationToggle.addEventListener('change', () => {
    const isChecked = showGazeLocationToggle.checked;
    chrome.storage.local.set({ showGazeLocationEnabled: isChecked }, () => {
        console.log(`Show Gaze Location set to: ${isChecked}`);
    });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'toggleGazeLocation', enabled: isChecked });
    });
});

// Function to handle tag size input change
tagSizeInput.addEventListener('input', () => {
    const size = parseInt(tagSizeInput.value, 10);
    chrome.storage.local.set({ tagSize: size }, () => {
        console.log(`Tag Size set to: ${size}`);
    });
    console.log(`Sending tag size: ${size}`);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'updateTagSize', size: size });
    });
});

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
    } else if (message.command === 'updateTagSize') {
        console.log(`Received tag size: ${message.size}`); // Debug log
        updateTagSize(message.size);
    }
});


// Add click event listener to export button
exportButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'getTrackedData' }, (response) => {
        let csvContent = "data:text/csv;charset=utf-8,URL,Element,Element Class,Element ID,Page X,Page Y,Time Stamp, Clicked\n";
        response.forEach(data => {
            const row = `${data[0]},"${data[1].replace(/"/g, '""')}","${data[2]}",${data[3]},${data[4]},${data[5]},${data[6]},${data[7]}\n`;
            csvContent += row;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tracked_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});


// Initialize button states based on the current tracking state
chrome.runtime.sendMessage({ command: 'getTrackingState' }, (response) => {
    // Update the button states according to the current tracking state
    updateButtonStates(response.isTracking);
    chrome.runtime.sendMessage({ command: 'getTrackedData' }, (trackedData) => {
        trackedDataTextarea.value = JSON.stringify(trackedData, null, 2); // Pretty print JSON
    });
});

const updateTagSize = (size) => {
    const apriltags = document.querySelectorAll('.apriltag');
    console.log(`Updating ${apriltags.length} apriltags to size: ${size}`); // Debug log
    apriltags.forEach(tag => {
        tag.style.width = `${size}px`;
        tag.style.height = `${size}px`;
    });
};

// Restore the toggle state
chrome.storage.local.get(['gazeTrackingEnabled', 'showGazeLocationEnabled', 'tagSize'], (result) => {
    const gazeTrackingEnabled = result.gazeTrackingEnabled || false;
    const showGazeLocationEnabled = result.showGazeLocationEnabled || false;
    const tagSize = result.tagSize || 200;

    gazeTrackingToggle.checked = gazeTrackingEnabled;
    showGazeLocationToggle.checked = showGazeLocationEnabled;
    tagSizeInput.value = tagSize;

    document.getElementById('showGazeLocationContainer').style.display = gazeTrackingEnabled ? 'block' : 'none';
    document.getElementById('tagSizeContainer').style.display = gazeTrackingEnabled ? 'block' : 'none';
});

// Add click event listener to download gaze CSV button
downloadGazeCsvButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'downloadGazeCsv' });
});
