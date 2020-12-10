#!/usr/bin/env python

import rospkg
import rospy
import roslaunch

from os import walk
import shutil
import json
import yaml
import datetime
import muxservice


class Sounds():
    path_ = rospkg.RosPack().get_path('rtcrobot_webinterface')+"/www/sound"
    gsounds_ = []
    def __init__(self):
       Sounds.gsounds_ = Sounds.loadsounds()

        #self.mux_navmaps_ = muxservice.MuxService('mux_navmaps')
        #self.mux_wallmaps_ = muxservice.MuxService('mux_wallmaps')
        #self.mux.add_topic('/test')

    @staticmethod
    def loadsounds():
        list_sound = []
        #r=root, d=driectories, f= files
        for r,d,f in walk(Sounds.path_):
             list_sound=f
            
            

            #f_yaml = open(self.path_ + '/maps.yaml')
            #self.maps_info_ = yaml.load(f_yaml.read())
            #for map in self.maps_info_['map_source']:
                #f = open(self.path_ + '/' + map + '/config.json', 'r')
                #obj = json.loads(f.read())
                #if obj['createtime'] < date
                #maps.insert(-1, obj)
        return list_sound

    @staticmethod
    def getsounds():
        Sounds.gsounds_ = Sounds.loadsounds()
        return Sounds.gsounds_
        #return self.maps_

    

    #y = "2020-04-04 14:45:08.126754"
    #d = datetime.datetime.strptime(y,'%Y-%m-%d %H:%M:%S.%f')
