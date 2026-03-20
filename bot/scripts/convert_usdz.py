#!/usr/bin/env python3
"""Convert USDZ to GLB using trimesh."""
import sys
import trimesh

def convert(input_path: str, output_path: str) -> None:
    scene = trimesh.load(input_path, force="scene")
    scene.export(output_path, file_type="glb")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: convert_usdz.py <input.usdz> <output.glb>", file=sys.stderr)
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])
