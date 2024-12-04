const startPauseButton = document.getElementById('startPauseButton');
const stopButton = document.getElementById('stopButton');
const gazeTrackingToggle = document.getElementById('gazeTrackingToggle');
const showGazeLocationToggle = document.getElementById('showGazeLocationToggle');
const tagSizeInput = document.getElementById('tagSizeInput');
const downloadCsvButton = document.getElementById('downloadCsvButton');
const downloadGazeCsvButton = document.getElementById('downloadGazeCsvButton');

let isTracking = false;
let isPaused = false;

// Add this near the beginning of your file, with other event listeners
document.getElementById('tagSizeInput').addEventListener('input', function() {
    document.getElementById('tagSizeValue').textContent = this.value;
});

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
        // Clear the tracked data from local storage after download
        chrome.runtime.sendMessage({ command: 'clearTrackedData' }, () => {
            console.log('Tracked data cleared from local storage');
        });
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
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'saveTrackingState' }, (response) => {
            console.log('Response from content script:', response);
            
            // Get data from storage
            chrome.storage.local.get(['trackedData'], (result) => {
                console.log('Data from storage:', result.trackedData);
                
                const data = result.trackedData || [];
                if (data.length === 0) {
                    console.log('No data to download');
                    return;
                }

                // Create CSV header
                let csvRows = [];
                csvRows.push(['URL', 'Element', 'Element Class', 'Element ID', 'Page X', 'Page Y', 'Gaze X', 'Gaze Y', 'Time Stamp', 'Clicked']);

                // Process each row of data
                data.forEach(row => {
                    console.log('Processing row:', row);
                    csvRows.push([
                        row[0] || '',  // URL
                        row[1] ? `"${row[1].replace(/"/g, '""')}"` : '', // Element HTML
                        row[2] || '',  // Element Class
                        row[3] || '',  // Element ID
                        row[4] || '',  // Page X
                        row[5] || '',  // Page Y
                        row[6] || '',  // Gaze X
                        row[7] || '',  // Gaze Y
                        row[8] || '',  // Timestamp
                        row[9] ? 'true' : 'false'  // Clicked
                    ]);
                });

                console.log('Processed rows:', csvRows);

                // Convert to CSV string
                const csvContent = csvRows.map(row => row.join(',')).join('\n');
                console.log('CSV Content:', csvContent);

                // Create and trigger download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `tracked_data_${new Date().toISOString().replace(/:/g, '-')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                // Clear the tracked data after successful download
                chrome.storage.local.set({ trackedData: [] }, () => {
                    console.log('Tracked data cleared after download');
                });
            });
        });
    });
});

// Add click event listener to download gaze CSV button
downloadGazeCsvButton.addEventListener('click', () => {
    console.log('Download Gaze CSV button clicked');
    chrome.runtime.sendMessage({ command: 'downloadGazeCsv' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
        } else {
            console.log("Message sent to background script:", response);
        }
    });
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
