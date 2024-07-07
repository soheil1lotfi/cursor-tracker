# DOM Tracker
## Tracking DOM elements using cursor coordinates and gaze coordinates obtained from Pupil Neon Eyetracking glasses.
### Introduction
This repo is the first attempt to track DOM elements of a webpage using the coordinates of a cursor provided by the Chrome API and the gaze coordinates of humans utilizing the [Neon Eyetracking glass](https://docs.pupil-labs.com/neon/) from [Pupil Labs](https://pupil-labs.com/) using Pupil Labs [real-time-api](https://github.com/pupil-labs/realtime-python-api). Neon glasses can capture the gaze coordinates of eyes in the coordinate system of the scene-camera (front viewing camera) of the Neon. For more information about Neon check the [documentation](https://docs.pupil-labs.com/neon/).

For capturing a subarea of this scene-camera, which in this case is a web browser viewpoint, has to be detected and the gaze coordinates have to be mapped to coordinates in the coordinate system of that subarea. 
To detect this subarea (surface) [AprilTags](https://april.eecs.umich.edu/software/apriltag) can be used.
Using the detected surface, the coordinates can be mapped into the new coordinate system of the surface using [Homography](https://en.m.wikipedia.org/wiki/Homography_(computer_vision)) approach as in [Marker Mapper](https://docs.pupil-labs.com/neon/pupil-cloud/enrichments/marker-mapper/) which is a post-hoc solution. 

For doing this in real time (as our plugin needs to be), we have used  [Real-time Screen Gaze](https://github.com/pupil-labs/real-time-screen-gaze) package that handles this heavy lifting in real time. Also, we have used [gaze-controlled-cursor-demo](https://github.com/pupil-labs/gaze-controlled-cursor-demo) package with some modification to fit to out application.

### Purpos
The purpose of this project is to track which DOM elements has the user looked at and had their cursor on for a specified time period (e.g 100ms).

### How it works
This project has two seperate parts that are attached under the hood with websockets to transer data between them:
* A Chrome extension folder
* A python package


### How to use
To setup the chrome extension you follow the following steps:
1. Open Chrome Extensions Page (or search chrome://extensions/ in the search bar of your Chrome browser)
2. Toggle the "Developer mode" switch on in the upper right corner of the screen (as of June 2024).
3. Load Unpacked Extension: Click "Load unpacked" and select the folder containing your unpacked extension files.
4. Pin it from the puzzle piece icon in your Chrome toolbar.

To setup the glasses you need to follow these steps:

1. Install dependences
```python
pip install -r requirements.txt
```
2. run the followin in a terminal directed to the package
```python
python3 -m gaze_controlled_cursor_demo
```
After doing this a window like the following will pop up.


In this window you have the adjust the size of the april tags, their brightness and the size and position of the window itself. Additionally, you have the information on wether the Neon is connected you the app or not. 

Now, you would need to simply connect the Neon to its smartphone and go to the companion app. After a bit, the window with the adjustable metrics on you computer will detect the glass and that is when you have to align the window with the markers on it with you browser viewpoint. It should look something like the followin image:

*Make sure they are alingned correctly for accurate recording. *
*This part is subject to change to an easier approach in the next update*

### Start recording
You can now start recording on your plugin. After you are done with the tracking session, you can export the data in csv.


For any inquirement you can email me at soheil.lotfi@ip-paris.fr
