#!/usr/bin/env python 
import rospy
import rospkg
import cv2
from rtcrobot_fleetclient.fleetclient import FleetClient as fc

if __name__ == '__main__':
    """ main """
    try:
        rospy.init_node('fleetclient') #, anonymous=True
        #doc = fc.FindMission(name='mission1')
        #for x in doc:
        #    print x
        
        #newvalue = {'x' : 1.0, 'type': 3}
        #doc = fc.UpdatePose(name='PoseA', map='F', newvalues = newvalue) 
        #print doc 
        # 
        #fc.InsertMap(name='Floor1', dimension={'width':1000, 'height':200}) 
        #  
        #fc.ActiveMap('HB')
        #fleetclient.spin()
        fodder_path = rospkg.RosPack().get_path('rtcrobot_navigation')+'/maps/')
        image = np.reshape(data=mp['navdata']),(mp['dimension']['height'],mp['dimension']['width'] ))
        cv2.imwrite(fodder_path+'/navigation.png',image)

    except rospy.ROSInterruptException:
        pass
    #y = "2020-04-04 14:45:08.126754"
    #d = datetime.datetime.strptime(y,'%Y-%m-%d %H:%M:%S.%f')
