const cv=document.getElementById('c'),ctx=cv.getContext('2d'),g=9.81;
const len=document.getElementById('len'),ang=document.getElementById('ang');
let th,om,last=performance.now();
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n);
function reset(){th=ang.value*Math.PI/180;om=0;
  document.getElementById('olen').textContent=(+len.value).toFixed(2)+' m';
  document.getElementById('oang').textContent=ang.value+'°';
  document.getElementById('T').textContent=(2*Math.PI*Math.sqrt(len.value/g)).toFixed(2)+' s';}
len.oninput=ang.oninput=reset;reset();
function frame(t){
  const dt=Math.min((t-last)/1000,.03);last=t;
  for(let i=0;i<10;i++){om+=-g/len.value*Math.sin(th)*dt/10;th+=om*dt/10;}
  const W=cv.width,H=cv.height,px=len.value*190,ox=W/2,oy=40,x=ox+px*Math.sin(th),y=oy+px*Math.cos(th);
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle=css('--muted');ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(x,y);ctx.stroke();
  ctx.fillStyle=css('--f-physik');ctx.beginPath();ctx.arc(x,y,20,0,7);ctx.fill();
  ctx.fillStyle=css('--text');ctx.fillRect(ox-60,oy-8,120,8);
  requestAnimationFrame(frame);}
requestAnimationFrame(frame);
