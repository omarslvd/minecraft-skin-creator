/* Skin Studio: all editing happens in the canonical Minecraft 64x64 texture canvas. */
const canvas = document.getElementById('textureCanvas'), ctx = canvas.getContext('2d', {willReadFrequently:true});
const picker = document.getElementById('colorPicker'), hex = document.getElementById('hexValue');
const palette = ['#1d1a22','#ffffff','#c8c4bc','#79553a','#b8754d','#f0c49a','#e94050','#f48b35','#ffd34b','#cbff47','#59c88d','#43a8da','#7159f4','#aa64d7','#f09abb','#70483c','#3d2c29','#9c6746'];
let tool='brush', color=picker.value, drawing=false, history=[], future=[];
const texture = new THREE.CanvasTexture(canvas); texture.magFilter=THREE.NearestFilter; texture.minFilter=THREE.NearestFilter; texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping; texture.colorSpace=THREE.SRGBColorSpace;

function seed(){
  history=[];future=[];ctx.clearRect(0,0,64,64);
  const fill=(rect,shade)=>{ctx.fillStyle=shade;ctx.fillRect(...rect)};
  const skin='#f0c49a', hair='#4e3028', shirt='#48a05c', shirtShade='#3c8b4e', jeans='#3d4ca1', jeansShade='#303c86';
  // Head — all six faces of the 8×8 cube.
  fill([8,8,8,8],skin); fill([24,8,8,8],hair); fill([0,8,8,8],hair); fill([16,8,8,8],hair); fill([8,0,8,8],hair); fill([16,0,8,8],skin);
  fill([8,8,8,2],hair); fill([8,8,1,8],hair); fill([15,8,1,8],hair);
  fill([9,12,2,1],hair); fill([13,12,2,1],hair); fill([11,14,2,1],'#d47f67');
  // Torso — front, back, both sides, top and bottom.
  [[20,20,8,12],[32,20,8,12],[16,20,4,12],[28,20,4,12],[20,16,8,4],[28,16,8,4]].forEach((r,i)=>fill(r,i===1||i===2?shirtShade:shirt));
  // Right arm and leg (upper half of the classic atlas).
  [[44,20,4,12],[52,20,4,12],[40,20,4,12],[48,20,4,12],[44,16,4,4],[48,16,4,4]].forEach((r,i)=>fill(r,i===1||i===2?shirtShade:shirt));
  [[4,20,4,12],[12,20,4,12],[0,20,4,12],[8,20,4,12],[4,16,4,4],[8,16,4,4]].forEach((r,i)=>fill(r,i===1||i===2?jeansShade:jeans));
  // Left arm and leg (lower half of the classic 64×64 atlas).
  [[36,52,4,12],[44,52,4,12],[32,52,4,12],[40,52,4,12],[36,48,4,4],[40,48,4,4]].forEach((r,i)=>fill(r,i===1||i===2?shirtShade:shirt));
  [[20,52,4,12],[28,52,4,12],[16,52,4,12],[24,52,4,12],[20,48,4,4],[24,48,4,4]].forEach((r,i)=>fill(r,i===1||i===2?jeansShade:jeans));
  refresh();save(true)
}
function refresh(){texture.needsUpdate=true}
function save(initial=false){const s=canvas.toDataURL();if(!initial && history.at(-1)===s)return;history.push(s);if(history.length>40)history.shift();future=[];buttons()}
function restore(data){let img=new Image();img.onload=()=>{ctx.clearRect(0,0,64,64);ctx.drawImage(img,0,0,64,64);refresh()};img.src=data}
function buttons(){document.getElementById('undo').disabled=history.length<2;document.getElementById('redo').disabled=!future.length}
function undo(){if(history.length<2)return;future.push(history.pop());restore(history.at(-1));buttons()}
function redo(){if(!future.length)return;let next=future.pop();history.push(next);restore(next);buttons()}
function setColor(c){color=c;picker.value=c;hex.textContent=c.toUpperCase()}
palette.forEach(c=>{let b=document.createElement('button');b.className='swatch';b.style.background=c;b.title=c;b.onclick=()=>setColor(c);document.getElementById('swatches').append(b)});
picker.oninput=e=>setColor(e.target.value);
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('.tool').forEach(x=>x.classList.toggle('active',x===b))});
document.getElementById('undo').onclick=undo;document.getElementById('redo').onclick=redo;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();e.shiftKey?redo():undo()}if(!e.ctrlKey&&!e.metaKey){let m={b:'brush',e:'eraser',i:'eyedropper',g:'fill'}[e.key.toLowerCase()];if(m)document.querySelector(`.tool[data-tool="${m}"]`).click()}});
function pixel(x,y){let d=ctx.getImageData(x,y,1,1).data;return `#${[d[0],d[1],d[2]].map(x=>x.toString(16).padStart(2,'0')).join('')}`}
function paint(x,y){x=Math.max(0,Math.min(63,Math.floor(x)));y=Math.max(0,Math.min(63,Math.floor(y)));if(tool==='eyedropper'){setColor(pixel(x,y));return}if(tool==='fill'){flood(x,y);return}ctx.clearRect(x,y,1,1);if(tool==='brush'){ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}refresh()}
function flood(x,y){const source=ctx.getImageData(x,y,1,1).data, target=tool==='eraser'?[0,0,0,0]:hexToRgb(color);if(source.every((v,i)=>v===target[i]))return;let im=ctx.getImageData(0,0,64,64),d=im.data,q=[[x,y]];while(q.length){let [a,b]=q.pop();if(a<0||b<0||a>63||b>63)continue;let i=(b*64+a)*4;if(!source.every((v,j)=>d[i+j]===v))continue;target.forEach((v,j)=>d[i+j]=v);q.push([a+1,b],[a-1,b],[a,b+1],[a,b-1])}ctx.putImageData(im,0,0);refresh()}
function hexToRgb(c){let n=parseInt(c.slice(1),16);return[n>>16,(n>>8)&255,n&255,255]}
function canvasPoint(e){let r=canvas.getBoundingClientRect();return[(e.clientX-r.left)*64/r.width,(e.clientY-r.top)*64/r.height]}
canvas.addEventListener('pointerdown',e=>{drawing=true;let p=canvasPoint(e);paint(...p);save()});canvas.addEventListener('pointermove',e=>{if(drawing&&(tool==='brush'||tool==='eraser')){paint(...canvasPoint(e));refresh()}});addEventListener('pointerup',()=>{if(drawing){drawing=false;save()}});

// 3D model built from independently mapped planes; every click converts UV back to its exact skin location.
const holder=document.getElementById('viewer'), scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(10,10,22);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));holder.append(renderer.domElement);
const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.target.set(0,2,0);controls.enableDamping=true;controls.minDistance=12;controls.maxDistance=35;
const group=new THREE.Group();scene.add(group);
// Pixel art should show the original PNG colours, without light intensity washing them out.
const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.04,side:THREE.DoubleSide});let paintables=[];
function cube(cx,cy,cz,w,h,d,uv,outer=false){
  // BoxGeometry already stores the correct orientation for every outward-facing side.
  // Its groups are right, left, top, bottom, front and back, in that exact order.
  const geo=new THREE.BoxGeometry(w,h,d), attribute=geo.attributes.uv;
  const faces=[uv.right,uv.left,uv.top,uv.bottom,uv.front,uv.back];
  geo.groups.forEach((face,index)=>{
    const rect=faces[index];
    const updated=new Set();
    for(let i=face.start;i<face.start+face.count;i++){
      const vertex=geo.index.getX(i);
      if(updated.has(vertex)) continue;
      updated.add(vertex);
      const baseU=attribute.getX(vertex), baseV=attribute.getY(vertex);
      attribute.setXY(vertex,(rect[0]+baseU*rect[2])/64,1-(rect[1]+(1-baseV)*rect[3])/64);
    }
  });
  attribute.needsUpdate=true;
  const mesh=new THREE.Mesh(geo,material);mesh.position.set(cx,cy,cz);mesh.userData={outer};group.add(mesh);paintables.push(mesh);
}
const R=(f,b,l,r,t,o)=>({front:f,back:b,left:l,right:r,top:t,bottom:o}), H=R([8,8,8,8],[24,8,8,8],[0,8,8,8],[16,8,8,8],[8,0,8,8],[16,0,8,8]), B=R([20,20,8,12],[32,20,8,12],[16,20,4,12],[28,20,4,12],[20,16,8,4],[28,16,8,4]), RA=R([44,20,4,12],[52,20,4,12],[40,20,4,12],[48,20,4,12],[44,16,4,4],[48,16,4,4]), RL=R([4,20,4,12],[12,20,4,12],[0,20,4,12],[8,20,4,12],[4,16,4,4],[8,16,4,4]), LA=R([36,52,4,12],[44,52,4,12],[32,52,4,12],[40,52,4,12],[36,48,4,4],[40,48,4,4]), LL=R([20,52,4,12],[28,52,4,12],[16,52,4,12],[24,52,4,12],[20,48,4,4],[24,48,4,4]);
cube(0,7,0,4,4,4,H);cube(0,2.5,0,4,6,2,B);cube(-3,2.5,0,2,6,2,RA);cube(3,2.5,0,2,6,2,LA);cube(-1, -3,0,2,6,2,RL);cube(1,-3,0,2,6,2,LL);
// second layer is a lightly expanded duplicate of head/body only, using official overlay slots.
const OH=R([40,8,8,8],[56,8,8,8],[32,8,8,8],[48,8,8,8],[40,0,8,8],[48,0,8,8]);cube(0,7,0,4.15,4.15,4.15,OH,true);
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();renderer.domElement.addEventListener('pointerdown',e=>{let r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);let hit=ray.intersectObjects(paintables.filter(m=>!m.userData.outer||document.getElementById('outerLayer').checked))[0];if(hit){controls.enabled=false;let uv=hit.uv;paint(uv.x*64,(1-uv.y)*64);save()}});addEventListener('pointerup',()=>controls.enabled=true);renderer.domElement.addEventListener('pointermove',e=>{if(!controls.enabled&&(tool==='brush'||tool==='eraser')){let r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);let h=ray.intersectObjects(paintables)[0];if(h){paint(h.uv.x*64,(1-h.uv.y)*64);refresh()}}});
function resize(){let w=holder.clientWidth,h=holder.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(holder);function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}animate();
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{let p={front:[0,3,22],back:[0,3,-22],left:[-22,3,0],right:[22,3,0]}[b.dataset.view];camera.position.set(...p);controls.target.set(0,2,0);controls.update();document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('selected',x===b))});
document.getElementById('outerLayer').onchange=e=>paintables.filter(x=>x.userData.outer).forEach(x=>x.visible=e.target.checked);
document.getElementById('downloadSkin').onclick=()=>{let a=document.createElement('a');a.download='mi-skin-minecraft.png';a.href=canvas.toDataURL('image/png');a.click()};
document.getElementById('importSkin').onchange=e=>{let f=e.target.files[0];if(!f)return;let im=new Image();im.onload=()=>{ctx.clearRect(0,0,64,64);ctx.drawImage(im,0,0,64,64);refresh();save()};im.src=URL.createObjectURL(f)};
document.getElementById('newSkin').onclick=()=>{if(confirm('¿Crear una skin nueva? Se perderán los cambios actuales.'))seed()};
document.getElementById('toggleTexture').onclick=()=>document.querySelector('.texture-wrap').classList.toggle('hidden');seed();
