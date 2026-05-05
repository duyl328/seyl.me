#!/usr/bin/env python3
"""
将 JPG/MOV（Live Photo）处理后输出到 out/ 目录：
1. JPG：从 EXIF 读取拍摄时间，去除 EXIF，修正旋转，转为 WebP
2. MOV：与同名 JPG 配对，转为 MP4（去音频，压缩），文件名与 WebP 相同

依赖：pip install Pillow
      ffmpeg（用于 MOV 转 MP4）
用法：python process_photos.py <图片1.jpg> [图片2.jpg ...]
      python process_photos.py /path/to/*.jpg
      python process_photos.py --ffmpeg /path/to/ffmpeg *.jpg
"""

import argparse
import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime

try:
    from PIL import Image, ImageOps
    from PIL.ExifTags import TAGS
except ImportError:
    print("缺少依赖，请先运行：pip install Pillow")
    sys.exit(1)

OUTPUT_DIR = Path(__file__).parent / "out"
WEBP_QUALITY = 85       # 初始质量
MAX_SIZE_BYTES = 1 * 1024 * 1024  # 1MB 上限
QUALITY_STEP = 5        # 每次降低的质量步长
QUALITY_MIN = 20        # 最低质量下限
MAX_LONG_EDGE = 2048    # 最长边限制

FFMPEG_BIN = 'D:/ffmpeg-2026-04-09-git-d3d0b7a5ee-essentials_build/bin/ffmpeg.exe'   # 运行时由 --ffmpeg 参数覆盖


def check_ffmpeg() -> bool:
    try:
        subprocess.run([FFMPEG_BIN, '-version'], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def get_exif_datetime(img: Image.Image) -> datetime | None:
    """从 EXIF 读取拍摄时间，返回 datetime 对象，失败返回 None。"""
    try:
        exif_data = img._getexif()
        if not exif_data:
            return None
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == "DateTimeOriginal":
                return datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return None


def process(src: Path) -> None:
    if not src.exists():
        print(f"[跳过] 文件不存在：{src}")
        return

    with Image.open(src) as img:
        # 读取拍摄时间
        shot_time = get_exif_datetime(img)
        if shot_time is None:
            # 回退到文件修改时间
            mtime = src.stat().st_mtime
            shot_time = datetime.fromtimestamp(mtime)
            print(f"[警告] {src.name} 无 EXIF 时间，使用文件修改时间：{shot_time}")

        # 生成目标文件名：YYYY-MM-DD HH-MM-SS.webp
        filename = shot_time.strftime("%Y-%m-%d %H-%M-%S") + ".webp"
        dest = OUTPUT_DIR / filename

        if dest.exists():
            print(f"[跳过] 已存在：{dest.name}")
            return

        # 应用 EXIF 旋转方向，再去除 EXIF
        img = ImageOps.exif_transpose(img)
        rgb = img.convert("RGB")

        # 最长边超过 2048 则等比缩小
        if max(rgb.size) > MAX_LONG_EDGE:
            rgb.thumbnail((MAX_LONG_EDGE, MAX_LONG_EDGE), Image.LANCZOS)

        # 从初始质量开始，超过 1MB 则逐步降质量
        quality = WEBP_QUALITY
        while True:
            rgb.save(dest, format="WEBP", quality=quality, method=6)
            size = dest.stat().st_size
            if size <= MAX_SIZE_BYTES or quality <= QUALITY_MIN:
                break
            quality -= QUALITY_STEP

        size_kb = dest.stat().st_size // 1024
        note = f"  quality={quality}" if quality < WEBP_QUALITY else ""
        print(f"[完成] {src.name} -> {dest.name}  ({size_kb} KB){note}")

        # 处理同名 MOV（Live Photo）
        mov = src.with_suffix('.mov')
        if not mov.exists():
            mov = src.with_suffix('.MOV')
        if mov.exists():
            process_mov(mov, dest.stem)


def process_mov(src: Path, stem: str) -> None:
    """将 MOV 转为 MP4，去除音频，限制最长边 1920，输出到 out/ 目录。"""
    dest = OUTPUT_DIR / f"{stem}.mp4"
    if dest.exists():
        print(f"[跳过] 已存在：{dest.name}")
        return

    cmd = [
        FFMPEG_BIN, '-i', str(src),
        '-an',                    # 去除音频
        '-vcodec', 'libx264',
        '-crf', '28',             # 压缩质量
        '-preset', 'slow',        # 更好的压缩率
        # 最长边限制 1920，保持原始宽高比，尺寸取偶数（libx264 要求）
        '-vf', 'scale=iw*min(1\\,1920/max(iw\\,ih)):ih*min(1\\,1920/max(iw\\,ih)),scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-movflags', '+faststart', # 支持网页边下边播
        '-y',                     # 覆盖已有文件
        str(dest),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[错误] MOV 转换失败：{src.name}\n{result.stderr[-300:]}")
        return

    size_kb = dest.stat().st_size // 1024
    print(f"[完成] {src.name} -> {dest.name}  ({size_kb} KB)")

def main():
    global FFMPEG_BIN

    parser = argparse.ArgumentParser(
        description='将 JPG/MOV（Live Photo）处理后输出到 out/ 目录',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument('files', nargs='+', help='要处理的 JPG 文件，支持通配符')
    parser.add_argument(
        '--ffmpeg',
        metavar='PATH',
        help='ffmpeg 可执行文件路径（默认从 PATH 中查找）',
    )
    args = parser.parse_args()

    if args.ffmpeg:
        FFMPEG_BIN = args.ffmpeg

    if not check_ffmpeg():
        print("[警告] 未检测到 ffmpeg，MOV 文件将被跳过。安装后重新运行可处理 Live Photo。")

    OUTPUT_DIR.mkdir(exist_ok=True)

    from glob import glob
    for arg in args.files:
        matches = glob(arg)
        if not matches:
            process(Path(arg))
        else:
            for f in sorted(matches):
                process(Path(f))


if __name__ == "__main__":
    main()
