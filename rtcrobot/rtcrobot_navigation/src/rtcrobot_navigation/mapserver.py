#!/usr/bin/env python

import rospy
import rospkg
import os
import cv2
import numpy as np
import copy

from std_msgs.msg import String
from rtcrobot_navigation import imageloader, savemap, savemapdb
from nav_msgs.srv import SetMapResponse, GetMapResponse
from nav_msgs.msg import OccupancyGrid, MapMetaData
from rtcrobot_services.srv import SwitchMap, SwitchMapResponse

from rtcrobot_fleetclient.database import DataBase as db


class MapServer():
    __map_resp = SetMapResponse()
    def __init__(self):
        rospy.init_node('rtcrobot_mapserver', anonymous=True)
        rospy.loginfo('Map server stated!')
        self.frame_id           = rospy.get_param('~frame_id', 'map') 
        self.occupied_thresh    = rospy.get_param('~occupied_thresh', 65) 
        self.free_thresh        = rospy.get_param('~free_thresh', 0.196) 
        self.resolution         = rospy.get_param('~resolution', 0.05) 
        self.pub_map = rospy.Publisher('map',OccupancyGrid,latch=True, queue_size = 10)
        self.pub_wall = rospy.Publisher('maps/wall',OccupancyGrid,latch=True, queue_size = 10)
        self.pub_mapmeta = rospy.Publisher('map_metadata',MapMetaData,latch=True, queue_size = 10)
        self.pub_currentmap = rospy.Publisher('rtcrobot/currentmap',String,latch=True, queue_size = 10)
        savemapdb.SaveMap()

        doc = db.FindActiveMap()
        for active in doc:
            if self.__loadMap(active['name']):
                self.pub_currentmap.publish(active['name'])
            break

        
        sv = rospy.Service('/robot_services/switchmap',SwitchMap, self.svcallback)
        pass

    def svcallback(self, request):
        if self.__loadMap(request.mapname):
            self.pub_currentmap.publish(request.mapname)
        return SwitchMapResponse()

    def __loadMap(self, mapname='map'):
        nav = GetMapResponse()
        #// Copy the image data into the map structure
        nav.map.info.origin.position.x = 0.0
        nav.map.info.origin.position.y = 0.0
        nav.map.info.origin.position.z = 0.0

        nav.map.info.origin.orientation.x = 0.0
        nav.map.info.origin.orientation.y = 0.0
        nav.map.info.origin.orientation.z = 0.0
        nav.map.info.origin.orientation.w = 1.0

        nav.map.info.map_load_time = rospy.Time.now()
        nav.map.header.frame_id = self.frame_id

        wall = GetMapResponse()
        #// Copy the image data into the map structure
        wall.map.info.origin.position.x = 0.0
        wall.map.info.origin.position.y = 0.0
        wall.map.info.origin.position.z = 0.0

        wall.map.info.origin.orientation.x = 0.0
        wall.map.info.origin.orientation.y = 0.0
        wall.map.info.origin.orientation.z = 0.0
        wall.map.info.origin.orientation.w = 1.0

        wall.map.info.map_load_time = rospy.Time.now()
        wall.map.header.frame_id = self.frame_id

        maps = db.FindMap(mapname)
        
        if maps.count() >0:
            mapdata = maps[0]
            nav.map.info.height = mapdata['dimension']['height']
            nav.map.info.width = mapdata['dimension']['width']
            nav.map.info.resolution = 0.05
            wall.map.info = nav.map.info
            nav.map.data = self.__convert(mapdata['navdata'])
            self.pub_mapmeta.publish(nav.map.info)
            self.pub_map.publish(nav.map)

            wall.map.data = np.int8(mapdata['walldata'])
            self.pub_wall.publish(wall.map)
            rospy.loginfo("Read '%s' map @ %d X %d @ %.3lf m/cell",mapname, nav.map.info.width, nav.map.info.height, nav.map.info.resolution)
            return True
        rospy.loginfo("Can't load map")
        return False

    def __dataconvert(self, data=[]):
        dat = []
        for d in data:
            occ = (255 - d)/255.0
            value = 0
            if(occ > self.occupied_thresh):
                value = 100
            elif occ < self.free_thresh:
                value = 0
            else:
                value = -1
            dat.append(np.int8(value))
        return dat

    def __convert(self, data=[]):
        dat = []
        for d in data:
            if(d > self.occupied_thresh):
                d = 100
            dat.append(np.int8(d))
        return dat

    def spin(self):
        r = rospy.Rate(10)
        while not rospy.is_shutdown():
            r.sleep()
        rospy.spin()
