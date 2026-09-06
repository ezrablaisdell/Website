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
  function resize(field) {
    const {canvas, context} = field;
    field.width = canvas.clientWidth; field.height = canvas.clientHeight;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(field.width*scale); canvas.height = Math.round(field.height*scale);
    context.setTransform(scale,0,0,scale,0,0);
    field.particles = Array.from({length:field.width<700?170:360},()=>({
      angle:random()*Math.PI*2, radius:.12+random()*.51,
      speed:(.12+random()*.2)*(random()>.18?1:-1), size:.6+random()*1.2,
      offset:random()*Math.PI*2, blue:random()>.6
    }));
    paint(field,0,true);
  }
  function paint(field,dt,still=false) {
    const {context:c,width:w,height:h,particles} = field;
    if (!w || !h) return;
    c.globalCompositeOperation='destination-out';
    c.fillStyle=still?'rgba(0,0,0,1)':'rgba(0,0,0,.19)'; c.fillRect(0,0,w,h);
    c.globalCompositeOperation='source-over';
    const mercy = field.canvas.id === 'mercy-field';
    const cx=w*(mercy?.5:.72),cy=h*.49;
    for(const p of particles){
      const old=p.angle; p.angle+=dt*p.speed;
      const r=Math.min(w,h)*p.radius;
      const point=a=>({x:cx+Math.cos(a)*r*1.45+Math.sin(a*3+time*.22+p.offset)*13,
        y:cy+Math.sin(a)*r*.83+Math.cos(a*2+time*.18+p.offset)*12});
      const start=point(old), end=point(p.angle);
      c.strokeStyle=p.blue?'rgba(139,191,225,.65)':'rgba(227,182,126,.72)';
      c.lineWidth=p.size;c.beginPath();c.moveTo(start.x,start.y);c.lineTo(end.x,end.y);c.stroke();
      c.fillStyle=p.blue?'rgba(174,213,240,.82)':'rgba(255,219,166,.9)';
      c.beginPath();c.arc(end.x,end.y,p.size*.75,0,Math.PI*2);c.fill();
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
      fields.forEach(f=>{if(f.visible)paint(f,dt);});positionSatellites();
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
