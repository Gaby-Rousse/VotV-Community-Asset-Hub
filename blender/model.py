import bpy, sys, glob, os
import operator as op

# model.py -- <folder_path> <output_path>
args        = sys.argv[sys.argv.index("--") + 1:]
folder_path = args[0]
output_path = args[1]

# Start with an empty scene.
bpy.ops.wm.read_factory_settings(use_empty=True)

# Find the first .obj
objs = sorted(glob.glob(os.path.join(folder_path, '**', '*.obj'), recursive=True))
obj_path = objs[0]
# That's where we are working now
obj_folder = os.path.dirname(obj_path)

# Import the .obj.
bpy.ops.wm.obj_import(filepath=obj_path)

# Remove the collision meshes. They always starts with "UCX".
for obj in list(bpy.data.objects):
    if obj.name.upper().startswith("UCX"):
        bpy.data.objects.remove(obj, do_unlink=True)

# huge discovery because i'm a dumbass, votv works as follow: <material type>_<material name>.png => diffuse_claude.png if one material but can also be diffuse_face.png, diffuse_body.png, etc.
# the goal then is to pick all the textures and reapply them because somehow the mtl is USELESS.
diffuse_list = []
emissive_list = []
normal_list = []
pbr_list = []

images = glob.glob(os.path.join(obj_folder, '**', '*.png'), recursive=True)
for image in images:
    if op.contains(image, "diffuse"):
        diffuse_list.append(image)
    elif op.contains(image, "emissive"):
        emissive_list.append(image)
    elif op.contains(image, "normal"):
        normal_list.append(image)
    elif op.contains(image, "pbr"):
        pbr_list.append(image)

# https://rexbytes.com/2023/07/17/adding-materials-texture-to-blender-objects-part-2/ thank you
for diffuseTexture in diffuse_list:
    file_name = os.path.basename(diffuseTexture)
    file_name_without_ext = file_name[:-4]
    material_name = file_name_without_ext.split("_",1)[1]
    material = bpy.data.materials.get(material_name)
    if material is None:
        continue #it somehow doesn't exist. sussy!!!
    material.use_nodes = True
    tree = material.node_tree
    nodes = tree.nodes
    nodes.clear()
    node_principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_texture = nodes.new(type='ShaderNodeTexImage')
    image = bpy.data.images.load(diffuseTexture)
    node_texture.image = image
    node_texture.interpolation = 'Closest'
    links = tree.links
    links.new(node_texture.outputs['Color'], node_principled.inputs['Base Color'])
    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(node_principled.outputs['BSDF'], node_output.inputs['Surface'])

# Repeat with emissive, normal, pbr
# im tired so not yet.

bpy.ops.export_scene.gltf(filepath=output_path, export_format='GLB')