(function(){
  var slides=document.querySelectorAll('.gallery__slide');
  var dots=document.querySelectorAll('.gallery__dot');
  var prev=document.getElementById('gallery-prev');
  var next=document.getElementById('gallery-next');
  var cur=document.getElementById('gallery-counter-cur');
  if(!slides.length)return;
  var idx=0,total=slides.length,busy=false;

  function go(to){
    if(busy||to===idx||to<0||to>=total)return;
    busy=true;
    var from=idx;idx=to;
    var outEl=slides[from],inEl=slides[to];
    if(window.gsap){
      gsap.to(outEl,{opacity:0,x:from<to?-60:60,duration:.55,ease:'power2.in',onComplete:function(){
        outEl.classList.remove('is-active');
        inEl.classList.add('is-active');
        gsap.fromTo(inEl,{opacity:0,x:from<to?60:-60},{opacity:1,x:0,duration:.6,ease:'power3.out',onComplete:function(){busy=false;}});
      }});
    } else {
      outEl.classList.remove('is-active');
      inEl.classList.add('is-active');
      busy=false;
    }
    dots.forEach(function(d,i){d.classList.toggle('is-active',i===idx);d.setAttribute('aria-selected',i===idx?'true':'false');});
    if(cur)cur.textContent=String(idx+1).padStart(2,'0');
    if(prev)prev.disabled=idx===0;
    if(next)next.disabled=idx===total-1;
  }

  slides[0].classList.add('is-active');
  if(prev)prev.disabled=true;
  dots.forEach(function(d){d.addEventListener('click',function(){go(parseInt(d.dataset.index));});});
  if(prev)prev.addEventListener('click',function(){go(idx-1);});
  if(next)next.addEventListener('click',function(){go(idx+1);});

  /* touch swipe */
  var sx=0;
  var stage=document.getElementById('gallery-stage');
  if(stage){
    stage.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
    stage.addEventListener('touchend',function(e){
      var dx=e.changedTouches[0].clientX-sx;
      if(Math.abs(dx)>40)go(dx<0?idx+1:idx-1);
    },{passive:true});
  }
}());
