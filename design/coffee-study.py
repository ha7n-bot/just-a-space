"""Original still life for the JUST A SPACE design preview. Run using Blender 4.3."""
import bpy, math, sys, os
from mathutils import Vector
from math import sin, cos, pi
bpy.ops.wm.read_factory_settings(use_empty=True)
s=bpy.context.scene
s.render.engine='CYCLES'
s.cycles.samples=36
s.cycles.use_denoising=False
s.render.threads_mode='FIXED'
s.render.threads=4
s.render.resolution_percentage=100
s.view_settings.view_transform='AgX'
def mat(name,color,rough=.5,noise=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 n=m.node_tree.nodes;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 if noise:
  t=n.new('ShaderNodeTexNoise');t.inputs['Scale'].default_value=noise;t.inputs['Detail'].default_value=3
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.016
  m.node_tree.links.new(t.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
 return m
paper=mat('unglazed sand',(.57,.43,.29),.75,240); glaze=mat('ivory glaze',(.77,.65,.50),.24,150); forest=mat('lichen',(.088,.119,.081),.63,170)
stone=mat('travertine',(.43,.32,.24),.77,48); backdrop=mat('clay',(.33,.229,.15),.89,130); liquid=mat('coffee',(.06,.019,.007),.18);crema=mat('crema',(.46,.215,.073),.43)
def mesh(name,verts,faces,material):
 m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update();obj=bpy.data.objects.new(name,m);s.collection.objects.link(obj);m.materials.append(material);return obj
def pot(name,center,profile,material):
 v=[];f=[];N=128
 for r,h in profile:
  for j in range(N):
   a=2*pi*j/N;v.append((center[0]+r*cos(a),center[1]+r*sin(a),center[2]+h))
 for i in range(len(profile)-1):
  for j in range(N):
   k=i*N+j;l=i*N+(j+1)%N;f.append((k,l,l+N,k+N))
 o=mesh(name,v,f,material)
 for p in o.data.polygons:p.use_smooth=True
 return o
def box(name,pos,scale,angle,material,bevel=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.rotation_euler.z=angle;o.data.materials.append(material)
 b=o.modifiers.new('soft edges','BEVEL');b.width=bevel;b.segments=4;o.modifiers.new('normals','WEIGHTED_NORMAL')
def light(name,pos,energy,size,color,target):
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.data.color=color;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def cup(x,y,z,f,material):
 def prof(P):return [(r*f,h*f) for r,h in P]
 pot('saucer',(x,y,z),prof([(.001,.015),(.47,.015),(.65,.04),(.85,.15),(.89,.16),(.90,.18),(.885,.198),(.84,.19),(.60,.097),(.44,.08),(.001,.08)]),material)
 base=z+.081*f
 pot('cup',(x,y,base),prof([(.001,0),(.34,0),(.39,.03),(.40,.10),(.47,.19),(.53,.35),(.57,.55),(.58,.74),(.58,.76),(.57,.775),(.548,.775),(.537,.76),(.536,.71),(.52,.54),(.47,.32),(.36,.18),(.001,.15)]),material)
 pot('espresso',(x,y,base),prof([(.001,.704),(.535,.704)]),liquid)
 pot('tiger stripe crema',(x,y,base),prof([(.507,.705),(.535,.706)]),crema)
 # a compact rounded handle
 pts=[];faces=[]
 for i in range(65):
  a=(-.59*pi)+(1.20*pi*i/64);rx=.515+.335*cos(a);rz=.417+.247*sin(a)
  for j in range(16):
   b=2*pi*j/16;pts.append((x+(rx+.061*cos(b)*cos(a))*f,y+.065*sin(b)*f,base+(rz+.061*cos(b)*sin(a))*f))
 for i in range(64):
  for j in range(16):
   k=i*16+j;l=i*16+(j+1)%16;faces.append((k,l,l+16,k+16))
 o=mesh('ear handle',pts,faces,material)
 for p in o.data.polygons:p.use_smooth=True
box('ground',(0,0,-.2),(200,200,.32),0,backdrop)
box('front plinth',(.6,0,.28),(3.45,2.25,.63),-.20,stone,.025)
box('rear plinth',(-1.22,1.37,.66),(2.75,2.3,1.4),-.20,forest,.025)
cup(.76,-.04,.595,1.25,glaze)
cup(-1.32,1.42,1.36,.96,paper)
# Slatted illumination cast by a freestanding screen outside the camera's frame
for i in range(7):
 box('shade blade',(-4.4+i*.44,1.3,4.5),(.15,8,.05),-.13,forest)
light('window',(-4,-1,7),1250,1.15,(1,.86,.68),(0,0,.2))
light('reflector',(2,-4,4),125,5,(.80,.86,1),(0,0,0))
s.world=bpy.data.worlds.new('daylight');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.65,.67,.69,1);s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.25
bpy.ops.object.camera_add();c=bpy.context.object;s.camera=c;c.data.type='ORTHO'
def shot(name,loc,target,zoom,w,h):
 c.location=loc;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.ortho_scale=zoom;s.render.resolution_x=w;s.render.resolution_y=h;s.render.image_settings.file_format='PNG';s.render.filepath=os.path.join('/tmp',name+'.png');bpy.ops.render.render(write_still=True)
shot('studio-hero',(5.3,-8.0,7.6),(0,.48,.85),5.55,1250,1100)
shot('studio-detail',(3.2,-5,5),(.65,.0,.95),2.95,950,680)
