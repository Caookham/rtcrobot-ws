#!/usr/bin/env python

import math
import time

import rospy
import roslib
import rospkg
import actionlib

from geometry_msgs.msg import Twist
from std_msgs.msg import String, Float32, Empty
from sensor_msgs.msg import Joy
from rtcrobot_actions.msg import MissionAction, MissionGoal

class RobotMode(object):
    def __init__(self, name):
        self.action_name_ = name
        self.joy_sub_ = rospy.Subscriber('joy', Joy, self.sub_callback)
        self.cmd_vel_pub_ = rospy.Publisher('cmd_vel', Twist , queue_size=1)
        self.__enable = False
	self.__joy_linear = 0.0
	self.__joy_angular = 0.0
	self.__publish_enable = True

        self.linear_max_ = rospy.get_param("~linear_max", 1.0)
        self.angular_max_ = rospy.get_param("~angular_max", 1.0)
	rospy.loginfo("Robot mode default is manual mode ...")

    def sub_callback(self, msg):
	linearmax = 0.3
	angularmax = 0.3
        if(msg.buttons[7] == 1 and self.__enable == False): #Start button
            self.__enable = True
	else:
	    if(msg.buttons[7] == 1 and self.__enable == True): #Start button
	    	self.__enable = False
	if(msg.buttons[4] == 1): #Start button
            linearmax = self.linear_max_
	    angularmax = self.linear_max_

	if(msg.buttons[0] == 1):#A
	    pass
	if(msg.buttons[1] == 1):#B
	    pass
	if(msg.buttons[2] == 1):#X
	    pass
	if(msg.buttons[3] == 1):#Y
	    pass

	self.__joy_linear = msg.axes[1] * abs(linearmax/1.0)
	self.__joy_angular =  msg.axes[0] * abs(angularmax/1.0)

    def spin(self):
        r = rospy.Rate(50)
        while not rospy.is_shutdown():
            if(self.__enable):
		if(self.__joy_linear != 0.0 or self.__joy_angular != 0.0):
	    		cmdvel_msg = Twist()
            		cmdvel_msg.linear.x = self.__joy_linear
            		cmdvel_msg.angular.z = self.__joy_angular
            		self.cmd_vel_pub_.publish(cmdvel_msg)
			self.__publish_enable = True
	    	else:
			if(self.__publish_enable):
				cmdvel_msg = Twist()
            			self.cmd_vel_pub_.publish(cmdvel_msg)
				self.__publish_enable = False
			
            r.sleep()
        #rospy.loginfo("spin")
        r.sleep()

######################################################################################################
#############################################################################
#############################################################################
if __name__ == '__main__':
    """ main """
    rospy.init_node('robot_mode')
    try:
        robotmode = RobotMode(rospy.get_name())
        robotmode.spin()
    except rospy.ROSInterruptException:
        pass
  
