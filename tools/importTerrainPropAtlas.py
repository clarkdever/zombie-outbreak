#!/usr/bin/env python3
"""Normalize generated environmental prop atlas into fixed runtime cells."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path("public/assets/sprites/generated/terrain-props.png"))
    parser.add_argument("--columns", type=int, default=4)
    parser.add_argument("--rows", type=int, default=11)
    parser.add_argument("--frame-width", type=int, default=128)
    parser.add_argument("--frame-height", type=int, default=96)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    output = Image.new("RGBA", (args.columns * args.frame_width, args.rows * args.frame_height), (0, 0, 0, 0))
    cell_width = source.width / args.columns
    cell_height = source.height / args.rows
    for row in range(args.rows):
        for column in range(args.columns):
            left = round(column * cell_width)
            upper = round(row * cell_height)
            right = round((column + 1) * cell_width)
            lower = round((row + 1) * cell_height)
            cell = remove_magenta(source.crop((left, upper, right, lower)))
            cell.thumbnail((args.frame_width, args.frame_height), Image.Resampling.LANCZOS)
            x = column * args.frame_width + (args.frame_width - cell.width) // 2
            y = (row + 1) * args.frame_height - cell.height
            output.alpha_composite(cell, (x, y))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    output.save(args.out)


def remove_magenta(image: Image.Image) -> Image.Image:
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            distance = max(abs(red - 255), abs(green), abs(blue - 255))
            dominance = min(red, blue) - green
            saturated_magenta = red > 150 and blue > 150 and green < 135 and abs(red - blue) < 90
            if distance < 70 or dominance > 60 or saturated_magenta:
                pixels[x, y] = (red, green, blue, 0)
            else:
                pixels[x, y] = (red, green, blue, alpha)
    return image


if __name__ == "__main__":
    main()
