#!/usr/bin/env python

import rospy
import rospkg
import os
import rtcrobot_services.srv
import cv2
import numpy as np
from datetime import date

from nav_msgs.msg import OccupancyGrid
from geometry_msgs.msg import Quaternion
from tf.transformations import euler_from_quaternion,quaternion_matrix

from rtcrobot_fleetclient.database import DataBase as db


class SaveMap():
    def __init__(self, mapname='navigation', topic='maps/mapping', threshold_occupied=65, threshold_free=25):
        self.mapname_ = mapname
        self.threshold_occupied_ = threshold_occupied
        self.threshold_free_ = threshold_free
        self.topic_ = topic
        self.path_ = rospkg.RosPack().get_path('rtcrobot_navigation')+'/maps'
        sv = rospy.Service('/robot_services/savemap',rtcrobot_services.srv.SaveMap, self.svcallback)

        pass

    def spin(self):
        r = rospy.Rate(10)
        while not rospy.is_shutdown():
            r.sleep()
        rospy.spin()

    def svcallback(self, request):
        print request
        self.mapname_ = request.name
        self.sub = rospy.Subscriber(self.topic_,OccupancyGrid, self.mapcallback)
        return rtcrobot_services.srv.SaveMapResponse()
    
    
    def mapcallback(self,msg):
        self.__save_map(msg)
        self.sub.unregister()
        pass

    def __save_map(self, map):
        rospy.loginfo("Recived a %d X %d map @ %.3f m/pix", map.info.width, map.info.height, map.info.resolution)

        #! Create zero image
        #img = np.zeros((map.info.height, map.info.width))
        
        #img[:, :] = [[ord(255) for j in range(map.info.width)] for i in range(map.info.height)]
        
        #! Create image map file - navigation
        datacvt = []
        for y in range(map.info.height):
		for x in range(map.info.width):
			px = map.data[x + (map.info.height - y - 1) * map.info.width]
		    	if px >= 0 and  px <= self.threshold_free_:
		        	#fout_img.write(chr(254))
		        	datacvt.append(254)
		    	elif px >= self.threshold_occupied_:
		        	#fout_img.write(chr(0))
		        	datacvt.append(0)
		    	else:
		        	#fout_img.write(chr(205))
		        	datacvt.append(205)
        dimension = {"width": map.info.width, "height": map.info.height}
        nav = np.reshape(datacvt, (map.info.height, map.info.width)) 

        #! Creat image map file - wall
        wall = [-1 for i in range(map.info.height * map.info.width)]
        db.InsertMap(name = self.mapname_, dimension = dimension, navdata = map.data, walldata = wall)


    #y = "2020-04-04 14:45:08.126754"
    #d = datetime.datetime.strptime(y,'%Y-%m-%d %H:%M:%S.%f')
