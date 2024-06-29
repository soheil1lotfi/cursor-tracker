const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const trackedDataTextarea = document.getElementById('trackedData');
const exportButton = document.getElementById('exportButton');


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


// Add click event listener to export button
exportButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'getTrackedData' }, (response) => {
        let csvContent = "data:text/csv;charset=utf-8,URL,Element,Element Class,Element ID,Page X,Page Y\n";
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
