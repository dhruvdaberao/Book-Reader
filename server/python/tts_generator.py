import sys
import os
import argparse

def generate_tts(text_file, output_file, use_openai=False):
    # Read the text to synthesize
    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read().strip()

    if not text:
        print("Error: Empty text provided.")
        sys.exit(1)
        
    # Check for OpenAI vs Coqui
    if use_openai:
        try:
            from openai import OpenAI
            client = OpenAI() # expects OPENAI_API_KEY in environment
            
            # OpenAI generates mp3 natively, but for consistency if we want wav, 
            # we'd need ffmpeg. OpenAI's tts-1 does support some formats depending on API, 
            # but default is mp3. Let's just output mp3 and let backend handle it, or we can ask for wav if supported. 
            # OpenAI supports 'wav' via response_format='wav'.
            response = client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text,
                response_format="wav"
            )
            response.stream_to_file(output_file)
            print(f"Successfully generated (OpenAI): {output_file}")
            return
        except Exception as e:
            print(f"OpenAI TTS failed: {e}. Falling back to Coqui TTS.")
    
    # Coqui TTS
    try:
        from TTS.api import TTS
        import torch
        
        # Determine device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Load the default model (FastPitch is very fast, or VITS for better quality)
        # Using a fast standard english model
        model_name = "tts_models/en/ljspeech/vits"
        
        print(f"Loading Coqui TTS model: {model_name} on {device}...")
        tts = TTS(model_name).to(device)
        
        # Generate Audio
        print("Synthesizing audio...")
        tts.tts_to_file(text=text, file_path=output_file)
        
        print(f"Successfully generated: {output_file}")
        
    except ImportError:
        print("Error: Coqui TTS is not installed. Run 'pip install TTS'")
        sys.exit(1)
    except Exception as e:
        print(f"Coqui TTS failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate TTS from text file")
    parser.add_argument("--text_file", required=True, help="Path to text file containing text to read")
    parser.add_argument("--output_file", required=True, help="Path to output .wav file")
    parser.add_argument("--openai", action="store_true", help="Use OpenAI API instead of local Coqui TTS")
    
    args = parser.parse_args()
    
    # Check if we should use OpenAI (e.g. env var is set and requested)
    use_openai = args.openai and os.environ.get("OPENAI_API_KEY") is not None
    
    generate_tts(args.text_file, args.output_file, use_openai)
