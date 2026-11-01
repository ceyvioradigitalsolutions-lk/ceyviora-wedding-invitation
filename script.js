(function(){
  'use strict';
  const config=window.WEDDING_CONFIG;
  if(!config){alert('Wedding configuration is missing. Please check config.js.');return;}
  const safe=(value)=>String(value??'');
  document.querySelectorAll('[data-bind]').forEach(el=>{
    const key=el.getAttribute('data-bind');
    if(Object.prototype.hasOwnProperty.call(config,key))el.textContent=safe(config[key]);
  });
  document.title=`${safe(config.partnerOne)} to ${safe(config.partnerTwo)} | Wedding Invitation`;
  const bgMusic=document.getElementById('bg-music');
  const musicToggle=document.getElementById('music-toggle');
  const syncMusicButton=(playing)=>{
    if(!musicToggle)return;
    musicToggle.textContent=playing ? '♫' : '♪';
    musicToggle.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    musicToggle.classList.toggle('is-paused', !playing);
  };
  syncMusicButton(false);
  const cover=document.getElementById('opening-screen');
  document.body.classList.add('invitation-locked');
  const openButton=document.getElementById('open-invitation');
  openButton.addEventListener('click',()=>{
    if(bgMusic){bgMusic.volume=0.35;bgMusic.play().then(()=>syncMusicButton(true)).catch(()=>syncMusicButton(false));}
    if(cover.classList.contains('is-opening'))return;
    cover.classList.add('is-opening');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(()=>{
      cover.hidden=true;
      document.body.classList.remove('invitation-locked');
      document.body.classList.add('invitation-opened');
      document.getElementById('couple-heading').setAttribute('tabindex','-1');
      document.getElementById('couple-heading').focus({preventScroll:true});
    },reduced?60:2050);
  });
  // Gentle progressive section reveals; no content is hidden without JS support.
  const revealNodes=[...document.querySelectorAll('[data-reveal]')];
  if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.body.classList.add('js-reveal');
    const observer=new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});
    },{threshold:.07,rootMargin:'0px 0px 70px 0px'});
    revealNodes.forEach(el=>observer.observe(el));
  }
  if(musicToggle && bgMusic){
    musicToggle.addEventListener('click',()=>{
      if(bgMusic.paused){bgMusic.play().then(()=>syncMusicButton(true)).catch(()=>syncMusicButton(false));}
      else{bgMusic.pause();syncMusicButton(false);}
    });
  }
  // Trigger only when the couple artwork is actually entering the viewport,
  // not when the top heading becomes visible several seconds earlier.
  const unionSection=document.querySelector('.story-union-section');
  if(unionSection){
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reducedMotion){
      unionSection.classList.add('will-unite');
      const showUnion=()=>unionSection.classList.add('is-united');
      if('IntersectionObserver' in window){
        const unionObserver=new IntersectionObserver((entries)=>{
          for(const entry of entries){
            if(entry.isIntersecting){showUnion();unionObserver.disconnect();break;}
          }
        },{threshold:0.1,rootMargin:'0px 0px -10% 0px'});
        unionObserver.observe(unionSection.querySelector('.union-scene'));
      }else{showUnion();}
    }else{unionSection.classList.add('is-united');}
  }
  const saveButton=document.getElementById('save-date');
  saveButton.addEventListener('click',()=>{
    const stamp=(iso)=>new Date(iso).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const escapeIcs=(text)=>safe(text).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
    try{
      const start=stamp(config.dateISO);
      const end=stamp(config.endISO||config.dateISO);
      const event=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Ceyviora//Wedding Invitation Demo//EN\r\nBEGIN:VEVENT\r\nUID:ceyviora-wedding-${start}@invitation.local\r\nDTSTAMP:${stamp(new Date().toISOString())}\r\nDTSTART:${start}\r\nDTEND:${end}\r\nSUMMARY:${escapeIcs(config.partnerOne+' & '+config.partnerTwo+' - '+config.eventTitle)}\r\nLOCATION:${escapeIcs(config.venue+', '+config.location)}\r\nDESCRIPTION:${escapeIcs(config.invitationLine)}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
      const blob=new Blob([event],{type:'text/calendar;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download='save-the-date.ics';document.body.appendChild(a);a.click();a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),3000);
    }catch(e){console.error('Calendar event could not be generated',e);alert('Please check the event date in config.js.');}
  });
})();
