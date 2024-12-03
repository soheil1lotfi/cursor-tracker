const startPauseButton = document.getElementById('startPauseButton');
const stopButton = document.getElementById('stopButton');
const gazeTrackingToggle = document.getElementById('gazeTrackingToggle');
const showGazeLocationToggle = document.getElementById('showGazeLocationToggle');
const tagSizeInput = document.getElementById('tagSizeInput');
const downloadCsvButton = document.getElementById('downloadCsvButton');
const downloadGazeCsvButton = document.getElementById('downloadGazeCsvButton');

let isTracking = false;
let isPaused = false;

// Function to update the start/pause button text
const updateStartPauseButton = () => {
    if (isTracking) {
        startPauseButton.textContent = isPaused ? 'Continue Tracking' : 'Pause Tracking';
    } else {
        startPauseButton.textContent = 'Start Tracking';
    }
};

// Function to handle start/pause/continue logic
startPauseButton.addEventListener('click', () => {
    if (!isTracking) {
        // Start tracking
        isTracking = true;
        isPaused = false;
        console.log('Sending startTracking command');
        chrome.runtime.sendMessage({ command: 'startTracking' });
    } else if (isPaused) {
        // Continue tracking
        isPaused = false;
        console.log('Sending continueTracking command');
        chrome.runtime.sendMessage({ command: 'continueTracking' });
    } else {
        // Pause tracking
        isPaused = true;
        console.log('Sending pauseTracking command');
        chrome.runtime.sendMessage({ command: 'pauseTracking' });
    }
    updateStartPauseButton();
});

// Function to handle stop logic
stopButton.addEventListener('click', () => {
    if (isTracking) {
        isTracking = false;
        isPaused = false;
        chrome.runtime.sendMessage({ command: 'stopTracking' });
        updateStartPauseButton();
    }
});

// Add click event listener to download CSV button
downloadCsvButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'getTrackedData' }, (response) => {
        let csvContent = "data:text/csv;charset=utf-8,URL,Element,Element Class,Element ID,Page X,Page Y, Gaze X, Gaze Y, Time Stamp, Clicked\n";
        console.log(response.length);
        response.forEach(data => {
            const row = `${data[0]},"${data[1].replace(/"/g, '""')}","${data[2]}",${data[3]},${data[4]},${data[5]},${data[6]},${data[7]},${data[8]},${data[9]}\n`;
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

// Add click event listener to download gaze CSV button
downloadGazeCsvButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'downloadGazeCsv' });
});

// Initialize button states based on the current tracking state
chrome.runtime.sendMessage({ command: 'getTrackingState' }, (response) => {
    isTracking = response.isTracking;
    isPaused = false; // Assume not paused on initial load
    updateStartPauseButton();
});

const updateTagSize = (size) => {
    const apriltags = document.querySelectorAll('.apriltag');
    console.log(`Updating ${apriltags.length} apriltags to size: ${size}`); // Debug log
    apriltags.forEach(tag => {
        tag.style.width = `${size}px`;
        tag.style.height = `${size}px`;
    });
};

// Function to handle the gaze tracking toggle
gazeTrackingToggle.addEventListener('change', () => {
    const isChecked = gazeTrackingToggle.checked;
    chrome.storage.local.set({ gazeTrackingEnabled: isChecked }, () => {
        console.log(`Gaze Tracking set to: ${isChecked}`);
    });

    // Update the visibility of the additional options
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
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'updateTagSize', size: size });
    });
});

// Restore the toggle state
chrome.storage.local.get(['gazeTrackingEnabled', 'showGazeLocationEnabled', 'tagSize'], (result) => {
    const gazeTrackingEnabled = result.gazeTrackingEnabled || false;
    const showGazeLocationEnabled = result.showGazeLocationEnabled || false;
    const tagSize = result.tagSize || 200;

    gazeTrackingToggle.checked = gazeTrackingEnabled;
    showGazeLocationToggle.checked = showGazeLocationEnabled;
    tagSizeInput.value = tagSize;

    // Ensure the visibility of the additional options is set correctly on load
    document.getElementById('showGazeLocationContainer').style.display = gazeTrackingEnabled ? 'block' : 'none';
    document.getElementById('tagSizeContainer').style.display = gazeTrackingEnabled ? 'block' : 'none';
});
