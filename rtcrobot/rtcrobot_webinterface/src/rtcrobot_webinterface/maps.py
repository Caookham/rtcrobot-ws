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


class Maps():
    path_ = rospkg.RosPack().get_path('rtcrobot_navigation') + '/maps'
    gmaps_ = []
    def __init__(self):
        Maps.gmaps_ = Maps.loadmaps()
        self.process_ =[]
        self.launch = roslaunch.scriptapi.ROSLaunch()
        self.launch.start()
        self.pubmaps()
        #self.mux_navmaps_ = muxservice.MuxService('mux_navmaps')
        #self.mux_wallmaps_ = muxservice.MuxService('mux_wallmaps')
        #self.mux.add_topic('/test')

    @staticmethod
    def loadmaps():
        maps = []
        #r=root, d=driectories, f= files
        for r,d,f in walk(Maps.path_):
            for dir in d:
                f = open(Maps.path_ + '/' + dir + '/info.yaml', 'r')
                shutil.copy(Maps.path_ + '/' + dir + '/navigation.png', rospkg.RosPack().get_path('rtcrobot_webinterface') + '/www/assets/img/maps/'+ dir +'.png')
                obj = yaml.load(f.read())
                maps.append(obj)

            #f_yaml = open(self.path_ + '/maps.yaml')
            #self.maps_info_ = yaml.load(f_yaml.read())
            #for map in self.maps_info_['map_source']:
                #f = open(self.path_ + '/' + map + '/config.json', 'r')
                #obj = json.loads(f.read())
                #if obj['createtime'] < date
                #maps.insert(-1, obj)
            return maps

    @staticmethod
    def getmaps():
        Maps.gmaps_ = Maps.loadmaps()
        return Maps.gmaps_
        #return self.maps_

    def pubmaps(self):
        nodes =[]
        topics_nav = ['maps/navigation/map']
        topics_wall = ['maps/wall/map']
        for map in Maps.gmaps_:
            for r,d,f in walk(self.path_ +'/' + map['name']):
                for file in f:
                    if '.yaml' in file and file != 'info.yaml':
                        maptype = file.replace('.yaml','')
                        topic_name = 'maps/'+ maptype +'/' + map['name'] +'/map' 
                        node = roslaunch.core.Node(package='map_server', node_type='map_server', name='map_'+map['name']+'_' + maptype, args=self.path_+'/'+map['name']+'/'+file + ' _frame_id:="map"', remap_args=[('map',topic_name)])
                        
                        if (maptype == 'navigation'):
                            topics_nav.append(topic_name)
                            #self.mux_navmaps_.add_topic(topic_name)
                            #self.mux_navmaps_.select_topic(topic_name)
                            pass
                        
                        elif (maptype == 'wall'):
                            topics_wall.append(topic_name)
                            ##self.mux_wallmaps_.add_topic(topic_name)
                            #self.mux_wallmaps_.select_topic(topic_name)
                            pass
                        
                        nodes.append(node)

        print len(nodes)
        args = ' '
        args = args.join(topics_nav)
        node_muxnav = roslaunch.core.Node(package='topic_tools', node_type='mux', name='mux_navmaps', args=args + ' _latch:="true" _lazy:="true"', remap_args=[('mux','mux_navmaps')], output='screen')
        args = ' '
        args = args.join(topics_wall)
        node_muxwall = roslaunch.core.Node(package='topic_tools', node_type='mux', name='mux_wallmaps', args=args  + ' _latch:="true"  _lazy:="true"', remap_args=[('mux','mux_wallmaps')], output='screen')
        nodes.append(node_muxnav)
        nodes.append(node_muxwall)
        print nodes

        for n in nodes:
            process = self.launch.launch(n)
            self.process_.append(process)
        pass


    #y = "2020-04-04 14:45:08.126754"
    #d = datetime.datetime.strptime(y,'%Y-%m-%d %H:%M:%S.%f')
