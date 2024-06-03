let trackingState = {
    isTracking: false,
    trackedData: [],
    currentPageUrl: ''
};

// Function to toggle tracking state
const toggleTracking = () => {
    trackingState.isTracking = !trackingState.isTracking;
};

// Listen for messages from the content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'getTrackingState') {
        sendResponse(trackingState);
    } else if (message.command === 'updateTrackedData') {
        trackingState.trackedData.push({ url: trackingState.currentPageUrl, data: message.data });
        chrome.runtime.sendMessage({ command: 'updateTrackedDataAll', data: trackingState.trackedData });

    } else if (message.command === 'toggleTracking') {
        toggleTracking();
        // Notify all tabs about the tracking state change
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, { command: trackingState.isTracking ? 'startTracking' : 'stopTracking' });
            });
        });
        // Notify the popup that tracking has started/stopped
        chrome.runtime.sendMessage({ command: trackingState.isTracking ? 'trackingStarted' : 'trackingStopped' });
    }
});

// Listen for tab changes to update the current page URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        trackingState.currentPageUrl = changeInfo.url;
    }
});













// let trackingState = {
//     isTracking: false,
//     trackedData: {},
//     currentPageUrl: ''
// };

// // Function to toggle tracking state
// const toggleTracking = () => {
//     trackingState.isTracking = !trackingState.isTracking;
// };

// // Listen for messages from the content script and popup
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.command === 'getTrackingState') {
//         sendResponse(trackingState);
//     } else if (message.command === 'updateTrackedData') {
//         if (!trackingState.trackedData[trackingState.currentPageUrl]) {
//             trackingState.trackedData[trackingState.currentPageUrl] = [];
//         }
//         trackingState.trackedData[trackingState.currentPageUrl].push(message.data);
//     } else if (message.command === 'toggleTracking') {
//         toggleTracking();
//         // Notify all tabs about the tracking state change
//         chrome.tabs.query({}, (tabs) => {
//             tabs.forEach((tab) => {
//                 chrome.tabs.sendMessage(tab.id, { command: trackingState.isTracking ? 'startTracking' : 'stopTracking' });
//             });
//         });
//         // Notify the popup that tracking has started/stopped
//         chrome.runtime.sendMessage({ command: trackingState.isTracking ? 'trackingStarted' : 'trackingStopped' });
//     }
// });

// // Listen for tab changes to update the current page URL
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.url) {
//         trackingState.currentPageUrl = changeInfo.url;
//     }
// });

// // Listen for tab activation to update the current page URL
// chrome.tabs.onActivated.addListener((activeInfo) => {
//     chrome.tabs.get(activeInfo.tabId, (tab) => {
//         trackingState.currentPageUrl = tab.url;
//     });
// });
