import math
import rospy
import rospkg
import actionlib
import std_srvs.srv
import time
from math import sin, cos
import numpy as np
import json

from move_base_msgs.msg import MoveBaseAction, MoveBaseGoal
from geometry_msgs.msg import Pose, Quaternion
from tf.transformations import quaternion_from_euler
from rtcrobot_actions.msg import UnDockAction, UnDockGoal, DockAction, DockGoal
from actionlib_msgs.msg import GoalStatus

from sensor_msgs.msg import BatteryState
from geometry_msgs.msg import PoseStamped, Quaternion, PolygonStamped, Twist

from tf.transformations import euler_from_quaternion, quaternion_from_euler

import pymongo

class State():
    def __init__(self, code=None, subcode=None):
        self.code = code
        self.subcode = subcode

    # def __init__(self, data):
    #     print data
    #     data_dict = json.loads(data)
    #     #self.code = data_dict['code']
    #     #self.subcode = data_dict['subcode']
    #     pass

    def __repr__(self):
        return {'code': self.code, 'subcode': self.subcode}
    
    def __str__(self):
        return json.dumps(self)

class Battery():
    def __init__(self, percentage=None, current=None, voltage=None):
        self.percentage = percentage
        self.current = current
        self.voltage = voltage

class Pose():
    def __init__(self, pose=None):
        self.pose = pose
        self.x = pose.position.x
        self.y = pose.position.y
        self.theta = euler_from_quaternion(pose.orientation)[2]
    
class Velocity():
    def __init__(self, velocity=None):
        self.velocity = velocity


class Map():
    def __init__(self, data=None):
        self.name = data['name']
        
#region FleetClient
#
#
#
class Robot():
    name = ''

    def __init__(self):
        #self.state = State()
        #self.battery = Battery()
        #self.pose = Pose()
        #self.map = ''
        #self.velocity = Velocity()
        pass

    def __str__(self):
        return json.dumps(self)
        return 'State(name= "'+Robot.name+'")'
#endregion