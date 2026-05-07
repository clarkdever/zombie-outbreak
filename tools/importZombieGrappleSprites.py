#!/usr/bin/env python3
"""Slice generated zombie grapple atlases into runtime sprite strips."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


DIRECTIONS = ("down", "left", "up", "right")
VICTIM_ANIMATIONS = {
    "unarmed-human": ("attackUnarmedHuman", "feedUnarmedHuman"),
    "armed-human": ("attackArmedHuman", "feedArmedHuman"),
    "dog": ("attackDog", "feedDog"),
}
OUTPUT_NAMES = {
    "attackUnarmedHuman": "attack-unarmed-human",
    "feedUnarmedHuman": "feed-unarmed-human",
    "attackArmedHuman": "attack-armed-human",
    "feedArmedHuman": "feed-armed-human",
    "attackDog": "attack-dog",
    "feedDog": "feed-dog",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--victim", choices=VICTIM_ANIMATIONS.keys(), required=True)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, default=Path("public/assets/sprites/generated"))
    parser.add_argument("--frame-size", type=int, default=96)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    cell_width = source.width / 4
    cell_height = source.height / 8
    attack_animation, feed_animation = VICTIM_ANIMATIONS[args.victim]

    for row in range(8):
      animation = attack_animation if row < 4 else feed_animation
      direction = DIRECTIONS[row % 4]
      strip = Image.new("RGBA", (args.frame_size * 4, args.frame_size), (0, 0, 0, 0))
      for column in range(4):
        left = round(column * cell_width)
        upper = round(row * cell_height)
        right = round((column + 1) * cell_width)
        lower = round((row + 1) * cell_height)
        frame = remove_magenta(source.crop((left, upper, right, lower)))
        frame.thumbnail((args.frame_size, args.frame_size), Image.Resampling.LANCZOS)
        x = column * args.frame_size + (args.frame_size - frame.width) // 2
        y = args.frame_size - frame.height
        strip.alpha_composite(frame, (x, y))

      out_name = f"zombie-human-{direction}-{OUTPUT_NAMES[animation]}.png"
      strip.save(args.out_dir / out_name)


def remove_magenta(image: Image.Image) -> Image.Image:
    pixels = image.load()
    for y in range(image.height):
      for x in range(image.width):
        red, green, blue, alpha = pixels[x, y]
        magenta_distance = max(abs(red - 255), abs(green - 0), abs(blue - 255))
        magenta_dominance = min(red, blue) - green
        saturated_magenta = red > 150 and blue > 150 and green < 135 and abs(red - blue) < 90
        if magenta_distance < 70 or magenta_dominance > 60 or saturated_magenta:
          pixels[x, y] = (red, green, blue, 0)
        else:
          pixels[x, y] = (red, green, blue, alpha)
    return image


if __name__ == "__main__":
    main()
