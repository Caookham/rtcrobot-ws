#!/usr/bin/env python

import rospy

from topic_tools.srv import MuxAdd
from topic_tools.srv import MuxDelete
from topic_tools.srv import MuxList
from topic_tools.srv import MuxSelect


class MuxService():
    def __init__(self,ns):
        self.namespace_ = ns
        try:
            rospy.wait_for_service(self.namespace_ + '/add', 5)
            rospy.wait_for_service(self.namespace_ + '/delete', 5)
            rospy.wait_for_service(self.namespace_ + '/list', 5)
            rospy.wait_for_service(self.namespace_ + '/select', 5)
        except rospy.ROSException as e:
            pass

        self.add_srv_ = rospy.ServiceProxy(self.namespace_ + '/add', MuxAdd)
        self.delete_srv_ = rospy.ServiceProxy(self.namespace_ + '/delete', MuxDelete)
        self.list_srv_ = rospy.ServiceProxy(self.namespace_ + '/list', MuxList)
        self.select_srv_ = rospy.ServiceProxy(self.namespace_ + '/select', MuxSelect)
        pass

    def add_topic(self, topic):
        topic = '/' + topic
        topics = self.list_srv_().topics
        
        print topics
        if not topic in topics:
            print "aaaaaa"
            print topic
            self.add_srv_(topic)
            pass
    
    def select_topic(self, topic):
        topic = '/' + topic
        topics = self.list_srv_().topics
        if topic in topics:
            self.select_srv_(topic)
            pass


    #y = "2020-04-04 14:45:08.126754"
    #d = datetime.datetime.strptime(y,'%Y-%m-%d %H:%M:%S.%f')