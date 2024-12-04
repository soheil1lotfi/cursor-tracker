import sys
import json
import asyncio
import websockets
import threading

from pupil_labs.realtime_api.simple import discover_one_device, Device
from pupil_labs.real_time_screen_gaze.gaze_mapper import GazeMapper

from PySide6.QtCore import *
from PySide6.QtGui import *
from PySide6.QtWidgets import *

import pyautogui

from .ui import TagWindow
from .dwell_detector import DwellDetector


import struct

pyautogui.FAILSAFE = False


class PupilPointerApp(QApplication):
    def __init__(self):
        super().__init__()

        self.setApplicationDisplayName("Pupil Pointer")
        self.mouseEnabled = False

        self.tagWindow = TagWindow()

        self.device = None
        self.dwellDetector = DwellDetector(0.75, 75)
        self.smoothing = 0.8

        self.tagWindow.surfaceChanged.connect(self.onSurfaceChanged)

        self.tagWindow.dwellTimeChanged.connect(self.dwellDetector.setDuration)
        self.tagWindow.dwellRadiusChanged.connect(self.dwellDetector.setRange)
        self.tagWindow.mouseEnableChanged.connect(self.setMouseEnabled)
        self.tagWindow.smoothingChanged.connect(self.setSmoothing)

        self.pollTimer = QTimer()
        self.pollTimer.setInterval(1000 / 30)
        self.pollTimer.timeout.connect(self.poll)

        self.surface = None
        self.firstPoll = True

        self.mousePosition = None
        self.gazeMapper = None

        self.websocket_clients = set()
        self.websocket_loop = None
        self.websocket_thread = threading.Thread(target=self.run_websocket_server)
        self.websocket_thread.start()

    def onSurfaceChanged(self):
        self.updateSurface()

    def start(self):
        self.device = discover_one_device(max_search_duration_seconds=0.25)
        if self.device is None:
            QTimer.singleShot(1000, self.start)
            return
        # ip = "192.168.192.161"
        # self.device = Device(address=ip, port="8080")
        # if self.device is None:
        #     QTimer.singleShot(1000, self.start)
        #     return

        calibration = self.device.get_calibration()
        self.gazeMapper = GazeMapper(calibration)

        self.tagWindow.setStatus(f"Connected to {self.device}. One moment...")

        self.updateSurface()
        self.pollTimer.start()
        self.firstPoll = True

    # def updateSurface(self):
    #     if self.gazeMapper is None:
    #         return

    #     self.gazeMapper.clear_surfaces()
    #     self.surface = self.gazeMapper.add_surface(
    #         self.tagWindow.getMarkerVerts(), self.tagWindow.getSurfaceSize()
    #     )

    def updateSurface(self):
        if self.gazeMapper is None:
            return

        self.gazeMapper.clear_surfaces()

        # Get marker and surface vertices
        markers_verts, surface_verts = self.tagWindow.getMarkerVerts()

        # Pass the correct argument for markers_verts to add_surface
        self.surface = self.gazeMapper.add_surface(markers_verts, self.tagWindow.getSurfaceSize())



    def setMouseEnabled(self, enabled):
        self.mouseEnabled = enabled

    def setSmoothing(self, value):
        self.smoothing = value

    def poll(self):
        frameAndGaze = self.device.receive_matched_scene_video_frame_and_gaze(
            timeout_seconds=1 / 15
        )

        if frameAndGaze is None:
            return

        else:
            self.tagWindow.setStatus(f"Streaming data from {self.device}")
            self.firstPoll = False

        frame, gaze = frameAndGaze
        result = self.gazeMapper.process_frame(frame, gaze)

        markerIds = [int(marker.uid.split(":")[-1]) for marker in result.markers]
        self.tagWindow.showMarkerFeedback(markerIds)

        if self.surface.uid in result.mapped_gaze:
            for surface_gaze in result.mapped_gaze[self.surface.uid]:
                if self.mousePosition is None:
                    self.mousePosition = [surface_gaze.x, surface_gaze.y]
                else:
                    self.mousePosition[0] = self.mousePosition[
                        0
                    ] * self.smoothing + surface_gaze.x * (1.0 - self.smoothing)
                    self.mousePosition[1] = self.mousePosition[
                        1
                    ] * self.smoothing + surface_gaze.y * (1.0 - self.smoothing)

                mousePoint = self.tagWindow.updatePoint(*self.mousePosition)

                changed, dwell, dwellPosition = self.dwellDetector.addPoint(
                    mousePoint.x(), mousePoint.y(), gaze.timestamp_unix_seconds
                )
                if changed and dwell:
                    self.tagWindow.setClicked(True)
                    if self.mouseEnabled:
                        pyautogui.click(x=dwellPosition[0], y=dwellPosition[1])
                else:
                    self.tagWindow.setClicked(False)

                if self.mouseEnabled:
                    QCursor().setPos(mousePoint)

                asyncio.run_coroutine_threadsafe(
                    self.send_gaze_coordinates(surface_gaze.x, surface_gaze.y),
                    self.websocket_loop,
                )
    async def websocket_handler(self, websocket):
        self.websocket_clients.add(websocket)
        try:
            async for message in websocket:
                pass
        finally:
            self.websocket_clients.remove(websocket)

    # def run_websocket_server(self):
    #     loop = asyncio.new_event_loop()
    #     asyncio.set_event_loop(loop)
    #     self.websocket_loop = loop
    #     start_server = websockets.serve(self.websocket_handler, "localhost", 8765)
    #     print("WebSocket server started on ws://localhost:8765")
    #     loop.run_until_complete(start_server)
    #     loop.run_forever()

    #new one to try
    def run_websocket_server(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        self.websocket_loop = loop

        async def server():
            async with websockets.serve(self.websocket_handler, "localhost", 8765):
                print("WebSocket server started on ws://localhost:8765")
                await asyncio.Future()  # Run forever

        loop.run_until_complete(server())



    # Normal sending function
    # async def send_gaze_coordinates(self, gaze_x, gaze_y):
    #     message = json.dumps({"gazeX": gaze_x, "gazeY": gaze_y})
    #     print(gaze_x, gaze_y)
    #     if self.websocket_clients:
    #         await asyncio.wait(
    #             [
    #                 asyncio.create_task(client.send(message))
    #                 for client in self.websocket_clients
    #             ]
    #         )
    #     else:
    #         print("No WebSocket clients connected")



    # Binary sending function
    async def send_gaze_coordinates(self, gaze_x, gaze_y):

        print(f'String: {gaze_x}, {gaze_y}')

        # Pack the integers into a binary format (two int16 values)
        binary_message = struct.pack('ff', gaze_x, gaze_y)

        if self.websocket_clients:
            await asyncio.wait(
                [
                    asyncio.create_task(client.send(binary_message))
                    for client in self.websocket_clients
                ]
            )
        else:
            print("No WebSocket clients connected")


    def exec(self):
        self.tagWindow.setStatus("Looking for a device...")
        self.tagWindow.showMaximized()
        QTimer.singleShot(1000, self.start)
        super().exec()
        if self.device is not None:
            self.device.close()
        if self.websocket_loop is not None:
            self.websocket_loop.call_soon_threadsafe(self.websocket_loop.stop)


def run():
    app = PupilPointerApp()
    app.exec()

