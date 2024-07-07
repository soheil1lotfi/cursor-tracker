
// Object to store the tracking state, tracked data, and the current page URL
let trackingState = {
    isTracking: false, // Boolean to indicate if tracking is active
    trackedData: [], // Object to store tracked data for each URL
    currentPageUrl: '' // String to store the current page URL
};

// Function to toggle the tracking state
const toggleTracking = () => {
    trackingState.isTracking = !trackingState.isTracking;
    updateIcon();
};


const createIcon = (color) => {
    const canvas = new OffscreenCanvas(16, 16);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, 16, 16);
    context.fillStyle = color;
    context.fillRect(0, 0, 16, 16);
    return context.getImageData(0, 0, 16, 16);
};

// Failed try to load the icon from a file
// const updateIcon = () => {
//     const iconPath = trackingState.isTracking ? "icon_green.png" : "icon_red.png";
//     chrome.action.setIcon({  path: { 16: 'iconPath' } }, () => {
//         if (chrome.runtime.lastError) {
//             console.error(chrome.runtime.lastError.message);
//         }
//     });
// };

// Function to update the browser action icon
const updateIcon = () => {
    const iconColor = trackingState.isTracking ? '#00FF00' : '#FF0000'; // Green for tracking, Red for default
    const imageData = createIcon(iconColor);
    chrome.action.setIcon({ imageData: { 16: imageData } }, () => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
        }
    });
};


// Listen for messages from the content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'getTrackingState') {
        sendResponse(trackingState);
    } else if (message.command === 'updateTrackedData') {
        trackingState.trackedData.push(...message.data); // Add all elements to the list
        chrome.runtime.sendMessage({ command: 'updateTrackedDataAll', data: trackingState.trackedData });
    } else if (message.command === 'toggleTracking') {
        toggleTracking();
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, { command: trackingState.isTracking ? 'startTracking' : 'stopTracking' });
            });
        });
        chrome.runtime.sendMessage({ command: trackingState.isTracking ? 'trackingStarted' : 'trackingStopped' });
    } else if (message.command === 'getTrackedData') {
        sendResponse(trackingState.trackedData);
    } 
    // else if (message.command === 'getGazeCoords') {
    //     sendResponse([gazeX, gazeY]);
    // }
});




// Listen for tab changes to update the current page URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        trackingState.currentPageUrl = changeInfo.url;
    }
});

// Listen for tab activation to update the current page URL
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        trackingState.currentPageUrl = tab.url;
    });
});

function connectWebSocket() {
    const ws = new WebSocket('ws://localhost:8765');

    let gazeX = 0
    let gazeY = 0

    ws.onopen = () => {
        console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        gazeX = data.gazeX * 1000;
        gazeY = data.gazeY * 1000;
        
        // Send gaze coordinates to all active content scripts
        chrome.tabs.query({}, (tabs) => {
            for (let tab of tabs) {
                chrome.tabs.sendMessage(tab.id, { command: 'updateGazeCoords', gazeX, gazeY });
            }
        });
        console.log('Gaze Coordinates:', gazeX, gazeY);

    //   // Optionally, send message to the content script of the active tab
    //   chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    //     if (tabs.length > 0) {
    //       chrome.tabs.sendMessage(tabs[0].id, {gazeX: gazeX, gazeY: gazeY}, (response) => {
    //         if (chrome.runtime.lastError) {
    //           console.error("Error sending message:", chrome.runtime.lastError);
    //         } else {
    //           console.log("Message sent to content script:", response);
    //         }
    //       });
    //     } else {
    //       console.log("No active tabs found");
    //     }
    //   });
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed, retrying in 1 second');
      setTimeout(connectWebSocket, 1000); // Retry connection after 1 second
    };
}

  // Start the WebSocket connection
    connectWebSocket();


updateIcon();

