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
        mapdatafile = self.mapname_ + '.pgm'
        rospy.loginfo("Writting map occupancy data to %s", mapdatafile)
        path = os.path.join(self.path_,self.mapname_)
        try:
            os.makedirs(path)
        except OSError as error: 
            rospy.loginfo(error)
            #return

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

        image = np.reshape(datacvt, (map.info.height, map.info.width))
        cv2.imwrite(path + '/navigation.png', image)

        #! Creat image map file - wall
        image = np.full( (map.info.height, map.info.width),205)
        cv2.imwrite(path + '/wall.png', image)

        #! Create info file for the map
        fout_yaml = open(path + '/info.yaml', 'w+')
        fout_yaml.write("name: '{0}'\ncreateby: '{1}'\ncreatetime: '{2}'".format(self.mapname_, 'Adminitrator',datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')))
        fout_yaml.close()

        #! Create yaml for map
        #################################################
        #resolution: 0.100000
        #origin: [0.000000, 0.000000, 0.000000]
        ##
        #negate: 0
        #occupied_thresh: 0.65
        #free_thresh: 0.196
        #################################################
        #q = [map.info.origin.orientation.x,map.info.origin.orientation.y,map.info.origin.orientation.z,map.info.origin.orientation.w]
        #(roll, pitch, yaw) = euler_from_quaternion(q)
        #datastr = "image: {0}.png\nresolution: {1}\norigin: [{2}, {3}, {4}]\nnegate: 0\noccupied_thresh: 0.65\nfree_thresh: 0.196\n\n"
        
        #fout_yaml = open(path + '/navigation.yaml', 'w')
        #fout_yaml.write(datastr.format('navigation', map.info.resolution, map.info.origin.position.x, map.info.origin.position.y, yaw))
        #fout_yaml.write(datastr.format('navigation', map.info.resolution, 0, 0, 0))
        #fout_yaml.close()

        #fout_yaml = open(path + '/wall.yaml', 'w+')
        #fout_yaml.write(datastr.format('wall', map.info.resolution, map.info.origin.position.x, map.info.origin.position.y, yaw))
	#fout_yaml.write(datastr.format('wall', map.info.resolution, 0, 0, 0))
        #fout_yaml.close()
        pass


    #y = "2020-04-04 14:45:08.126754"
    #d = datetime.datetime.strptime(y,'%Y-%m-%d %H:%M:%S.%f')
