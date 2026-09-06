(() => {
  const root = document.documentElement;
  const button = document.querySelector('.motion-control');
  const label = button.querySelector('.motion-label');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches, frame = 0, previous = 0, time = 0;
  const fields = [...document.querySelectorAll('.particle-field')].map(canvas => {
    const context = canvas.getContext('2d');
    if (!context) return null;
    return {canvas, context, width:0, height:0, visible:true, particles:[]};
  }).filter(Boolean);
  let seed = 19283;
  const random = () => {seed = seed * 16807 % 2147483647; return (seed-1)/2147483646;};

  const art=document.querySelector('.cosmic-art');
  // Coordinates in the original 1536 × 1024 artwork, before cover/cropping.
  const sourceCenter={x:1075,y:510};
  function geometry(w,h){
    const scale=Math.max(w/1536,h/1024);
    const position=getComputedStyle(art).backgroundPosition.split(' ').map(parseFloat);
    const ox=(w-1536*scale)*(position[0]/100),oy=(h-1024*scale)*(position[1]/100);
    return {scale,ox,oy,cx:ox+sourceCenter.x*scale,cy:oy+sourceCenter.y*scale};
  }
  function resize(field) {
    const {canvas,context}=field;
    field.width=canvas.clientWidth;field.height=canvas.clientHeight;
    const scale=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(field.width*scale);canvas.height=Math.round(field.height*scale);
    context.setTransform(scale,0,0,scale,0,0);
    field.geo=geometry(field.width,field.height);
    field.particles=Array.from({length:field.width<700?85:140},()=>({
      angle:random()*Math.PI*2,radius:205+random()*280,
      speed:.32+random()*.32,size:.5+random()*.9,blue:random()>.75
    }));
    paint(field,0);
  }
  function paint(field,dt){
    const {context:c,width:w,height:h,particles}=field;if(!w||!h)return;
    c.clearRect(0,0,w,h);
    const mercy=field.canvas.id==='mercy-field';
    const {cx,cy,scale}=mercy?{cx:w*.5,cy:h*.48,scale:Math.min(w,h)/950}:field.geo;
    c.globalCompositeOperation='screen';
    for(const p of particles){
      p.angle+=dt*p.speed*(300/p.radius);
      p.radius-=dt*3;if(p.radius<205)p.radius=485;
      const fade=Math.min((p.radius-205)/35,(485-p.radius)/55,1);
      const length=.055+.065*(300/p.radius);
      for(let segment=0;segment<8;segment++){
        const a=p.angle-length+length*segment/8,b=p.angle-length+length*(segment+1)/8;
        const r=p.radius*scale;
        c.strokeStyle=p.blue?'rgba(153,195,222,'+(.6*fade*segment/8)+')':'rgba(244,201,146,'+(.8*fade*segment/8)+')';
        c.lineWidth=p.size*scale;c.beginPath();c.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.96);
        c.lineTo(cx+Math.cos(b)*r,cy+Math.sin(b)*r*.96);c.stroke();
      }
    }
    c.globalCompositeOperation='source-over';
  }
  // Animate the artwork itself: differential rotation is strongest in the
  // accretion band and falls to zero across the central void and outer edges.
  const gpu=document.querySelector('#accretion');
  const gl=gpu.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
  let renderVortex=()=>{};
  if(gl){
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))return null;return s;};
    const vertex=shader(gl.VERTEX_SHADER,'attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}');
    const fragment=shader(gl.FRAGMENT_SHADER,`
      precision highp float;
      uniform sampler2D artwork;
      uniform vec2 resolution;
      uniform vec2 size;
      uniform vec2 offset;
      uniform float cover;
      uniform float elapsed;
      void main(){
        vec2 screen=vec2(gl_FragCoord.x/resolution.x,1.-gl_FragCoord.y/resolution.y)*size;
        vec2 source=(screen-offset)/cover;
        vec2 d=source-vec2(1075.,510.);
        float radius=length(d);
        float band=smoothstep(165.,230.,radius)*(1.-smoothstep(400.,680.,radius));
        float phase=fract(elapsed/24.);
        float phaseB=fract(phase+.5);
        float ripple=.035*sin(radius*.026-elapsed*.7);
        float angle=atan(d.y,d.x)+band*(phase*2.76+ripple);
        float angleB=atan(d.y,d.x)+band*(phaseB*2.76+ripple);
        vec2 warped=vec2(1075.,510.)+vec2(cos(angle),sin(angle))*radius;
        vec2 uv=warped/vec2(1536.,1024.);
        vec2 warpedB=vec2(1075.,510.)+vec2(cos(angleB),sin(angleB))*radius;
        vec3 colorA=texture2D(artwork,clamp(uv,0.,1.)).rgb;
        vec3 colorB=texture2D(artwork,clamp(warpedB/vec2(1536.,1024.),0.,1.)).rgb;
        vec3 color=mix(colorA,colorB,abs(phase*2.-1.));
        gl_FragColor=vec4(color,1.);
      }`);
    if(vertex&&fragment){
      const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
      if(gl.getProgramParameter(program,gl.LINK_STATUS)){
        gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
        const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
        const uniform=name=>gl.getUniformLocation(program,name);
        const uniforms={resolution:uniform('resolution'),size:uniform('size'),offset:uniform('offset'),cover:uniform('cover'),elapsed:uniform('elapsed')};
        const image=new Image();image.onload=()=>{
          const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
          renderVortex=()=>{
            const w=gpu.clientWidth,h=gpu.clientHeight,s=Math.min(devicePixelRatio||1,1.5),g=geometry(w,h);
            if(gpu.width!==Math.round(w*s)||gpu.height!==Math.round(h*s)){gpu.width=Math.round(w*s);gpu.height=Math.round(h*s);}
            gl.viewport(0,0,gpu.width,gpu.height);gl.uniform2f(uniforms.resolution,gpu.width,gpu.height);gl.uniform2f(uniforms.size,w,h);gl.uniform2f(uniforms.offset,g.ox,g.oy);gl.uniform1f(uniforms.cover,g.scale);gl.uniform1f(uniforms.elapsed,time);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
          };
          renderVortex();gpu.classList.add('loaded');
        };image.src='./assets/creation.webp';
        gpu.addEventListener('webglcontextlost',()=>{gpu.classList.remove('loaded');renderVortex=()=>{};});
      }
    }
  }
  const orbits = document.querySelector('.orbits');
  const radii = [[223,64,-28],[205,91,-12],[186,116,9],[165,138,32],[137,162,51]];
  const satellites = radii.map(([rx,ry,rotation],i)=>{
    const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('r',i===0?'4':'2.8');dot.setAttribute('class','orbit-particle');
    dot.setAttribute('transform',`rotate(${rotation} 290 215)`);orbits.append(dot);
    return {dot,rx,ry,phase:i*1.3,speed:.35+i*.08};
  });
  function positionSatellites(){
    satellites.forEach(({dot,rx,ry,phase,speed})=>{
      const a=time*speed+phase;
      dot.setAttribute('cx',290+Math.cos(a)*rx);dot.setAttribute('cy',215+Math.sin(a)*ry);
    });
  }
  function tick(now){
    frame=0;
    if(paused || document.hidden) return;
    if(!previous) previous=now;
    const elapsed=now-previous;
    if(elapsed>=30){
      const dt=Math.min(elapsed/1000,.06);previous=now;time+=dt;
      fields.forEach(f=>{if(f.visible)paint(f,dt);});if(fields.some(f=>f.canvas.id==='field'&&f.visible))renderVortex();positionSatellites();
    }
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    root.dataset.motion=paused?'paused':'running';
    root.dataset.pageVisible=String(!document.hidden);
    button.setAttribute('aria-pressed',String(paused));
    label.textContent=paused?'Resume motion':'Pause motion';
    if(frame)cancelAnimationFrame(frame);frame=0;previous=0;
    if(!paused&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  button.hidden=false;
  button.addEventListener('click',()=>{paused=!paused;sync();});
  preference.addEventListener('change',event=>{paused=event.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const field=fields.find(f=>f.canvas===entry.target);if(field)field.visible=entry.isIntersecting;
  }));
  fields.forEach(f=>{new ResizeObserver(()=>resize(f)).observe(f.canvas);visibility.observe(f.canvas);resize(f);});
  const sections=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('arrived');sections.unobserve(entry.target);}
  }),{threshold:.12});
  document.querySelectorAll('.movement').forEach(section=>sections.observe(section));
  positionSatellites();root.classList.add('motion-ready');sync();
})();
