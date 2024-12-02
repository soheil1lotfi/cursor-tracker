// Object to store the tracking state, tracked data, and the current page URL
let trackingState = {
    isTracking: false, // Boolean to indicate if tracking is active
    trackedData: [], // Object to store tracked data for each URL
    currentPageUrl: '', // String to store the current page URL
    currentPageId: '' // String to store the current page URL
};

let ws = null;
let contentPort = null;

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
        trackingState.trackedData.push(...message.data);
        appendDataToCsv();
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
        trackingState.currentPageId = tab.id;
    });
});

// Handle incoming connections from content scripts
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'gazeTracking') {
        console.log('Content script connected via long-lived connection.');
        contentPort = port;

        // Handle messages from the content script if needed
        port.onMessage.addListener((message) => {
            console.log('Message received from content script:', message);
            // You can handle specific requests from the content script here
        });

        port.onDisconnect.addListener(() => {
            console.log('Content script disconnected.');
            contentPort = null;
        });
    }
});

function connectWebSocket() {
    ws = new WebSocket('ws://localhost:8765');
    ws.binaryType = 'arraybuffer';

    let gazeX = 0
    let gazeY = 0

    ws.onopen = () => {
        console.log('WebSocket connection established');
    };

    // Normal receiver
    // ws.onmessage = (event) => {
    //     const data = JSON.parse(event.data);
    //     gazeX = data.gazeX * 1000;
    //     gazeY = data.gazeY * 1000;
        
    //     // // Send gaze coordinates to all active content scripts
    //     // chrome.tabs.query({}, (tabs) => {
    //     //     for (let tab of tabs) {
    //     //         chrome.tabs.sendMessage(tab.id, { command: 'updateGazeCoords', gazeX, gazeY });
    //     //     }
    //     // });
    //     // console.log('Gaze Coordinates:', gazeX, gazeY);

    //   // Optionally, send message to the content script of the active tab
    //     chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {

    //     let activeTab = trackingState.currentPageId
    //     if (tabs.length) {
    //         chrome.tabs.sendMessage(activeTab, { command: 'updateGazeCoords', gazeX, gazeY }, (response) => {
    //             if (chrome.runtime.lastError) {
    //                 console.error("Error sending message:", chrome.runtime.lastError);
    //         } else {
    //             console.log("Message sent to content script:", response);
    //         }
    //     });
    //     console.log('Gaze Coordinates:', gazeX, gazeY);
    //     } else {
    //         console.log("No active tabs found");
    //     }
    // });
    
    // };


    // // Binray receiver
    // ws.onmessage = (event) => {
    //     const buffer = new DataView(event.data);
    //     gazeX = buffer.getInt16(0, true); // Pre-multiplied to screen coordinates
    //     gazeY = buffer.getInt16(2, true);
    
    //     console.log(`Screen Coordinates: ${gazeX}, ${gazeY}`);
    //   // Optionally, send message to the content script of the active tab
    //     chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {

    //     let activeTab = trackingState.currentPageId
    //     if (tabs.length) {
    //         chrome.tabs.sendMessage(activeTab, { command: 'updateGazeCoords', gazeX, gazeY }, (response) => {
    //             if (chrome.runtime.lastError) {
    //                 console.error("Error sending message:", chrome.runtime.lastError);
    //         } else {
    //             console.log("Message sent to content script:", response);
    //         }
    //     });
    //     } else {
    //         console.log("No active tabs found");
    //     }
    // });
    // };
    
    // On message long-lived port binary
    ws.onmessage = (event) => {
        const buffer = new DataView(event.data);
        // gazeX = buffer.getInt16(0, true); // Pre-multiplied to screen coordinates
        // gazeY = buffer.getInt16(2, true);
        gazeX = buffer.getFloat32(0, true);
        gazeY = buffer.getFloat32(4, true);


        console.log(`Screen Coordinates: X=${gazeX}, Y=${gazeY}`);

        // Send gaze data to content script via long-lived connection
        if (contentPort) {
            contentPort.postMessage({gazeX, gazeY});
        }
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

// Function to append tracked data to the CSV content in local storage
const appendDataToCsv = () => {
    const batchSize = 1000;
    if (trackingState.trackedData.length >= batchSize) {
        const batch = trackingState.trackedData.splice(0, batchSize);
        const newCsvContent = batch.map(data => 
            `${data[0]},"${data[1].replace(/"/g, '""')}","${data[2]}",${data[3]},${data[4]},${data[5]},${data[6]},${data[7]}`
        ).join('\n');

        // Retrieve existing CSV content from local storage
        chrome.storage.local.get({ csvData: '' }, (result) => {
            const existingCsvData = result.csvData;
            const updatedCsvData = existingCsvData + newCsvContent + '\n';
            
            // Save the updated CSV content back to local storage
            chrome.storage.local.set({ csvData: updatedCsvData }, () => {
                console.log('New batch appended to CSV in local storage');
            });
        });

        // Clear the trackedData array after saving the batch
        trackingState.trackedData = [];
    }
};


