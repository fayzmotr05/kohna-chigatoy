#!/usr/bin/env python3
"""
USDZ → GLB converter using Blender headless.
Blender 4.x has mature USD/USDZ import support and reliable glTF export.

Usage: blender --background --python convert_usdz.py -- input.usdz output.glb
"""
import bpy
import sys
import os


def main():
    # Args after the "--" separator (everything before is Blender's own args)
    if "--" not in sys.argv:
        print("ERROR: Missing -- separator. Use: blender --background --python convert_usdz.py -- in.usdz out.glb", file=sys.stderr)
        sys.exit(1)

    argv = sys.argv[sys.argv.index("--") + 1:]
    if len(argv) != 2:
        print("ERROR: Need exactly 2 args (input, output)", file=sys.stderr)
        sys.exit(1)

    input_path, output_path = argv

    if not os.path.exists(input_path):
        print(f"ERROR: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    # Reset Blender to a clean empty scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import USD/USDZ (Blender 4.x supports both natively)
    try:
        bpy.ops.wm.usd_import(filepath=input_path)
    except Exception as e:
        print(f"ERROR: USD import failed: {e}", file=sys.stderr)
        sys.exit(1)

    # Verify something was imported
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type in ('MESH', 'EMPTY')]
    if not mesh_objects:
        print("ERROR: No mesh objects found after USD import", file=sys.stderr)
        sys.exit(1)

    # Export to GLB
    try:
        bpy.ops.export_scene.gltf(
            filepath=output_path,
            export_format='GLB',
            export_apply=True,           # Apply modifiers
            export_yup=True,             # Y-up axis (glTF standard)
            export_image_format='AUTO',  # Keep texture formats
            export_materials='EXPORT',
            export_cameras=False,
            export_lights=False,
        )
    except Exception as e:
        print(f"ERROR: GLB export failed: {e}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(output_path):
        print(f"ERROR: Output file was not created: {output_path}", file=sys.stderr)
        sys.exit(1)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"OK: {output_path} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
