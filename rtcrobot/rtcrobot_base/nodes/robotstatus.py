#!/usr/bin/env python

import rospy
import roslib
from math import sin, cos, pi

from rtcrobot_msgs.msg import RobotMode, RobotState, DockState
from sensor_msgs.msg import BatteryState
from nav_msgs.msg import Odometry
from move_base_msgs.msg import MoveBaseActionFeedback, MoveBaseActionResult


#############################################################################
class RobotStatus:
#############################################################################

    #############################################################################
    def __init__(self):
    #############################################################################
        rospy.init_node("status_manager")
        self.nodename = rospy.get_name()
        rospy.loginfo("-I- %s started" % self.nodename)

        self.state_pub_ = rospy.Publisher("rtcrobot/state", RobotState, queue_size=10)
        self.__mode = RobotMode.NAVIGATION
        
        #status starting
        self.__state = RobotState()
        self.__state.code = RobotState.STARTING
        self.__state_old = self.__state

        self.bat__ = BatteryState()
        self.dock__ = DockState()
        self.__moving = False
        
        #Subcriber
        self.mode_sub_ = rospy.Subscriber('robot_mode', RobotMode, self.mode_callback)
        self.bat_sub_ = rospy.Subscriber('rtcrobot/battery', BatteryState, self.bat_callback)
        self.dock_sub_ = rospy.Subscriber('rtcrobot/dockstate', DockState, self.dock_callback)

        self.mb_feedback_sub_ = rospy.Subscriber('move_base/feedback', MoveBaseActionFeedback, self.movebasefeedback_callback)
        self.mb_result_sub_ = rospy.Subscriber('move_base/result', MoveBaseActionResult, self.movebaseresulfcallback)

    
    #############################################################################
    def spin(self):
    #############################################################################
        r = rospy.Rate(100)
        while not rospy.is_shutdown():
            self.update()
            r.sleep()
       
    #############################################################################
    def mode_callback(self, msg):
    #############################################################################
        self.__mode = msg.code
        pass

    #############################################################################
    def bat_callback(self, msg):
    #############################################################################
        self.bat__ = msg
        pass

    #############################################################################
    def dock_callback(self, msg):
    #############################################################################
        self.dock__ = msg
        pass

    #############################################################################
    def movebasefeedback_callback(self, msg):
    #############################################################################
        if msg.status.status == 1:
            self.__moving = True
        pass

    #############################################################################
    def movebaseresulfcallback(self, msg):
    #############################################################################
        #self.bat__ = msg
        self.__moving = False
        pass

    #############################################################################
    def update(self):
    #############################################################################
        self.__state.subcode = RobotState.NORMAL
        if  self.bat__.current > 0:
            self.__state.code = RobotState.CHARGING
        else:
            if self.__mode == RobotMode.MAPPING: #Mapping mode
                self.__state.code = RobotState.MAPPING
            elif self.__mode == RobotMode.NAVIGATION: #Navigation mode
		if self.dock__.status != DockState.UNDOCK: #Dock status
                    self.__state.code = RobotState.DOCK
                    if self.dock__.status == DockState.DOCKING:
                        self.__state.subcode = RobotState.DOCKING
                    elif self.dock__.status == DockState.DOCKED:
                         self.__state.subcode = RobotState.APPROACHED
                    elif self.dock__.status == DockState.UNDOCKING:
                         self.__state.subcode = RobotState.UNDOCKING
                elif self.__moving:
                    self.__state.code = RobotState.MOVING
                else:
                    self.__state.code = RobotState.READY
            elif self.__mode == RobotMode.MANUAL: #Manual Mode
                self.__state.code = RobotState.MANUAL
            else: # Nomal Mode
                self.__state.code = RobotState.READY
        self.state_pub_.publish(self.__state)
        pass

#############################################################################
#############################################################################
if __name__ == '__main__':
    """ main """
    try:
        robotstatus = RobotStatus()
        robotstatus.spin()
    except rospy.ROSInterruptException:
        pass
