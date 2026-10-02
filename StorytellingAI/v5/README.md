# StorytellingAI

StorytellingAI is a Node.js command-line application for turning a prepared, table-formatted script into narrated videos. It supports English or Spanish narration, long-form or vertical Shorts formats, and configurable themes. In the documented happy path, local ComfyUI workflows generate still images and Qwen3 TTS narration; FFmpeg then assembles the assets into video files.

The script is read from `input/response-multi.mdtext`. Each content row supplies an image prompt and narration text. Generated assets are stored in `input/`, and rendered videos are organized under `output/<year>/<week>/`.

## Architecture

```mermaid
flowchart LR
	CLI[app.js<br/>CLI orchestration] --> Script[assets-generator-script.js<br/>Read prepared script]
	CLI --> Image[assets-generator-image.js<br/>Image generation]
	CLI --> Audio[assets-generator-audio.js<br/>Narration generation]
	CLI --> Video[assets-generator-video.js<br/>Video assembly]
	CLI --> Config[configs.js<br/>Settings, workflows, themes]
	Image --> Config
	Audio --> Config
	Script --> Config
	Image --> Comfy[Local ComfyUI]
	Audio --> Comfy
	Video --> FFmpeg[FFmpeg / FFprobe]
	Script -. reads .-> Input[(input/response-multi.mdtext)]
	Image -. writes .-> Assets[(input/*.png)]
	Audio -. writes .-> AssetsAudio[(input/*.mp3)]
	Video -. renders .-> Output[(Rendered videos<br/>year/week folders)]
```

## Modules and functions

The modules below are CommonJS files. `app.js` is the executable entry point; its functions are internal and are not exported. The generator modules expose the public functions listed below. Other listed functions are internal helpers.

```mermaid
classDiagram
	class app_js {
		<<entry point>>
		-Main()
		-GetAnswer(question)
		-SelectLanguage()
		-SelectNarrationType()
		-SelectTheme()
		-SelectFormat()
		-SelectComfyUIOption()
		-SelectComfyUIModelOption()
		-SelectVideoClipOption()
		-ProcessScript(...)
		-GenerateShortVideos(scriptArr)
		-GenerateLongVideo(scriptArr)
		-GenerateVideoOutput(language, isVideoClip)
		-Setup()
		-CleanUp()
		-RestoreFiles(assetsFolder, outputFolder)
		-getWeek()
	}
	class image_generator {
		<<assets-generator-image.js>>
		+GenerateImage(...)
		-generateImageWithComfyUI(...)
		-generateImageWithStabilityAI(...)
		-generateVideoClip(...)
		-generateText2VideoWithComfyUI(...)
		-generateVideoWithStabilityAI(...)
		-generateVideoWithGoogleAPI(...)
		-getDimensions(isShort)
		-getRandomInt(min, max)
		-sleep(ms)
	}
	class audio_generator {
		<<assets-generator-audio.js>>
		+GenerateAudio(...)
		-generateAudioWithComfyUI(...)
		-generateAudioAPI(...)
		-generateAudioSDK(...)
		-readableStreamToBuffer(stream)
		-getRandomInt(min, max)
		-sleep(ms)
	}
	class video_generator {
		<<assets-generator-video.js>>
		+ProcessFiles(...)
		-getDuration(filePath)
		-mergeAudioAndImages(...)
		-mergeVideoAndAudio(...)
		-concatVideos(videoFiles, finalOutput, isVideoClip)
		-addBackgroundEffect(...)
	}
	class script_generator {
		<<assets-generator-script.js>>
		+ReadScriptFile(scriptPath)
		+GenerateScript(...)
	}
	class configs {
		<<configs.js>>
		+Settings
		+ComfyUI
		+Themes
		+StabilityAI
		+ElevenLabs
		+OpenAI
		+Google
	}
	app_js --> image_generator : calls GenerateImage
	app_js --> audio_generator : calls GenerateAudio
	app_js --> video_generator : calls ProcessFiles
	app_js --> script_generator : reads script
	app_js --> configs : reads settings
	image_generator --> configs : workflow and format settings
	audio_generator --> configs : ComfyUI endpoint
```

`+` marks exported functions or values; `-` marks internal implementation functions (not JavaScript `#private` members). The functions in `app.js` are internal. `GenerateScript()` is deprecated, and `generateAudioAPI()` / `generateAudioSDK()` are inactive alternate paths.

### Module responsibilities

| Module | Responsibility | Public API |
| --- | --- | --- |
| `app.js` | Prompts for generation options, reads and processes script rows, manages assets, and starts rendering. | Executable entry point; no exported API. |
| `assets-generator-script.js` | Reads the prepared script. Also contains the deprecated script-generation path. | `ReadScriptFile()`, `GenerateScript()` (deprecated). |
| `assets-generator-image.js` | Generates and caches image assets; also contains optional video-clip and alternate-provider helpers. | `GenerateImage()`. |
| `assets-generator-audio.js` | Generates and caches narration audio. The active dispatcher uses ComfyUI. | `GenerateAudio()`. |
| `assets-generator-video.js` | Pairs audio with still images or clips, joins segments, and creates a background-music version. | `ProcessFiles()`. |
| `configs.js` | Exposes theme prompts/assets, ComfyUI workflow paths and dimensions, and other provider settings. | `configs` object. |

## ComfyUI generation sequence (happy path)

This sequence documents long-form video generation with still images and ComfyUI Qwen3 TTS. It omits the inactive ElevenLabs and other alternate-generator paths. Existing assets are reused when their expected files are already present.

```mermaid
sequenceDiagram
participant User
participant App as app.js / Main()
participant Script as assets-generator-script.js
participant Image as assets-generator-image.js
participant Audio as assets-generator-audio.js
participant Comfy as Local ComfyUI
participant Video as assets-generator-video.js
participant FFmpeg
participant Disk as input/ and output/

User->>App: Select language, voice, theme, and long format
App->>Disk: Restore selected theme assets and create output folder
App->>Script: ReadScriptFile(input/response-multi.mdtext)
Script->>Disk: Read script text
Script-->>App: Script text
App->>App: GenerateLongVideo(scriptArr)

loop Each script row (image pass)
    App->>Image: GenerateImage(prompt, index, format, theme, ComfyUI=true)
    Image->>Disk: Check for existing image
    alt Image is not cached
        Image->>Disk: Load ZImage workflow JSON
        Image->>Image: Apply theme prompt, dimensions, seed, and output filename
        Image->>Comfy: POST workflow to /prompt
        Comfy-->>Image: prompt_id
        loop Until queue is reported empty
            Image->>Comfy: Check configured ComfyUI endpoint
            Comfy-->>Image: Queue status
        end
        Comfy->>Disk: Save PNG to input/
    end
    Image-->>App: Image ready
end

loop Each script row (audio pass)
    App->>Audio: GenerateAudio(narration, index, language)
    Audio->>Disk: Check for existing audio
    alt Audio is not cached
        Audio->>Disk: Load Qwen3 TTS workflow JSON
        Audio->>Audio: Set narration text and output filename prefix
        Audio->>Comfy: POST workflow to /prompt
        Comfy-->>Audio: prompt_id
        loop Until queue is reported empty
            Audio->>Comfy: Check configured ComfyUI endpoint
            Comfy-->>Audio: Queue status
        end
        Comfy->>Disk: Save generated MP3 to ComfyUI output folder
        Audio->>Disk: Copy MP3 to input/audio-XX-LANG.mp3
    end
    Audio-->>App: Audio ready
    App->>Disk: Append narration to subtitles.srt
end

App->>Disk: Collect images and language-matched MP3s
App->>App: Verify non-zero, matching asset counts
App->>Video: ProcessFiles(audioFiles, frameFiles, ...)
loop Each audio/image pair
    Video->>Video: getDuration(audio)
    Video->>FFmpeg: mergeAudioAndImages(image, audio, segment)
    FFmpeg-->>Video: Segment MP4
end
Video->>FFmpeg: concatVideos(segments, finalOutput)
FFmpeg-->>Video: Narrated video
Video->>FFmpeg: addBackgroundEffect(finalOutput, background.mp3)
FFmpeg-->>Video: Video with background music
Video->>Disk: Save both final MP4 outputs
Video-->>App: Processing complete
```

For Shorts, `GenerateShortVideos()` instead processes rows in batches of `Settings.ShortIncrement` (currently 4) and assembles a separate output for each batch.

### ComfyUI runtime assumptions

- The configured ComfyUI URL is `http://127.0.0.1:8188/prompt`.
- Image and audio generation poll that configured URL for `exec_info.queue_remaining`; the local ComfyUI setup must provide the response shape expected by the code.
- The Qwen3 TTS workflow saves audio under the `AUDIOTEMP/` prefix. `generateAudioWithComfyUI()` currently copies the result from a hard-coded Windows ComfyUI output directory in `assets-generator-audio.js`; update that path if your ComfyUI output directory differs.

## Objectives

- [x] Multi-theme support for videos with different topics (Horror, programming, etc)
- [x] Integration with ComfyUI custom workflows
- [x] Integration with LLM-enhanced image generation flow (ComfyUI)
- [x] Replace Axios calls with ElevenLabs npm package
- [x] Integration with Vertex AI video generation