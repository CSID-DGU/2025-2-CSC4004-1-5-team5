import subprocess
import os

def convert_to_wav(input_path):
    """
    m4a/mp3 등 어떤 형식이든 wav(16kHz, mono)로 변환.
    반환: wav 파일 경로
    """
    base, _ = os.path.splitext(input_path)
    output_path = f"{base}.wav"

    # ffmpeg 명령어 (덮어쓰기 허용 -y)
    command = [
        "ffmpeg",
        "-i", input_path,
        "-ac", "1",            # mono
        "-ar", "16000",        # sample rate (whisper + separator 모델 기준)
        "-y",                  # overwrite
        output_path
    ]

    try:
        subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return output_path
    except subprocess.CalledProcessError as e:
        print("[ERROR] ffmpeg 변환 실패:", e)
        return None
