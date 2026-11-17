"""Prepare CC0 field recordings as compact, DC-filtered, seamless loops.
Install imageio-ffmpeg into artifacts/asset-tools for offline preparation only.
"""
import pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path('artifacts/asset-tools').resolve()))
import imageio_ffmpeg
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
pathlib.Path('public/audio').mkdir(exist_ok=True)
# Measured after filtering: the originals are only -49/-51/-41 dB RMS.
# Offline gain preserves seamless loops without a runtime normalizer. Peaks retain headroom.
for name, duration, start, gain in [('birds', 73, 12, 26), ('wind', 61, 15, 23), ('river', 53, 20, 17)]:
    # Tail blends into the head; the middle-to-blend and wrap boundaries remain continuous.
    filters = (f'[0:a]atrim=start={start}:duration={duration+5},asetpts=PTS-STARTPTS,'
        'highpass=f=100,lowpass=f=11000,asplit=3[a][b][c];'
        '[a]atrim=0:5,asetpts=PTS-STARTPTS[head];'
        f'[b]atrim=5:{duration},asetpts=PTS-STARTPTS[middle];'
        f'[c]atrim={duration}:{duration+5},asetpts=PTS-STARTPTS[tail];'
        '[tail][head]acrossfade=d=5:c1=tri:c2=tri[seam];'
        f'[middle][seam]concat=n=2:v=0:a=1,volume={gain}dB[out]')
    subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'warning', '-i', f'artifacts/source-assets/{name}.wav',
        '-filter_complex', filters, '-map', '[out]', '-ar', '32000', '-ac', '1' if name == 'river' else '2',
        '-c:a', 'libvorbis', '-q:a', '4', f'public/audio/{name}.ogg'], check=True)
    print(name, pathlib.Path(f'public/audio/{name}.ogg').stat().st_size)
