import os
from yt_dlp import YoutubeDL

# Ask the user for the YouTube video URL
url = input("Enter the YouTube video URL: ")

# Ask the user for the download directory
download_path = input("Enter the path to the download directory: ")

# Ensure the download directory exists or create it
if not os.path.exists(download_path):
    print(f"The specified directory '{download_path}' does not exist. Creating it...")
    os.makedirs(download_path)

# Prompt the user to choose the desired video quality (resolution)
print("\nChoose the desired video quality:")
print("1. 1080p (Full HD)")
print("2. 720p (HD)")
print("3. 480p (SD)")
print("4. Best available quality (Auto)")
quality_choice = input("Enter the number corresponding to your choice (1/2/3/4): ")

# Map user choice to yt-dlp format strings for video quality
quality_map = {
    "1": "bestvideo[height=1080]+bestaudio/best[height=1080]",
    "2": "bestvideo[height=720]+bestaudio/best[height=720]",
    "3": "bestvideo[height=480]+bestaudio/best[height=480]",
    "4": "bestvideo+bestaudio/best",
}

# Get the format string for the selected quality
selected_quality = quality_map.get(quality_choice, "bestvideo+bestaudio/best")

# Prompt the user to choose the download format
print("\nChoose the video format you prefer:")
print("1. MP4 (Recommended for most devices)")
print("2. WEBM (Better for high quality, but limited support)")
print("3. MKV (High quality, but larger file size)")
format_choice = input("Enter the number corresponding to your format choice (1/2/3): ")

# Map user choice to yt-dlp format strings for video format
format_map = {
    "1": "mp4",  # MP4 format (commonly supported)
    "2": "webm",  # WEBM format (better quality, less support)
    "3": "mkv",   # MKV format (high quality, larger file)
}

# Get the format string for the selected video format
selected_format = format_map.get(format_choice, "mp4")

# Configure yt-dlp options based on user selections
options = {
    'format': selected_quality,  # Use the selected video quality
    'outtmpl': os.path.join(download_path, '%(title)s.%(ext)s'),  # Save video with title as filename
    'quiet': False,  # Show progress information
    'noplaylist': True,  # Download only the single video, not a playlist
    'merge_output_format': selected_format,  # Merge audio and video into the selected format
    'writeinfojson': True,  # Save video metadata in JSON format
}

# Inform the user of the selected download details
print(f"\nDownloading video '{url}' in {selected_quality} quality and {selected_format} format.")
print(f"Saving to: {download_path}")

# Extract video details using yt-dlp
try:
    with YoutubeDL(options) as ydl:
        # Extract metadata
        info_dict = ydl.extract_info(url, download=False)
        
        # Display video details
        print("\nVideo Details:")
        print(f"Title: {info_dict.get('title')}")
        print(f"Uploader: {info_dict.get('uploader')}")
        print(f"Description: {info_dict.get('description', 'No description available.')}")
        print(f"View Count: {info_dict.get('view_count')}")
        print(f"Likes: {info_dict.get('like_count')}")
        print(f"Dislikes: {info_dict.get('dislike_count', 'Not available')}")
        print(f"Duration: {info_dict.get('duration')} seconds")
        print(f"Upload Date: {info_dict.get('upload_date')}")

        # Proceed to download the video
        ydl.download([url])

    print("\nDownload completed successfully!")
except Exception as e:
    print(f"An error occurred: {e}")