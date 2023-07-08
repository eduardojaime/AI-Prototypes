from dotenv import load_dotenv
import os
# load .env variables
load_dotenv()
# test
print(os.getenv('API_KEY'))