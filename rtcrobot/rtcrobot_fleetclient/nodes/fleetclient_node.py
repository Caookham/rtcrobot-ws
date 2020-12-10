#!/usr/bin/env python
import rospy
import rtcrobot_fleetclient.fleetclient as fc

if __name__ == '__main__':
    """ main """
    try:
        rospy.init_node('fleetclient') #, anonymous=True
        fleetclient = fc.FleetClient()
        #fleetclient.spin()
    except rospy.ROSInterruptException:
        pass
    #y = "2020-04-04 14:45:08.126754"
    #d = datetime.datetime.strptime(y,'%Y-%m-%d %H:%M:%S.%f')
