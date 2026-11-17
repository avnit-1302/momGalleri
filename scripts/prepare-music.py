"""Prepare the locally downloaded CC0 Lifewave 2k for quiet streaming playback."""
import pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path('artifacts/asset-tools').resolve()))
import imageio_ffmpeg
filters = (
    '[0:a]atrim=0:187,asetpts=PTS-STARTPTS,asplit=3[a][b][c];'
    '[a]atrim=0:5,asetpts=PTS-STARTPTS[head];'
    '[b]atrim=5:182,asetpts=PTS-STARTPTS[middle];'
    '[c]atrim=182:187,asetpts=PTS-STARTPTS[tail];'
    '[tail][head]acrossfade=d=5:c1=tri:c2=tri[seam];'
    '[middle][seam]concat=n=2:v=0:a=1,volume=-4dB[out]'
)
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-hide_banner', '-loglevel', 'warning',
    '-i', 'artifacts/source-assets/lifewave-2k.mp3', '-filter_complex', filters, '-map', '[out]',
    '-ar', '32000', '-ac', '2', '-c:a', 'libvorbis', '-q:a', '4',
    '-metadata', 'title=Lifewave 2k', '-metadata', 'artist=The Cynic Project',
    '-metadata', 'license=CC0-1.0', 'public/audio/music.ogg'], check=True)
print(pathlib.Path('public/audio/music.ogg').stat().st_size)
