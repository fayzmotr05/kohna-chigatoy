#!/usr/bin/env python3
"""
Convert USDZ to GLB.
USDZ is a zip archive containing USD scene + textures.
Uses trimesh to load and export to GLB.
"""
import sys
import os
import zipfile
import tempfile
import trimesh


def convert(input_path: str, output_path: str) -> None:
    # USDZ is a zip — extract and find the mesh files inside
    ext = os.path.splitext(input_path)[1].lower()

    if ext == ".usdz":
        # Try loading directly with trimesh first
        try:
            scene = trimesh.load(input_path, force="scene")
            scene.export(output_path, file_type="glb")
            return
        except Exception:
            pass

        # Fallback: extract zip and load individual mesh files
        with tempfile.TemporaryDirectory() as tmp:
            with zipfile.ZipFile(input_path, "r") as z:
                z.extractall(tmp)

            # Find mesh files inside the extracted archive
            mesh_files = []
            for root, _dirs, files in os.walk(tmp):
                for f in files:
                    fpath = os.path.join(root, f)
                    flow = f.lower()
                    if flow.endswith((".usda", ".usdc", ".usd", ".obj", ".stl", ".ply", ".glb", ".gltf")):
                        mesh_files.append(fpath)

            if not mesh_files:
                raise ValueError(f"No mesh files found in USDZ archive: {input_path}")

            # Try each file until one loads
            for mf in mesh_files:
                try:
                    scene = trimesh.load(mf, force="scene")
                    scene.export(output_path, file_type="glb")
                    return
                except Exception:
                    continue

            raise ValueError(f"Could not load any mesh from USDZ: {mesh_files}")
    else:
        # Direct load for other formats
        scene = trimesh.load(input_path, force="scene")
        scene.export(output_path, file_type="glb")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: convert_usdz.py <input.usdz> <output.glb>", file=sys.stderr)
        sys.exit(1)

    try:
        convert(sys.argv[1], sys.argv[2])
        print(f"OK: {sys.argv[2]}")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
