(() => {
  const canvas = document.querySelector('#field');
  const button = document.querySelector('.motion-control');
  const label = button.querySelector('.motion-label');
  const context = canvas.getContext('2d');
  if (!context) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  let width = 0, height = 0, particles = [], frame = 0, previous = 0;
  let visible = true;
  let seed = 73421;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  function reset(p) { p.x = random() * width; p.y = random() * height; p.life = random() * 180 + 80; return p; }
  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    particles = Array.from({length: width < 700 ? 160 : 440}, () => reset({}));
    drawStill();
  }
  function drawStill() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(220,215,202,.45)';
    for (let i=0;i<90;i++) { context.beginPath(); context.arc(random()*width,random()*height,random()*.7+.2,0,Math.PI*2); context.fill(); }
  }
  function tick(now) {
    frame = 0;
    if (paused || !visible || document.hidden) return;
    if (now - previous >= 32) {
      previous = now;
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = 'rgba(0,0,0,.065)'; context.fillRect(0,0,width,height);
      context.globalCompositeOperation = 'source-over';
      for (const p of particles) {
        const dx = (p.x - width*.72)/width, dy = (p.y-height*.47)/height;
        const radius = Math.sqrt(dx*dx+dy*dy)+.09;
        const angle = Math.atan2(dy,dx)+Math.PI/2 + .2*Math.sin(p.x*.008+p.y*.004);
        const speed = Math.min(1.5,.24/radius);
        const x = p.x + Math.cos(angle)*speed, y = p.y + Math.sin(angle)*speed;
        context.beginPath(); context.moveTo(p.x,p.y); context.lineTo(x,y);
        context.strokeStyle = p.x > width*.68 ? 'rgba(192,151,117,.25)' : 'rgba(163,185,199,.17)';
        context.lineWidth = .6; context.stroke();
        p.x=x;p.y=y;p.life--;
        if(p.life<0 || x<0 || y<0 || x>width || y>height) reset(p);
      }
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    button.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? 'Resume motion' : 'Pause motion';
    if(frame) cancelAnimationFrame(frame);
    frame = 0;
    if(!paused && visible && !document.hidden) frame=requestAnimationFrame(tick);
  }
  button.hidden=false;
  button.addEventListener('click',()=>{paused=!paused;sync();});
  preference.addEventListener('change',event=>{paused=event.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  resize();sync();
})();

