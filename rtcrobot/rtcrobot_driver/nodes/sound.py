#!/usr/bin/env python

import roslib
import rospy
import threading
import os
import logging
import sys
import traceback
import tempfile
from rtcrobot_msgs.msg import Sound

try:
    import gi
    gi.require_version('Gst', '1.0')
    from gi.repository import Gst as Gst
except:
    str="""
**************************************************************
Error opening pygst. Is gstreamer installed?
**************************************************************
"""
    rospy.logfatal(str)
    # print str
    exit(1)

def sleep(t):
    try:
        rospy.sleep(t)
    except:
        pass


class soundtype:
    STOPPED = 0
    LOOPING = 1
    COUNTING = 2

    def __init__(self, file, device, volume = 1.0):
        self.lock = threading.RLock()
        self.state = self.STOPPED
        self.sound = Gst.ElementFactory.make("playbin",None)
        if self.sound is None:
            raise Exception("Could not create sound player")

        if device:
            self.sink = Gst.ElementFactory.make("alsasink", "sink")
            rospy.loginfo(1)
            self.sink.set_property("device", device)
            rospy.loginfo(2)
            self.sound.set_property("audio-sink", self.sink)
            rospy.loginfo(self.sound)
        if (":" in file):
            uri = file
        elif os.path.isfile(file):
            uri = "file://" + os.path.abspath(file)
        else:
          rospy.logerr('Error: URI is invalid: %s'%file)

        self.uri = uri
        self.volume = volume
        self.sound.set_property('uri', uri)
        self.sound.set_property("volume",volume)
        self.staleness = 1
        self.file = file

        self.bus = self.sound.get_bus()
        self.bus.add_signal_watch()
        self.bus_conn_id = self.bus.connect("message", self.on_stream_end)

    def on_stream_end(self, bus, message):
        if message.type == Gst.MessageType.EOS:
            self.stop()

    def __del__(self):
        # stop our GST object so that it gets garbage-collected
        self.dispose()

    def update(self):
        if self.bus is not None:
            self.bus.poll(Gst.MessageType.ERROR, 10)

    def loop(self):
        self.lock.acquire()
        try:
            rospy.loginfo('LOOPING')
            self.staleness = 0
            if self.state == self.COUNTING:
                self.stop()

            if self.state == self.STOPPED or self.state == self.LOOPING:
                self.sound.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH, 0)
                self.sound.set_state(Gst.State.PLAYING)
            self.state = self.LOOPING
        except exceptionName:
            rospy.loginfo(exceptionName)
        finally:
            self.lock.release()

    def dispose(self):
        self.lock.acquire()
        try:
            if self.bus is not None:
                self.sound.set_state(Gst.State.NULL)
                self.bus.disconnect(self.bus_conn_id)
                self.bus.remove_signal_watch()
                self.bus = None
                self.sound = None
                self.sink = None
                self.state = self.STOPPED
        except Exception as e:
            rospy.logerr('Exception in dispose: %s'%str(e))
        finally:
            self.lock.release()

    def stop(self):
        if self.state != self.STOPPED:
            self.lock.acquire()
            try:
                self.sound.set_state(Gst.State.NULL)
                self.state = self.STOPPED
            finally:
                self.lock.release()

    def single(self):
        self.lock.acquire()
        try:
            rospy.logdebug("Playing %s"%self.uri)
            self.staleness = 0
            if self.state == self.LOOPING:
                self.stop()

            self.sound.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH, 0)
            self.sound.set_state(Gst.State.PLAYING)
            self.state = self.COUNTING
        finally:
            self.lock.release()

    def command(self, cmd):
         if cmd == Sound.PLAY_STOP:
             self.stop()
         elif cmd == Sound.PLAY_ONCE:
             self.single()
         elif cmd == Sound.PLAY_START:
             self.loop()

    def get_staleness(self):
        self.lock.acquire()
        position = 0
        duration = 0
        try:
            position = self.sound.query_position(Gst.Format.TIME)[1]
            duration = self.sound.query_duration(Gst.Format.TIME)[1]
        except Exception as e:
            position = 0
            duration = 0
        finally:
            self.lock.release()

        if position != duration:
            self.staleness = 0
        else:
            self.staleness = self.staleness + 1
        return self.staleness

    def get_playing(self):
        return self.state == self.COUNTING

class soundplay: 
    def stopdict(self,dict):
        for sound in dict.values():
            sound.stop()

    def stopall(self):
        self.stopdict(self.builtinsounds)
        self.stopdict(self.filesounds)
        self.stopdict(self.voicesounds)

    def select_sound(self, data):
        if data.sound == Sound.PLAY_FILE:
            absfilename = os.path.join(roslib.packages.get_pkg_dir('rtcrobot_base'),'sounds', data.arg)
            if not absfilename in self.filesounds.keys():
                rospy.loginfo('command for uncached wave: "%s"'%absfilename)
                try:
                    self.filesounds[absfilename] = soundtype(absfilename, self.device, data.volume)
                except:
                     rospy.logerr('Error setting up to play "%s". Does this file exist on the machine on which sound_play is running?'%(data.arg))
                     return
            else:
                rospy.logdebug('command for cached wave: "%s"'%absfilename)
                if self.filesounds[absfilename].sound.get_property('volume') != data.volume:
                     rospy.logdebug('volume for cached wave has changed, resetting volume')
                     self.filesounds[absfilename].sound.set_property('volume', data.volume)
            sound = self.filesounds[absfilename]
        elif data.sound == Sound.SAY:
            # print data
            if not data.arg in self.voicesounds.keys():
                rospy.logdebug('command for uncached text: "%s"' % data.arg)
                txtfile = tempfile.NamedTemporaryFile(prefix='sound_play', suffix='.txt')
                (wavfile,wavfilename) = tempfile.mkstemp(prefix='sound_play', suffix='.wav')
                txtfilename=txtfile.name
                os.close(wavfile)
                voice = data.arg2
                try:
                    try:
                        txtfile.write(data.arg.decode('UTF-8').encode('ISO-8859-15'))
                    except UnicodeEncodeError:
                        txtfile.write(data.arg)
                    txtfile.flush()
                    os.system("text2wave -eval '("+voice+")' "+txtfilename+" -o "+wavfilename)
                    try:
                        if os.stat(wavfilename).st_size == 0:
                            raise OSError # So we hit the same catch block
                    except OSError:
                        rospy.logerr('Sound synthesis failed. Is festival installed? Is a festival voice installed? Try running "rosdep satisfy sound_play|sh". Refer to http://wiki.ros.org/sound_play/Troubleshooting')
                        return
                    self.voicesounds[data.arg] = soundtype(wavfilename, self.device, data.volume)
                finally:
                    txtfile.close()
            else:
                rospy.logdebug('command for cached text: "%s"'%data.arg)
                if self.voicesounds[data.arg].sound.get_property('volume') != data.volume:
                    rospy.logdebug('volume for cached text has changed, resetting volume')
                    self.voicesounds[data.arg].sound.set_property('volume', data.volume)
            sound = self.voicesounds[data.arg]
        else:
            rospy.logdebug('command for builtin wave: %i'%data.sound)
            if data.sound not in self.builtinsounds or (data.sound in self.builtinsounds and data.volume != self.builtinsounds[data.sound].volume):
                params = self.builtinsoundparams[data.sound]
                volume = data.volume
                if params[1] != 1: # use the second param as a scaling for the input volume
                    volume = (volume + params[1])/2
                self.builtinsounds[data.sound] = soundtype(params[0], self.device, volume)
            sound = self.builtinsounds[data.sound]
        if sound.staleness != 0 and data.command != Sound.PLAY_STOP:
            # This sound isn't counted in active_sounds
            rospy.logdebug("activating %i %s"%(data.sound,data.arg))
            self.active_sounds = self.active_sounds + 1
            sound.staleness = 0
            #                    if self.active_sounds > self.num_channels:
            #                        mixer.set_num_channels(self.active_sounds)
            #                        self.num_channels = self.active_sounds
        return sound

    def callback(self,data):
        if not self.initialized:
            return
        self.mutex.acquire()
        # Force only one sound at a time
        self.stopall()
        try:
            if data.sound == Sound.ALL and data.command == Sound.PLAY_STOP:
                self.stopall()
            else:
                sound = self.select_sound(data)
                sound.command(data.command)
        except Exception as e:
            rospy.logerr('Exception in callback: %s'%str(e))
            rospy.loginfo(traceback.format_exc())
        finally:
            self.mutex.release()
            rospy.logdebug("done callback")

    # Purge sounds that haven't been played in a while.
    def cleanupdict(self, dict):
        purgelist = []
        for (key,sound) in dict.iteritems():
            try:
                staleness = sound.get_staleness()
            except Exception as e:
                rospy.logerr('Exception in cleanupdict for sound (%s): %s'%(str(key),str(e)))
                staleness = 100 # Something is wrong. Let's purge and try again.
            #print "%s %i"%(key, staleness)
            if staleness >= 0:
                if sound.state == 1:
                    sound.loop()
                else:
                    purgelist.append(key)
            if staleness == 0: # Sound is playing
                self.active_sounds = self.active_sounds + 1
        for key in purgelist:
           rospy.logdebug('Purging %s from cache'%key)
           dict[key].dispose() # clean up resources
           del dict[key]

    def cleanup(self):
        self.mutex.acquire()
        try:
            self.active_sounds = 0
            self.cleanupdict(self.filesounds)
            self.cleanupdict(self.voicesounds)
            self.cleanupdict(self.builtinsounds)
        except:
            rospy.loginfo('Exception in cleanup: %s'%sys.exc_info()[0])
        finally:
            self.mutex.release()

    def __init__(self):
        Gst.init(None)
        rospy.init_node('soundplay')
        self.device = rospy.get_param("~device", "default")

        self.no_error = True
        self.initialized = False
        self.active_sounds = 0

        self.mutex = threading.Lock()
        sub = rospy.Subscriber("robotsound", Sound, self.callback)

        self.mutex.acquire()
        self.sleep(0.5) # For ros startup race condition

        while not rospy.is_shutdown():
            while not rospy.is_shutdown():
                self.init_vars()
                self.no_error = True
                self.initialized = True
                self.mutex.release()
                try:
                    self.idle_loop()
                    # Returns after inactive period to test device availability
                    #print "Exiting idle"
                except:
                    rospy.loginfo('Exception in idle_loop: %s'%sys.exc_info()[0])
                finally:
                    self.mutex.acquire()

        self.mutex.release()

    def init_vars(self):
        self.num_channels = 10
        self.builtinsounds = {}
        self.filesounds = {}
        self.voicesounds = {}
        self.hotlist = []
        if not self.initialized:
            rospy.loginfo('Ready to play sound')

    def sleep(self, duration):
        try:
            rospy.sleep(duration)
        except rospy.exceptions.ROSInterruptException:
            pass

    def idle_loop(self):
        self.last_activity_time = rospy.get_time()
        s = None
        loop =False
        while (rospy.get_time() - self.last_activity_time < 5 or
                 len(self.builtinsounds) + len(self.voicesounds) + len(self.filesounds) > 0) \
                and not rospy.is_shutdown():
            self.sleep(0.5)
            self.cleanup()
        #print "idle_exiting"

if __name__ == '__main__':
    soundplay()
