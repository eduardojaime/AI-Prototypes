import sounddevice as sd
import soundfile as sf
import numpy as np
import openai
import os
import requests
import re
from colorama import Fore, Style, init
import datetime
import base64
from pydub import AudioSegment
from pydub.playback import play
from dotenv import load_dotenv
import winsound

sound = AudioSegment.from_mp3('output.mp3')
sound.export('output.wav', format="wav")
filename = 'output.wav'
winsound.PlaySound(filename, winsound.SND_FILENAME)

# os.environ['TMP'] = 'D:\Source\AI\AI-Prototypes\VoiceChatbot'
# audio = AudioSegment.from_wav('myrecording.wav')
# audio = AudioSegment.from_mp3('output.mp3')
# audio = AudioSegment.from_file('output.mp3')
# play(audio)