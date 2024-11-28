# import sys

# from PySide6.QtCore import *
# from PySide6.QtGui import *
# from PySide6.QtWidgets import *

# from pupil_labs.real_time_screen_gaze import marker_generator


# def createMarker(marker_id):
#     marker = marker_generator.generate_marker(marker_id, flip_x=True, flip_y=True)

#     image = QImage(10, 10, QImage.Format_Mono)
#     image.fill(1)
#     for y in range(marker.shape[0]):
#         for x in range(marker.shape[1]):
#             color = marker[y][x] // 255
#             image.setPixel(x + 1, y + 1, color)

#     # Convert the QImage to a QPixmap
#     return QPixmap.fromImage(image)


# def pointToTuple(qpoint):
#     return (qpoint.x(), qpoint.y())


# class TagWindow(QWidget):
#     surfaceChanged = Signal()
#     mouseEnableChanged = Signal(bool)
#     dwellRadiusChanged = Signal(int)
#     dwellTimeChanged = Signal(float)
#     smoothingChanged = Signal(float)

#     def __init__(self):
#         super().__init__()

#         self.setStyleSheet("* { font-size: 18pt }")

#         self.markerIDs = []
#         self.pixmaps = []
#         for markerID in range(4):
#             self.markerIDs.append(markerID)
#             self.pixmaps.append(createMarker(markerID))

#         self.point = (0, 0)
#         self.clicked = False
#         self.settingsVisible = True
#         self.visibleMarkerIds = []

#         self.form = QWidget()
#         self.form.setLayout(QFormLayout())

#         self.tagSizeInput = QSpinBox()
#         self.tagSizeInput.setRange(10, 512)
#         self.tagSizeInput.setValue(256)
#         self.tagSizeInput.valueChanged.connect(self.onTagSizeChanged)

#         self.tagBrightnessInput = QSpinBox()
#         self.tagBrightnessInput.setRange(0, 255)
#         self.tagBrightnessInput.setValue(128)
#         self.tagBrightnessInput.valueChanged.connect(lambda _: self.repaint())

#         self.smoothingInput = QDoubleSpinBox()
#         self.smoothingInput.setRange(0, 1.0)
#         self.smoothingInput.setValue(0.8)
#         self.smoothingInput.valueChanged.connect(self.smoothingChanged.emit)

#         self.dwellRadiusInput = QSpinBox()
#         self.dwellRadiusInput.setRange(0, 512)
#         self.dwellRadiusInput.setValue(25)
#         self.dwellRadiusInput.valueChanged.connect(self.dwellRadiusChanged.emit)

#         self.dwellTimeInput = QDoubleSpinBox()
#         self.dwellTimeInput.setRange(0, 20)
#         self.dwellTimeInput.setValue(0.75)
#         self.dwellTimeInput.valueChanged.connect(self.dwellTimeChanged.emit)

#         self.mouseEnabledInput = QCheckBox("Mouse Control")
#         self.mouseEnabledInput.setChecked(False)
#         self.mouseEnabledInput.toggled.connect(self.mouseEnableChanged.emit)

#         self.form.layout().addRow("Tag Size", self.tagSizeInput)
#         self.form.layout().addRow("Tag Brightness", self.tagBrightnessInput)
#         self.form.layout().addRow("Smoothing", self.smoothingInput)
#         self.form.layout().addRow("Dwell Radius", self.dwellRadiusInput)
#         self.form.layout().addRow("Dwell Time", self.dwellTimeInput)
#         self.form.layout().addRow("", self.mouseEnabledInput)

#         self.instructionsLabel = QLabel(
#             "Right-click one of the tags to toggle settings view."
#         )
#         self.instructionsLabel.setAlignment(Qt.AlignHCenter)

#         self.statusLabel = QLabel()
#         self.statusLabel.setAlignment(Qt.AlignHCenter)

#         self.setLayout(QGridLayout())
#         self.layout().setSpacing(50)

#         self.layout().addWidget(self.instructionsLabel, 0, 0, 1, 3)
#         self.layout().addItem(
#             QSpacerItem(20, 40, QSizePolicy.Minimum, QSizePolicy.Expanding), 1, 1, 1, 1
#         )
#         self.layout().addItem(
#             QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum), 2, 0, 1, 1
#         )
#         self.layout().addItem(
#             QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum), 2, 2, 1, 1
#         )
#         self.layout().addWidget(self.form, 3, 1, 1, 1)
#         self.layout().addItem(
#             QSpacerItem(20, 40, QSizePolicy.Minimum, QSizePolicy.Expanding), 4, 1, 1, 1
#         )
#         self.layout().addWidget(self.statusLabel, 5, 0, 1, 3)

#     def mouseReleaseEvent(self, event):
#         if event.button() == Qt.RightButton:
#             self.setSettingsVisible(not self.settingsVisible)

#     def setSettingsVisible(self, visible):
#         self.settingsVisible = visible

#         if sys.platform.startswith("darwin"):
#             self.hide()
#             self.setWindowFlag(Qt.FramelessWindowHint, not visible)
#             self.setWindowFlag(Qt.WindowStaysOnTopHint, not visible)
#             self.setAttribute(Qt.WA_TranslucentBackground, not visible)

#             if visible:
#                 self.show()
#             else:
#                 self.showMaximized()

#         self.updateMask()

#     def setStatus(self, status):
#         self.statusLabel.setText(status)

#     def setClicked(self, clicked):
#         self.clicked = clicked
#         self.repaint()

#     def updatePoint(self, norm_x, norm_y):
#         tagMargin = 0.1 * self.tagSizeInput.value()
#         surfaceSize = (
#             self.width() - 2 * tagMargin,
#             self.height() - 2 * tagMargin,
#         )

#         self.point = (
#             norm_x * surfaceSize[0] + tagMargin,
#             (surfaceSize[1] - norm_y * surfaceSize[1]) + tagMargin,
#         )

#         self.repaint()
#         return self.mapToGlobal(QPoint(*self.point))

#     def showMarkerFeedback(self, markerIds):
#         self.visibleMarkerIds = markerIds
#         self.repaint()

#     def paintEvent(self, event):
#         painter = QPainter(self)

#         if self.settingsVisible:
#             if self.clicked:
#                 painter.setBrush(Qt.red)
#             else:
#                 painter.setBrush(Qt.white)

#             painter.drawEllipse(
#                 QPoint(*self.point),
#                 self.dwellRadiusInput.value(),
#                 self.dwellRadiusInput.value(),
#             )

#         for cornerIdx in range(4):
#             cornerRect = self.getCornerRect(cornerIdx)
#             if cornerIdx not in self.visibleMarkerIds:
#                 painter.fillRect(
#                     cornerRect.marginsAdded(QMargins(5, 5, 5, 5)), QColor(255, 0, 0)
#                 )

#             painter.drawPixmap(cornerRect, self.pixmaps[cornerIdx])
#             painter.fillRect(
#                 cornerRect, QColor(0, 0, 0, 255 - self.tagBrightnessInput.value())
#             )

#     def resizeEvent(self, event):
#         self.updateMask()
#         self.surfaceChanged.emit()

#     def onTagSizeChanged(self, value):
#         self.repaint()
#         self.surfaceChanged.emit()

#     def getMarkerSize(self):
#         return self.tagSizeInput.value()

#     def getTagPadding(self):
#         return self.getMarkerSize() / 8

#     def getMarkerVerts(self):
#         tagPadding = self.getTagPadding()
#         markers_verts = {}

#         for cornerIdx, markerID in enumerate(self.markerIDs):
#             rect = self.getCornerRect(cornerIdx) - QMargins(
#                 tagPadding, tagPadding, tagPadding, tagPadding
#             )

#             markers_verts[markerID] = [
#                 pointToTuple(rect.topLeft()),
#                 pointToTuple(rect.topRight()),
#                 pointToTuple(rect.bottomRight()),
#                 pointToTuple(rect.bottomLeft()),
#             ]

#         return markers_verts

#     def getSurfaceSize(self):
#         return (self.width(), self.height())

#     def updateMask(self):
#         if self.settingsVisible:
#             mask = QRegion(0, 0, self.width(), self.height())

#         else:
#             mask = QRegion(0, 0, 0, 0)
#             for cornerIdx in range(4):
#                 rect = self.getCornerRect(cornerIdx).marginsAdded(QMargins(2, 2, 2, 2))
#                 mask = mask.united(rect)

#         self.setMask(mask)

#     def getCornerRect(self, cornerIdx):
#         tagSize = self.tagSizeInput.value()
#         tagSizePadded = tagSize + self.getTagPadding() * 2

#         if cornerIdx == 0:
#             return QRect(0, 0, tagSizePadded, tagSizePadded)

#         elif cornerIdx == 1:
#             return QRect(self.width() - tagSizePadded, 0, tagSizePadded, tagSizePadded)

#         elif cornerIdx == 2:
#             return QRect(
#                 self.width() - tagSizePadded,
#                 self.height() - tagSizePadded,
#                 tagSizePadded,
#                 tagSizePadded,
#             )

#         elif cornerIdx == 3:
#             return QRect(0, self.height() - tagSizePadded, tagSizePadded, tagSizePadded)


import sys
from PySide6.QtCore import Qt, Signal, QRect, QMargins, QPoint
from PySide6.QtGui import QPixmap, QPainter, QColor, QImage
from PySide6.QtWidgets import (
    QWidget,
    QSpinBox,
    QDoubleSpinBox,
    QCheckBox,
    QFormLayout,
    QLabel,
    QGridLayout,
    QSizePolicy,
    QSpacerItem,
)

from pupil_labs.real_time_screen_gaze import marker_generator


def createMarker(marker_id):
    marker = marker_generator.generate_marker(marker_id, flip_x=True, flip_y=True)
    image = QImage(10, 10, QImage.Format_Mono)
    image.fill(1)
    for y in range(marker.shape[0]):
        for x in range(marker.shape[1]):
            color = marker[y][x] // 255
            image.setPixel(x + 1, y + 1, color)
    return QPixmap.fromImage(image)


def pointToTuple(qpoint):
    return (qpoint.x(), qpoint.y())


class TagWindow(QWidget):
    surfaceChanged = Signal()
    mouseEnableChanged = Signal(bool)
    dwellRadiusChanged = Signal(int)
    dwellTimeChanged = Signal(float)
    smoothingChanged = Signal(float)

    def __init__(self):
        super().__init__()

        self.setWindowTitle("Pupil Pointer")
        self.setWindowFlags(Qt.Window)  # Standard window flags
        self.setStyleSheet("* { font-size: 18pt }")

        self.resize(800, 600)  # Default size, you can adjust as needed

        self.markerIDs = []
        self.pixmaps = []
        for markerID in range(4):
            self.markerIDs.append(markerID)
            self.pixmaps.append(createMarker(markerID))

        self.point = (0, 0)
        self.clicked = False
        self.settingsVisible = True
        self.visibleMarkerIds = []

        self.form = QWidget()
        self.form.setLayout(QFormLayout())

        self.tagSizeInput = QSpinBox()
        self.tagSizeInput.setRange(10, 512)
        self.tagSizeInput.setValue(256)
        self.tagSizeInput.valueChanged.connect(self.onTagSizeChanged)

        self.tagBrightnessInput = QSpinBox()
        self.tagBrightnessInput.setRange(0, 255)
        self.tagBrightnessInput.setValue(128)
        self.tagBrightnessInput.valueChanged.connect(lambda _: self.repaint())

        self.smoothingInput = QDoubleSpinBox()
        self.smoothingInput.setRange(0, 1.0)
        self.smoothingInput.setValue(0.8)
        self.smoothingInput.valueChanged.connect(self.smoothingChanged.emit)

        self.dwellRadiusInput = QSpinBox()
        self.dwellRadiusInput.setRange(0, 512)
        self.dwellRadiusInput.setValue(25)
        self.dwellRadiusInput.valueChanged.connect(self.dwellRadiusChanged.emit)

        self.dwellTimeInput = QDoubleSpinBox()
        self.dwellTimeInput.setRange(0, 20)
        self.dwellTimeInput.setValue(0.75)
        self.dwellTimeInput.valueChanged.connect(self.dwellTimeChanged.emit)

        self.mouseEnabledInput = QCheckBox("Mouse Control")
        self.mouseEnabledInput.setChecked(False)
        self.mouseEnabledInput.toggled.connect(self.mouseEnableChanged.emit)

        self.form.layout().addRow("Tag Size", self.tagSizeInput)
        self.form.layout().addRow("Tag Brightness", self.tagBrightnessInput)
        self.form.layout().addRow("Smoothing", self.smoothingInput)
        self.form.layout().addRow("Dwell Radius", self.dwellRadiusInput)
        self.form.layout().addRow("Dwell Time", self.dwellTimeInput)
        self.form.layout().addRow("", self.mouseEnabledInput)

        self.instructionsLabel = QLabel(
            "Right-click one of the tags to toggle settings view."
        )
        self.instructionsLabel.setAlignment(Qt.AlignHCenter)

        self.statusLabel = QLabel()
        self.statusLabel.setAlignment(Qt.AlignHCenter)

        self.setLayout(QGridLayout())
        self.layout().setSpacing(50)

        self.layout().addWidget(self.instructionsLabel, 0, 0, 1, 3)
        self.layout().addItem(
            QSpacerItem(20, 40, QSizePolicy.Minimum, QSizePolicy.Expanding), 1, 1, 1, 1
        )
        self.layout().addItem(
            QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum), 2, 0, 1, 1
        )
        self.layout().addItem(
            QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum), 2, 2, 1, 1
        )
        self.layout().addWidget(self.form, 3, 1, 1, 1)
        self.layout().addItem(
            QSpacerItem(20, 40, QSizePolicy.Minimum, QSizePolicy.Expanding), 4, 1, 1, 1
        )
        self.layout().addWidget(self.statusLabel, 5, 0, 1, 3)

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.RightButton:
            self.setSettingsVisible(not self.settingsVisible)

    def setSettingsVisible(self, visible):
        self.settingsVisible = visible

        if visible:
            self.setWindowFlags(Qt.Window)
            self.form.show()
            self.instructionsLabel.show()
            self.statusLabel.show()
        else:
            self.setWindowFlags(
                Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.Window
            )
            self.setAttribute(Qt.WA_TranslucentBackground)
            self.form.hide()
            self.instructionsLabel.hide()
            self.statusLabel.hide()

        self.show()  # Refresh the window with new flags

    def setStatus(self, status):
        self.statusLabel.setText(status)

    def setClicked(self, clicked):
        self.clicked = clicked
        self.repaint()

    def updatePoint(self, norm_x, norm_y):
        tagMargin = 0.1 * self.tagSizeInput.value()
        surfaceSize = (
            self.width() - 2 * tagMargin,
            self.height() - 2 * tagMargin,
        )

        self.point = (
            norm_x * surfaceSize[0] + tagMargin,
            (surfaceSize[1] - norm_y * surfaceSize[1]) + tagMargin,
        )

        self.repaint()
        return self.mapToGlobal(QPoint(*self.point))

    def showMarkerFeedback(self, markerIds):
        self.visibleMarkerIds = markerIds
        self.repaint()

    def paintEvent(self, event):
        painter = QPainter(self)

        if self.settingsVisible:
            if self.clicked:
                painter.setBrush(Qt.red)
            else:
                painter.setBrush(Qt.white)

            painter.drawEllipse(
                QPoint(*self.point),
                self.dwellRadiusInput.value(),
                self.dwellRadiusInput.value(),
            )

        for cornerIdx in range(4):
            cornerRect = self.getCornerRect(cornerIdx)
            if cornerIdx not in self.visibleMarkerIds:
                painter.fillRect(
                    cornerRect.marginsAdded(QMargins(5, 5, 5, 5)), QColor(255, 0, 0)
                )

            painter.drawPixmap(cornerRect, self.pixmaps[cornerIdx])
            painter.fillRect(
                cornerRect, QColor(0, 0, 0, 255 - self.tagBrightnessInput.value())
            )
        # Draw the surface boundary (optional debug visualization)
        painter.setPen(QColor(0, 255, 0))  # Green for surface boundary
        _, surface_verts = self.getMarkerVerts()

        for i in range(len(surface_verts)):
            start = QPoint(*surface_verts[i])
            end = QPoint(*surface_verts[(i + 1) % len(surface_verts)])  # Wrap to first point
            painter.drawLine(start, end)

    def resizeEvent(self, event):
        self.surfaceChanged.emit()

    def moveEvent(self, event):
        self.surfaceChanged.emit()

    def onTagSizeChanged(self, value):
        self.repaint()
        self.surfaceChanged.emit()

    def getMarkerSize(self):
        return self.tagSizeInput.value()

    def getTagPadding(self):
        return self.getMarkerSize() / 8

    # def getMarkerVerts(self):
    #     tagPadding = self.getTagPadding()
    #     markers_verts = {}

    #     for cornerIdx, markerID in enumerate(self.markerIDs):
    #         rect = self.getCornerRect(cornerIdx) - QMargins(
    #             tagPadding, tagPadding, tagPadding, tagPadding
    #         )

    #         markers_verts[markerID] = [
    #             pointToTuple(rect.topLeft()),
    #             pointToTuple(rect.topRight()),
    #             pointToTuple(rect.bottomRight()),
    #             pointToTuple(rect.bottomLeft()),
    #         ]

    #     return markers_verts

    def getMarkerVerts(self):
        tagPadding = self.getTagPadding()

        # Get rectangles for each marker
        top_left_marker = self.getCornerRect(0) - QMargins(tagPadding, tagPadding, tagPadding, tagPadding)
        top_right_marker = self.getCornerRect(1) - QMargins(tagPadding, tagPadding, tagPadding, tagPadding)
        bottom_right_marker = self.getCornerRect(2) - QMargins(tagPadding, tagPadding, tagPadding, tagPadding)
        bottom_left_marker = self.getCornerRect(3) - QMargins(tagPadding, tagPadding, tagPadding, tagPadding)

        # Identify the corners
        surface_verts = [
            pointToTuple(top_left_marker.bottomRight()),  # Bottom-right of top-left marker
            pointToTuple(top_right_marker.bottomLeft()),  # Bottom-left of top-right marker
            pointToTuple(bottom_right_marker.topLeft()),  # Top-left of bottom-right marker
            pointToTuple(bottom_left_marker.topRight()),  # Top-right of bottom-left marker
        ]

        # Return the marker vertices and surface vertices separately if needed
        markers_verts = {
            0: [
                pointToTuple(top_left_marker.topLeft()),
                pointToTuple(top_left_marker.topRight()),
                pointToTuple(top_left_marker.bottomRight()),
                pointToTuple(top_left_marker.bottomLeft()),
            ],
            1: [
                pointToTuple(top_right_marker.topLeft()),
                pointToTuple(top_right_marker.topRight()),
                pointToTuple(top_right_marker.bottomRight()),
                pointToTuple(top_right_marker.bottomLeft()),
            ],
            2: [
                pointToTuple(bottom_right_marker.topLeft()),
                pointToTuple(bottom_right_marker.topRight()),
                pointToTuple(bottom_right_marker.bottomRight()),
                pointToTuple(bottom_right_marker.bottomLeft()),
            ],
            3: [
                pointToTuple(bottom_left_marker.topLeft()),
                pointToTuple(bottom_left_marker.topRight()),
                pointToTuple(bottom_left_marker.bottomRight()),
                pointToTuple(bottom_left_marker.bottomLeft()),
            ],
        }

        return markers_verts, surface_verts

    def getSurfaceSize(self):
        return (self.width(), self.height())

    def getCornerRect(self, cornerIdx):
        tagSize = self.tagSizeInput.value()
        tagSizePadded = tagSize + self.getTagPadding() * 2

        if cornerIdx == 0:
            return QRect(0, 0, tagSizePadded, tagSizePadded)

        elif cornerIdx == 1:
            return QRect(self.width() - tagSizePadded, 0, tagSizePadded, tagSizePadded)

        elif cornerIdx == 2:
            return QRect(
                self.width() - tagSizePadded,
                self.height() - tagSizePadded,
                tagSizePadded,
                tagSizePadded,
            )

        elif cornerIdx == 3:
            return QRect(0, self.height() - tagSizePadded, tagSizePadded, tagSizePadded)
