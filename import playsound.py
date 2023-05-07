import playsound
import serial

arduino = serial.Serial("COM3", 9600)
while True:
    msg = arduino.readline().decode().rstrip()
    if (msg == "Don't kick with front foot"):
        playsound.playsound("Record (online-voice-recorder.com) (3).mp3")
    elif (msg == "Great Power"):
        playsound.playsound("mostpower.mp3")
    elif (msg == "Good Power"):
        playsound.playsound("goodpower.mp3")
    elif (msg == "A little more power"):
        playsound.playsound("alittlemorepower.mp3")
    else:
        print(msg)