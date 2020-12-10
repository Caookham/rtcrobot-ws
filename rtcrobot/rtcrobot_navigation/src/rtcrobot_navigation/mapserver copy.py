#!/usr/bin/env python

import rospy
import rospkg
import os
import cv2
from rtcrobot_navigation import imageloader, savemap, savemapdb
from nav_msgs.srv import SetMapResponse
from nav_msgs.msg import OccupancyGrid, MapMetaData
from rtcrobot_services.srv import SwitchMap, SwitchMapResponse

import rtcrobot_fleetclient.fleetclient as fc


class MapServer():
    __map_resp = SetMapResponse()
    def __init__(self):
        rospy.init_node('rtcrobot_mapserver', anonymous=True)
        rospy.loginfo('Map server stated!')
        self.frame_id           = rospy.get_param('~frame_id', 'map') 
        self.occupied_thresh    = rospy.get_param('~occupied_thresh', 0.65) 
        self.free_thresh        = rospy.get_param('~free_thresh', 0.196) 
        self.resolution         = rospy.get_param('~resolution', 0.05) 
        self.pub_map = rospy.Publisher('map',OccupancyGrid,latch=True, queue_size = 10)
        self.pub_wall = rospy.Publisher('maps/wall',OccupancyGrid,latch=True, queue_size = 10)
        self.pub_mapmeta = rospy.Publisher('map_metadata',MapMetaData,latch=True, queue_size = 10)
        savemap.SaveMap()

        self.__loadMap('default')
        sv = rospy.Service('/robot_services/switchmap',SwitchMap, self.svcallback)
        pass

    def svcallback(self, request):
        self.__loadMap(request.mapname)
        return SwitchMapResponse()

    def __loadMap(self, mapname='map'):
        resp = GetMapResponse()
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

        maps = fc.FindMap('mapname')
        if maps.count() >0:
            mapdata = maps[0]
            resp.map.data = mapdata['navdata']

        path = rospkg.RosPack().get_path('rtcrobot_navigation')+'/maps/'+mapname+'/navigation.png'
        mapdata = imageloader.loadMapfromFile(filepath=path,res=self.resolution,occ_th=self.occupied_thresh,free_th=self.free_thresh)
        path = rospkg.RosPack().get_path('rtcrobot_navigation')+'/maps/'+mapname+'/wall.png'
        walldata = imageloader.loadMapfromFile(filepath=path,res=self.resolution,occ_th=self.occupied_thresh,free_th=self.free_thresh)
        mapdata.map.info.map_load_time = rospy.Time.now()
        mapdata.map.header.frame_id = self.frame_id
        self.pub_mapmeta.publish(mapdata.map.info)
        walldata.map.info.map_load_time = rospy.Time.now()
        walldata.map.header.frame_id = self.frame_id
        self.pub_wall.publish(walldata.map)
        self.pub_map.publish(mapdata.map)
        rospy.loginfo("Read '%s' map @ %d X %d @ %.3lf m/cell",mapname, mapdata.map.info.width, mapdata.map.info.height, mapdata.map.info.resolution)

    def spin(self):
        r = rospy.Rate(10)
        while not rospy.is_shutdown():
            r.sleep()
        rospy.spin()
