import torchaudio

def load_wav_tensor(file_path):
    tensor, sr = torchaudio.load(file_path)
    tensor = tensor.mean(dim=0, keepdim=True)  # mono
    return tensor, sr
