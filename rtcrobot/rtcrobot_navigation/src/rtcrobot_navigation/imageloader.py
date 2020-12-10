#!/usr/bin/env python

import rospy
import rospkg
import os
import cv2
import numpy as np
from nav_msgs.srv import GetMapResponse


def loadMapfromFile(filepath= '',res=0.05, occ_th = 0.65, free_th=0.196):
    resp = GetMapResponse()
    img = cv2.imread(filepath,0)
    height, width = img.shape

    #// Copy the image data into the map structure
    resp.map.info.height = height
    resp.map.info.width = width
    resp.map.info.resolution = res
    resp.map.info.origin.position.x = 0.0
    resp.map.info.origin.position.y = 0.0
    resp.map.info.origin.position.z = 0.0

    resp.map.info.origin.orientation.x = 0.0
    resp.map.info.origin.orientation.y = 0.0
    resp.map.info.origin.orientation.z = 0.0
    resp.map.info.origin.orientation.w = 1.0
    #print resp.map.data.shape

    data = []
    for y in range(height):
        for x in range(width):
            occ = (255 - img[height - y-1,x])/255.0
            value = 0
            if(occ > occ_th):
                value = 100
            elif occ < free_th:
                value = 0
            else:
                value = -1
            data.append(np.int8(value))
    resp.map.data = data
    #cv2.imshow('image',img)
    #cv2.waitKey(0)
    #cv2.destroyAllWindows()
    return resp
