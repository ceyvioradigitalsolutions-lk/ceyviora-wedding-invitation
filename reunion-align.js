/* STEP 12 — responsive hand-tip alignment for original transparent PNGs.
 * Scans a narrow height band to find the outermost opaque hand pixels.
 * The images can be 1714x918 or another common size; both must have
 * corresponding transparent canvas placement and opposing arm gestures.
 */
(function(){
  'use strict';
  const section=document.querySelector('.story-union-section');
  if(!section)return;
  const scene=section.querySelector('.union-scene');
  const groom=section.querySelector('.union-groom');
  const bride=section.querySelector('.union-bride');
  if(!scene||!groom||!bride)return;
  let points=null;
  let lastWidth=0;

  function handTip(img, side){
    // Downscale for fast pixel-analysis without changing source images.
    const w=490;
    const h=Math.round(w*img.naturalHeight/img.naturalWidth);
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context)return null;
    context.drawImage(img,0,0,w,h);
    const data=context.getImageData(0,0,w,h).data;
    const y0=Math.floor(h*.69),y1=Math.ceil(h*.86);
    let bestX=side==='groom'?0:w;
    let bestY=Math.round(h*.8);
    for(let y=y0;y<y1;y++){
      for(let x=0;x<w;x++){
        const alpha=data[(y*w+x)*4+3];
        if(alpha<190)continue;
        // Suppress isolated alpha specks and petals.
        const adjA=data[(y*w+Math.max(0,x-1))*4+3];
        const adjB=data[(y*w+Math.min(w-1,x+1))*4+3];
        if(adjA<150&&adjB<150)continue;
        const improved=side==='groom'?x>bestX:x<bestX;
        if(improved){bestX=x;bestY=y;}
      }
    }
    if(bestX===0||bestX===w)return null;
    return {x:bestX/w,y:bestY/h};
  }

  function calibrate(){
    if(!groom.naturalWidth||!bride.naturalWidth)return;
    const width=scene.getBoundingClientRect().width;
    if(!width)return;
    let next;
    try{
      next={g:handTip(groom,'groom'),b:handTip(bride,'bride')};
    }catch(err){
      // File:// security policies may forbid pixel-read. CSS calibrated fallback applies.
      section.dataset.alignMode='fallback';
      return;
    }
    if(!next.g||!next.b){section.dataset.alignMode='fallback';return;}
    points=next;
    applyOffsets();
  }

  function applyOffsets(){
    if(!points)return;
    const w=groom.getBoundingClientRect().width;
    const h=groom.getBoundingClientRect().height;
    if(!w||!h)return;
    // Both images are centered in the same stage. Align the detected fingertips
    // to the stage center with an 8px contact overlap.
    const groomShift=w*(0.5-points.g.x)+4;
    const brideShift=w*(0.5-points.b.x)-4;
    const targetY=(points.g.y+points.b.y)/2;
    const groomY=h*(targetY-points.g.y);
    const brideY=h*(targetY-points.b.y);
    groom.style.setProperty('--union-groom-x',groomShift.toFixed(1)+'px');
    bride.style.setProperty('--union-bride-x',brideShift.toFixed(1)+'px');
    groom.style.setProperty('--union-groom-y',groomY.toFixed(1)+'px');
    bride.style.setProperty('--union-bride-y',brideY.toFixed(1)+'px');
    // Pointer highlight tracks the contact height instead of being fixed at 17%.
    const bottomPercent=(1-targetY)*h/scene.getBoundingClientRect().height*100;
    if(Number.isFinite(bottomPercent)){
      scene.style.setProperty('--union-contact-bottom',Math.min(47,Math.max(9,bottomPercent)).toFixed(2)+'%');
    }
    section.dataset.alignMode='automatic';
    lastWidth=scene.getBoundingClientRect().width;
  }

  Promise.all([groom,bride].map(img=>img.decode?img.decode().catch(()=>null):Promise.resolve()))
    .then(calibrate);
  window.addEventListener('resize',()=>{
    const width=scene.getBoundingClientRect().width;
    if(Math.abs(width-lastWidth)>3){
      if(points)applyOffsets(); else calibrate();
    }
  },{passive:true});
})();
