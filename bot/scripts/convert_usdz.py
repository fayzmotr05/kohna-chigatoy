#!/usr/bin/env python3
"""
Convert USDZ to GLB.
USDZ is a zip archive containing USD scene + textures.
Uses trimesh to load and export to GLB with multiple fallback strategies.
"""
import sys
import os
import zipfile
import tempfile
import traceback

try:
    import trimesh
except ImportError:
    print("ERROR: trimesh not installed. Run: pip3 install trimesh numpy pygltflib", file=sys.stderr)
    sys.exit(1)


MESH_EXTENSIONS = (
    ".usda", ".usdc", ".usd",
    ".obj", ".stl", ".ply",
    ".glb", ".gltf",
    ".dae", ".fbx",
)


def convert(input_path: str, output_path: str) -> None:
    ext = os.path.splitext(input_path)[1].lower()

    if ext == ".usdz":
        # Strategy 1: Direct load as scene
        try:
            scene = trimesh.load(input_path, force="scene")
            if scene is not None and hasattr(scene, 'export'):
                scene.export(output_path, file_type="glb")
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    return
        except Exception as e:
            print(f"Strategy 1 (direct scene) failed: {e}", file=sys.stderr)

        # Strategy 2: Direct load as mesh
        try:
            mesh = trimesh.load(input_path, force="mesh")
            if mesh is not None and hasattr(mesh, 'export'):
                mesh.export(output_path, file_type="glb")
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    return
        except Exception as e:
            print(f"Strategy 2 (direct mesh) failed: {e}", file=sys.stderr)

        # Strategy 3: Extract zip and try each mesh file inside
        try:
            with tempfile.TemporaryDirectory() as tmp:
                with zipfile.ZipFile(input_path, "r") as z:
                    z.extractall(tmp)

                mesh_files = []
                for root, _dirs, files in os.walk(tmp):
                    for f in files:
                        if f.lower().endswith(MESH_EXTENSIONS):
                            mesh_files.append(os.path.join(root, f))

                if not mesh_files:
                    raise ValueError(f"No mesh files found in USDZ archive: {input_path}")

                errors = []
                for mf in mesh_files:
                    # Try as scene first, then as mesh
                    for force_type in ("scene", "mesh"):
                        try:
                            obj = trimesh.load(mf, force=force_type)
                            if obj is not None and hasattr(obj, 'export'):
                                obj.export(output_path, file_type="glb")
                                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                                    return
                        except Exception as e:
                            errors.append(f"{os.path.basename(mf)} ({force_type}): {e}")

                raise ValueError(
                    f"Could not load any mesh from USDZ.\n"
                    f"Files tried: {[os.path.basename(f) for f in mesh_files]}\n"
                    f"Errors: {errors}"
                )
        except zipfile.BadZipFile:
            raise ValueError(f"File is not a valid USDZ/ZIP archive: {input_path}")

    else:
        # Non-USDZ formats: try scene then mesh
        try:
            scene = trimesh.load(input_path, force="scene")
            scene.export(output_path, file_type="glb")
        except Exception:
            mesh = trimesh.load(input_path, force="mesh")
            mesh.export(output_path, file_type="glb")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: convert_usdz.py <input.usdz> <output.glb>", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    if not os.path.exists(input_file):
        print(f"ERROR: Input file not found: {input_file}", file=sys.stderr)
        sys.exit(1)

    try:
        convert(input_file, output_file)
        size_kb = os.path.getsize(output_file) / 1024
        print(f"OK: {output_file} ({size_kb:.0f} KB)")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
