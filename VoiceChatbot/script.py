import sounddevice as sd
import soundfile as sf
import requests
import winsound
import openai
import os
import re
from colorama import Fore, Style, init
from pydub import AudioSegment
from dotenv import load_dotenv

# load .env variables
load_dotenv()

def open_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as infile:
        return infile.read()
init()

openai_key = os.getenv('OPENAI_SECRET')
eleven_labs_key = os.getenv('ELEVENLABS_SECRET')
# voice_id = '21m00Tcm4TlvDq8ikWAM'
voice_id = 'XgemEVqDkz11K6s6rSgO' 
record = True

conversation1 = []  
system_prompt = open_file('system_prompt.txt')

def chatgpt(conversation, chatbot, user_input, temperature=0.9, frequency_penalty=0.2, presence_penalty=0):
    openai.api_key = openai_key
    conversation.append({"role": "user","content": user_input})
    messages_input = conversation.copy()
    prompt = [{"role": "system", "content": chatbot}]
    messages_input.insert(0, prompt[0])
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-16k",
        temperature=temperature,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty,
        messages=messages_input)
    chat_response = completion['choices'][0]['message']['content']
    conversation.append({"role": "assistant", "content": chat_response})
    return chat_response

def text_to_speech(text):
    url = f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}'
    headers = {
        'Accept': 'audio/mpeg',
        'xi-api-key': eleven_labs_key,
        'Content-Type': 'application/json'
    }
    data = {
        'text': text,
        'model_id': 'eleven_monolingual_v1', # 'eleven_multilingual_v1',
        'voice_settings': {
            'stability': 0.5,
            'similarity_boost': 0.75
        }
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        with open('output.mp3', 'wb') as f:
            f.write(response.content)
            f.close() # close the file stream
        sound = AudioSegment.from_mp3('output.mp3')
        sound.export('output.wav', format="wav") # export to wav in order to use winsound playback
        filename = 'output.wav'
        winsound.PlaySound(filename, winsound.SND_FILENAME)
    else:
        print('Error:', response.text)

def print_colored(agent, text):
    agent_colors = {
        "TutorAI": Fore.YELLOW,
    }
    color = agent_colors.get(agent, "")
    print(color + f"{agent}: {text}" + Style.RESET_ALL, end="")


def record_and_transcribe(duration=8, fs=44100):
    print('Recording...')
    myrecording = sd.rec(int(duration * fs), samplerate=fs, channels=2)
    sd.wait()
    print('Recording complete.')
    filename = 'myrecording.wav'
    sf.write(filename, myrecording, fs)
    with open(filename, "rb") as file:
        openai.api_key = openai_key
        result = openai.Audio.transcribe("whisper-1", file)
    transcription = result['text']
    return transcription

while record:
    user_input = input("To ask a question press 'Y'...")
    if (user_input.capitalize() == 'Y') :
        user_message = record_and_transcribe()
        response = chatgpt(conversation1, system_prompt, user_message)
        print_colored("TutorAI", f"{response}\n\n")
        user_message_without_generate_image = re.sub(r'(Response:|Narration:|Image: generate_image:.*|)', '', response).strip()
        text_to_speech(user_message_without_generate_image)
    else : 
        record = False