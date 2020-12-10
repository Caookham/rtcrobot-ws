#!/usr/bin/env python
import rospy
import paho.mqtt.client as mqtt
from sensor_msgs.msg import BatteryState
from geometry_msgs.msg import PoseStamped, PolygonStamped, Twist
from rtcrobot_msgs.msg import RobotState
from std_msgs.msg import String
import time
import json

from rtcrobot_fleetclient.robotdata import Robot

broker_address="192.168.5.2" 
#broker_address="iot.eclipse.org" #use external broker
client = mqtt.Client("P1") #create new instance
client.username_pw_set(username='fleet', password='rtc')
Robot.name = 'ROBOT001'

footprint = {
    'global': None,
    'local': None,
    'cart':None,
}

# data={
#     'name':ROBOTNAME,
#     'type':'Natural',
#     'pose':{
#         'x': 1.0,
#         'y': 1.2,
#         'theta': 0.5
#     },
#     'status': 
#     {
#         'code': 2,
#         'description': 'Robot ready'
#     },
#     'battery':
#     {
#         'percentage': 0.0
#     }
# }

def bat_callback(msg):
    data={
        'battery':{
            'percentage': msg.percentage,
            'current': msg.current,
            'voltage': msg.voltage
        }
    }

    client.publish("rtcrobot/status/"+ Robot.name + "/battery",json.dumps(data))#publish

def pose_callback(msg):
    data={
        'pose':{
            'position':{
                    'x': msg.pose.position.x,
                    'y': msg.pose.position.y,
                    'z': msg.pose.position.z
                },
            'orientation':{
                'x': msg.pose.orientation.x,
                'y': msg.pose.orientation.y,
                'z': msg.pose.orientation.z,
                'w': msg.pose.orientation.w,
            }
        }
    }

    json.dumps(data)

    client.publish("rtcrobot/status/"+ Robot.name + "/pose",json.dumps(data))#publish

def state_callback(msg):
    data={
        'state':{
            'code': msg.code,
            'subcode': msg.subcode
            }
    }

    json.dumps(data)

    client.publish("rtcrobot/status/"+ Robot.name + "/state",json.dumps(data))#publish

def map_callback(msg):
    # data={
    #     'map':{
    #         'name': '',
    #         'data': msg.data,
    #         'resolution': 0.05,
    #         'height': msg.info.height,
    #         'width': msg.info.width
    #     }
    # }

    data={
        'map':{
            'name': msg
        }
    }

    client.publish("rtcrobot/status/"+ Robot.name + "/map",json.dumps(data))#publish

def localfootprint_callback(msg):
    footprint['local'] = msg


def vel_callback(msg):
    data={
        'velocity':{
            'angular':{
                'x': msg.angular.x,
                'y': msg.angular.y,
                'z': msg.angular.z
            },
            'linear':{
                'x': msg.linear.x,
                'y': msg.linear.y,
                'z': msg.linear.z
            }
        }
    }

    client.publish("rtcrobot/status/"+ Robot.name + "/velocity",str(data))#publish

#############################################################################
if __name__ == '__main__':
    """ main """
    rospy.init_node("fleetserver_pub")
    _bat_sub = rospy.Subscriber('rtcrobot/battery', BatteryState, bat_callback)
    _pose_sub = rospy.Subscriber('rtcrobot/pose', PoseStamped, pose_callback)
    _state_sub = rospy.Subscriber('rtcrobot/state', RobotState, state_callback)
    _map_sub = rospy.Subscriber('rtcrobot/currentmap', String, map_callback)
    _vel_sub = rospy.Subscriber('cmd_vel', Twist, vel_callback)
    #_localfootprint_sub = rospy.Subscriber('move_base_node/local_costmap/footprint', PolygonStamped, localfootprint_callback)
    client.connect(broker_address) #connect to broker
    r = rospy.Rate(10)
    while not rospy.is_shutdown():
        #client.publish("rtcrobot/status/"+ ROBOTNAME,str(data))#publish
        r.sleep()
    rospy.spin()