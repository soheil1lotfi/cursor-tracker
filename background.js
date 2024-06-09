// Object to store the tracking state, tracked data, and the current page URL
let trackingState = {
    isTracking: false, // Boolean to indicate if tracking is active
    trackedData: [], // Object to store tracked data for each URL
    currentPageUrl: '' // String to store the current page URL
};

// Function to toggle the tracking state
const toggleTracking = () => {
    trackingState.isTracking = !trackingState.isTracking;
};

// // Listen for messages from the content script and popup
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     // Handle request to get the current tracking state
//     if (message.command === 'getTrackingState') {
//         sendResponse(trackingState);
//     }
//     // Handle request to update tracked data
//     else if (message.command === 'updateTrackedData') {
//         if (!trackingState.trackedData[trackingState.currentPageUrl]) {
//             trackingState.trackedData[trackingState.currentPageUrl] = [];
//         }
//         trackingState.trackedData[trackingState.currentPageUrl].push(message.data);
//         // Notify the popup with the updated tracked data
//         chrome.runtime.sendMessage({ command: 'updateTrackedDataAll', data: trackingState.trackedData });
//     }
//     // Handle request to toggle tracking state
//     else if (message.command === 'toggleTracking') {
//         toggleTracking();
//         // Notify all tabs about the tracking state change
//         chrome.tabs.query({}, (tabs) => {
//             tabs.forEach((tab) => {
//                 chrome.tabs.sendMessage(tab.id, { command: trackingState.isTracking ? 'startTracking' : 'stopTracking' });
//             });
//         });
//         // Notify the popup that tracking has started/stopped
//         chrome.runtime.sendMessage({ command: trackingState.isTracking ? 'trackingStarted' : 'trackingStopped' });
//     } else if (message.command === 'getTrackedData') {
//         sendResponse(trackingState.trackedData);
//     }
// });







// Listen for messages from the content script and popup
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.command === 'getTrackingState') {
//         console.log(trackingState)
//         sendResponse(trackingState);
//     } else if (message.command === 'updateTrackedData') {
//         if (!trackingState.trackedData[trackingState.currentPageUrl]) {
//             trackingState.trackedData[trackingState.currentPageUrl] = [];
//         }
//         trackingState.trackedData[trackingState.currentPageUrl].push(...message.data); // Use spread operator to add all elements
//         console.log(trackingState)

//         chrome.runtime.sendMessage({ command: 'updateTrackedDataAll', data: trackingState.trackedData });
//     } else if (message.command === 'toggleTracking') {
//         toggleTracking();
//         chrome.tabs.query({}, (tabs) => {
//             tabs.forEach((tab) => {
//                 chrome.tabs.sendMessage(tab.id, { command: trackingState.isTracking ? 'startTracking' : 'stopTracking' });
//             });
//         });
//         chrome.runtime.sendMessage({ command: trackingState.isTracking ? 'trackingStarted' : 'trackingStopped' });
//     } else if (message.command === 'getTrackedData') {
//         console.log(trackingState)
//         sendResponse(trackingState);
//     }
// });



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





