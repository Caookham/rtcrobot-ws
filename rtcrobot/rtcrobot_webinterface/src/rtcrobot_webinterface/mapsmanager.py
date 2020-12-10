#!/usr/bin/env python 

import rospkg
import rospy

from os import walk

f = []
rospack = rospkg.RosPack()
path = rospack.get_path('rtcrobot_navigation') + 'maps'
for (dirpath, dirnames, filenames) in walk(path):
    f.extend(dirnames)
    break
print f