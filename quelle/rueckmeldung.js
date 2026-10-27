/* Rückmeldungen: zwei Bildfragen und eine freiwillige Sprachnachricht.
   Aufnahmen bleiben nur im Arbeitsspeicher; Klassenlinks speichern nur den Sendeschlüssel. */
const RUECKMELDUNG_API='https://schrittli-anmelden.conradinjoos.workers.dev';
const RUECKMELDUNG_KEY='schrittli.feedback.klasse';
const RUECKMELDUNG_MAX_AUDIO=1048576;
let feedbackSession=null, feedbackSetup=null;
function feedbackKlassenlinkAbholen(){
  const hash=String(location.hash||'');if(!/^#klasse=/.test(hash))return null;
  const token=new URLSearchParams(hash.slice(1)).get('klasse')||'';
  history.replaceState(null,'',location.pathname+location.search);return {token};
}
// Bereits beim Laden aus der Adresse nehmen, bevor boot() die Projektdateien abwartet.
let feedbackInitialLink=feedbackKlassenlinkAbholen();

function feedbackVerbindung(){
  try{ const value=JSON.parse(localStorage.getItem(RUECKMELDUNG_KEY)||'null');
    if(value&&/^[a-f0-9]{64}$/i.test(value.token||''))return {token:value.token,name:String(value.name||'Deine Klasse').slice(0,80)};
  }catch(e){}
  return null;
}
function feedbackUuid(){
  if(globalThis.crypto&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
  const bytes=new Uint8Array(16); if(globalThis.crypto&&crypto.getRandomValues)crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
function feedbackCleanup(){
  if(feedbackSession){feedbackSession.destroy();feedbackSession=null;}
  if(feedbackSetup){feedbackSetup.active=false;feedbackSetup.controller.abort();clearTimeout(feedbackSetup.timer);if(feedbackSetup.close)feedbackSetup.close();feedbackSetup=null;}
}
function feedbackTokenAusEingabe(value){
  const text=String(value||'').trim();if(/^[a-f0-9]{64}$/i.test(text))return text;
  try{const url=new URL(text);if(url.origin!=='https://conradinjoos-lab.github.io'||!/^\/schrittli\/schule\/?$/.test(url.pathname)||url.username||url.password||url.search)return '';
    const hash=new URLSearchParams(url.hash.slice(1)),entries=[...hash.entries()];return entries.length===1&&entries[0][0]==='klasse'&&/^[a-f0-9]{64}$/i.test(entries[0][1])?entries[0][1]:'';
  }catch(e){return '';}
}
function feedbackEinrichten(){
  modal(`<div class="fb-setup"><span class="fb-setup-icon" aria-hidden="true">🏫</span><h2>Dieses Tablet verbinden</h2><p>Füge den Klassenlink hier ein. So funktioniert die Verbindung auch in der installierten App.</p><label class="fb-link-label" for="fb-class-link">Klassenlink oder Sendeschlüssel<input class="inp" id="fb-class-link" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="320" placeholder="Klassenlink einfügen"></label><p class="fb-setup-error" role="alert" hidden></p><div class="row"><button class="btn" data-close>Abbrechen</button><button class="btn primary" data-act="pruefen">Klasse prüfen</button></div></div>`,{
    pruefen:(button,close,m)=>{const input=$('#fb-class-link',m),error=$('.fb-setup-error',m),token=feedbackTokenAusEingabe(input&&input.value);if(!token){if(error){error.textContent='Bitte füge einen gültigen Klassenlink von Schritt für Schritt oder den 64-stelligen Sendeschlüssel ein.';error.hidden=false;}if(input)input.focus();return;}
      try{history.replaceState(null,'',location.pathname+location.search+'#klasse='+token);}catch(e){if(error){error.textContent='Der Klassenlink konnte hier nicht geöffnet werden. Bitte versuche es nochmals.';error.hidden=false;}return;}
      close();feedbackStart($('#app'));
    }
  });
}
async function feedbackStart(app){
  const link=feedbackKlassenlinkAbholen()||feedbackInitialLink;feedbackInitialLink=null;if(!link)return false;
  const token=link.token;
  if(feedbackSetup){feedbackSetup.active=false;feedbackSetup.controller.abort();clearTimeout(feedbackSetup.timer);if(feedbackSetup.close)feedbackSetup.close();}
  const setup={active:true,controller:new AbortController(),timer:null,close:null};feedbackSetup=setup;
  const finish=()=>{setup.active=false;clearTimeout(setup.timer);if(feedbackSetup===setup)feedbackSetup=null;};
  const failure=message=>{if(!setup.active)return;setup.close=modal(`<div class="fb-setup"><span class="fb-setup-icon" aria-hidden="true">🏫</span><h2>Tablet verbinden</h2><p>${esc(message)}</p><button class="btn primary" data-close>Verstanden</button></div>`);};
  if(!/^[a-f0-9]{64}$/i.test(token)){failure('Dieser Klassenlink ist ungültig. Bitte öffne einen neuen Link deiner Lehrperson.');return true;}
  try{
    setup.timer=setTimeout(()=>setup.controller.abort(),15000);
    const response=await fetch(RUECKMELDUNG_API+'/feedback/klasse',{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:setup.controller.signal});
    if(!setup.active)return true;
    clearTimeout(setup.timer);
    if(!response.ok){failure(response.status===401||response.status===403?'Dieser Klassenlink gilt nicht mehr. Bitte nimm einen neuen Link.':'Die Klasse ist gerade nicht erreichbar. Öffne den Klassenlink später nochmals.');return true;}
    const data=await response.json();if(!setup.active)return true;
    const name=String(data.name||'Deine Klasse').slice(0,80);
    setup.close=modal(`<div class="fb-setup"><span class="fb-setup-icon" aria-hidden="true">🏫</span><h2>Tablet verbinden?</h2><p>Rückmeldungen von diesem Tablet gehen an:</p><strong class="fb-setup-name">${esc(name)}</strong><p class="fb-setup-note">Bitte von der Lehrperson bestätigen lassen.</p><p class="fb-setup-error" role="alert" hidden></p><div class="row"><button class="btn" data-act="abbrechen">Abbrechen</button><button class="btn primary" data-act="verbinden">Tablet verbinden</button></div></div>`,{
      abbrechen:(button,close)=>{close();finish();},
      verbinden:(button,close,m)=>{if(!setup.active)return;try{localStorage.setItem(RUECKMELDUNG_KEY,JSON.stringify({token,name}));}catch(e){const error=$('.fb-setup-error',m);if(error){error.textContent='Die Verbindung konnte auf diesem Tablet nicht gespeichert werden.';error.hidden=false;}return;}close();finish();toast('Mit '+name+' verbunden.');}
    });
  }catch(e){if(setup.active)failure('Die Klasse ist gerade nicht erreichbar. Öffne den Klassenlink später nochmals.');}
  finally{clearTimeout(setup.timer);}
  return true;
}

const FEEDBACK_FRAGEN=[
  {id:'schwierigkeit',title:'Wie war es für dich?',choices:[[1,'🪶','Leicht'],[2,'👌','Genau richtig'],[3,'💪','Schwierig']]},
  {id:'spass',title:'Hat es Spass gemacht?',choices:[[1,'😕','Wenig'],[2,'🙂','Okay'],[3,'🤩','Viel']]}
];

SCREENS.feedback=(app,{videoId,school}={})=>{
  if(feedbackSession)feedbackSession.destroy();
  const video=school&&typeof school==='object'?school:videoOf(videoId);
  if(!video){go('home');return;}
  const connection=feedbackVerbindung(), area=video.areaId?areaOf(video.areaId):null;
  const storedGrade=Number(S.settings.klasse),klasse=Number.isInteger(storedGrade)&&storedGrade>=1&&storedGrade<=6?storedGrade:0;
  const state={active:true,connection,id:feedbackUuid(),values:{schwierigkeit:0,spass:0,klasse:klasse>=1&&klasse<=6?klasse:0},
    stage:'idle',recordGeneration:0,stream:null,recorder:null,chunks:[],audio:null,audioUrl:null,recordStarted:0,seconds:0,
    tick:null,limit:null,micWait:null,uploadTimer:null,upload:null,sending:false,attempt:null,error:'',audioError:'',audioRejected:false,invalidConnection:false};
  feedbackSession=state;
  const stopTracks=stream=>{if(stream)for(const track of stream.getTracks())try{track.stop();}catch(e){}};
  const clearRecordingTimers=()=>{clearInterval(state.tick);clearTimeout(state.limit);clearTimeout(state.micWait);state.tick=state.limit=state.micWait=null;};
  const releaseAudio=()=>{const player=$('#fb-audio',app);if(player)try{player.pause();player.removeAttribute('src');player.load();}catch(e){}if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);state.audioUrl=null;state.audio=null;};
  const cancelRecorder=()=>{state.recordGeneration++;clearRecordingTimers();const recorder=state.recorder;state.recorder=null;if(recorder){recorder.ondataavailable=recorder.onstop=recorder.onerror=null;try{if(recorder.state!=='inactive')recorder.stop();}catch(e){}}stopTracks(state.stream);state.stream=null;state.chunks=[];};
  const visibilityChanged=()=>{if(!document.hidden||!state.active)return;if(state.stage==='recording')stopRecording();else if(state.stage==='requesting'){cancelRecorder();state.stage='idle';render();}};
  document.addEventListener('visibilitychange',visibilityChanged);
  state.destroy=()=>{if(!state.active)return;state.active=false;document.removeEventListener('visibilitychange',visibilityChanged);cancelRecorder();if(state.upload)state.upload.abort();clearTimeout(state.uploadTimer);releaseAudio();state.attempt=null;};
  const leave=()=>backToIdeas(area,school);
  const canRecord=()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder);
  const valid=()=>['schwierigkeit','spass'].every(key=>Number.isInteger(state.values[key])&&state.values[key]>=1&&state.values[key]<=3)&&Number.isInteger(state.values.klasse)&&state.values.klasse>=1&&state.values.klasse<=6;
  const label=typeof projectTitle==='function'?projectTitle(video):video.title;
  const read=()=>{unlockTTS();speak('Wie war es für dich? Leicht, genau richtig oder schwierig? Hat es Spass gemacht? Wenig, okay oder viel? Wenn du magst, kannst du noch etwas erzählen.');};
  const render=()=>{
    if(!state.active)return;
    const focused=document.activeElement&&app.contains(document.activeElement)?document.activeElement.dataset:null;
    const locked=!!state.attempt||state.sending, busy=['requesting','recording','stopping'].includes(state.stage);
    const questions=FEEDBACK_FRAGEN.map(question=>`<fieldset class="fb-question" id="fb-${question.id}"><legend>${question.title}</legend><div class="fb-choices">${question.choices.map(([value,symbol,text])=>`<button type="button" class="fb-choice${state.values[question.id]===value?' selected':''}" data-act="waehlen" data-key="${question.id}" data-value="${value}" aria-pressed="${state.values[question.id]===value}" ${locked?'disabled':''}><span class="fb-choice-symbol" aria-hidden="true">${symbol}</span><span>${text}</span><i aria-hidden="true">${state.values[question.id]===value?'✓':''}</i></button>`).join('')}</div></fieldset>`).join('');
    let voice='';
    if(state.stage==='requesting')voice=`<div class="fb-recording"><span class="fb-mic-icon" aria-hidden="true">🎙️</span><p>Erlaube das Mikrofon auf diesem Tablet.</p><button class="fb-small-button" data-act="aufnahme-abbrechen">Abbrechen</button></div>`;
    else if(state.stage==='recording')voice=`<div class="fb-recording"><span class="fb-record-dot" aria-hidden="true"></span><b>Ich höre zu …</b><span class="fb-clock" id="fb-clock" role="timer" aria-label="Aufnahmedauer">${state.seconds} / 60 s</span><button class="fb-stop" data-act="aufnahme-stopp"><span aria-hidden="true">■</span> Fertig erzählt</button></div>`;
    else if(state.stage==='stopping')voice=`<p class="fb-voice-note" role="status">Deine Nachricht wird bereitgemacht …</p>`;
    else if(state.audio)voice=`<div class="fb-audio-ready"><div class="fb-audio-title"><span aria-hidden="true">🎧</span><b>Deine Nachricht</b><span>${state.seconds} s</span></div><audio id="fb-audio" controls preload="metadata" src="${esc(state.audioUrl)}" aria-label="Deine Sprachnachricht anhören"></audio><button class="fb-small-button" data-act="aufnahme-verwerfen" ${locked?'disabled':''}>${ico('trash')} Verwerfen</button></div>`;
    else if(canRecord())voice=`<button class="fb-record" data-act="aufnahme" ${locked?'disabled':''}><span class="fb-mic-icon" aria-hidden="true">🎙️</span><span><b>Magst du noch etwas erzählen?</b><small>Freiwillig · bis 1 Minute</small></span><span class="fb-record-plus" aria-hidden="true">+</span></button>`;
    else voice=`<p class="fb-voice-note">${ico('mic')} Auf diesem Tablet ist keine Sprachaufnahme möglich.</p>`;
    app.innerHTML=`<div class="v3 fb${typeof schriftNormal==='function'&&!schriftNormal()?' caps':''}"><div class="fb-in"><header class="fb-head"><button class="v3-rund gross" data-act="weiter" aria-label="Zurück zu den Ideen">${ico('back')}</button><div><small>${esc(label)}</small><h1>Wie war's?</h1></div><button class="v3-rund" data-act="vorlesen" aria-label="Fragen vorlesen">${ico('speaker')}</button></header>
      ${!connection?`<section class="fb-not-connected"><span aria-hidden="true">🏫</span><h2>Tablet noch nicht verbunden.</h2><p>Zeig es deiner Lehrperson.</p><button class="fb-send" data-act="weiter">Weiter zu den Ideen ${ico('next')}</button></section>`:`<div class="fb-questions">${questions}</div>
      ${!klasse||klasse<1||klasse>6?`<fieldset class="fb-grade"><legend>Deine Klasse</legend><div>${[1,2,3,4,5,6].map(value=>`<button data-act="klasse" data-value="${value}" aria-label="${value}. Klasse" aria-pressed="${state.values.klasse===value}" ${locked?'disabled':''}>${value}</button>`).join('')}</div></fieldset>`:''}
      <section class="fb-voice" aria-label="Freiwillige Sprachnachricht">${voice}<p class="fb-audio-error" role="status" ${state.audioError?'':'hidden'}>${esc(state.audioError)}</p></section>
      <p class="fb-send-error" role="alert" ${state.error?'':'hidden'}>${esc(state.error)}</p><footer class="fb-actions"><button class="fb-small-button" data-act="weiter">Ohne Rückmeldung weiter</button><button class="fb-send" data-act="senden" ${!valid()||busy||state.sending||state.invalidConnection||(state.audioRejected&&state.audio)?'disabled':''}>${ico(state.sending?'up':'check')} ${state.sending?'Wird gesendet …':state.attempt?'Nochmals senden':'Senden'}</button></footer><p class="fb-recipient">Für deine Lehrperson · ${esc(connection.name)}</p>`}
      </div></div>`;
    if(focused&&focused.act){const query=focused.act==='waehlen'?`[data-act="waehlen"][data-key="${focused.key}"][data-value="${focused.value}"]`:focused.act==='klasse'?`[data-act="klasse"][data-value="${focused.value}"]`:`[data-act="${focused.act}"]`;const next=$(query,app);if(next&&!next.disabled)next.focus({preventScroll:true});}
  };
  const stopRecording=()=>{if(!state.active||state.stage!=='recording')return;clearRecordingTimers();state.seconds=Math.min(60,Math.max(1,Math.round((Date.now()-state.recordStarted)/1000)));state.stage='stopping';render();try{state.recorder.stop();}catch(e){cancelRecorder();state.stage='idle';state.audioError='Das hat nicht geklappt. Du kannst es nochmals versuchen.';render();}stopTracks(state.stream);state.stream=null;};
  const record=async()=>{
    if(!state.active||state.attempt||state.stage!=='idle'||!canRecord())return;
    releaseAudio();state.audioError='';state.audioRejected=false;state.error='';state.stage='requesting';const generation=++state.recordGeneration;render();
    state.micWait=setTimeout(()=>{if(state.active&&state.stage==='requesting'&&state.recordGeneration===generation){state.recordGeneration++;state.stage='idle';state.audioError='Das Mikrofon ist noch nicht bereit. Du kannst auch ohne Nachricht senden.';render();}},30000);
    let stream;
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      if(!state.active||state.recordGeneration!==generation){stopTracks(stream);return;}
      clearTimeout(state.micWait);state.micWait=null;state.stream=stream;
      const types=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'];let recorder=null;
      for(const mimeType of types){if(typeof MediaRecorder.isTypeSupported==='function'&&!MediaRecorder.isTypeSupported(mimeType))continue;try{recorder=new MediaRecorder(stream,{mimeType,audioBitsPerSecond:64000});break;}catch(e){}}
      if(!recorder)recorder=new MediaRecorder(stream,{audioBitsPerSecond:64000});
      state.recorder=recorder;state.chunks=[];state.seconds=0;
      recorder.ondataavailable=event=>{if(state.active&&state.recordGeneration===generation&&event.data&&event.data.size)state.chunks.push(event.data);};
      recorder.onerror=()=>{if(!state.active||state.recordGeneration!==generation)return;cancelRecorder();state.stage='idle';state.audioError='Die Aufnahme hat nicht geklappt. Versuch es nochmals oder sende ohne Nachricht.';render();};
      recorder.onstop=()=>{
        if(!state.active||state.recordGeneration!==generation)return;
        clearRecordingTimers();stopTracks(state.stream);state.stream=null;state.recorder=null;
        state.seconds=Math.min(60,Math.max(1,Math.round((Date.now()-state.recordStarted)/1000)));
        const mime=String(recorder.mimeType||state.chunks[0]?.type||'').split(';')[0].toLowerCase();
        if(!/^audio\/(webm|mp4|ogg)$/.test(mime)){state.chunks=[];state.stage='idle';state.audioError='Dieses Aufnahmeformat passt hier leider nicht. Sende deine Bewertung ohne Nachricht.';render();return;}
        const blob=new Blob(state.chunks,{type:mime});state.chunks=[];state.stage='idle';
        if(!blob.size){state.audioError='Die Aufnahme war leer. Versuch es nochmals.';render();return;}
        if(blob.size>RUECKMELDUNG_MAX_AUDIO){state.audioError='Die Nachricht ist zu gross. Nimm sie kürzer auf oder sende ohne Nachricht.';render();return;}
        state.audio=blob;state.audioUrl=URL.createObjectURL(blob);state.stage='ready';render();
      };
      state.recordStarted=Date.now();state.stage='recording';recorder.start(500);
      state.tick=setInterval(()=>{if(!state.active||state.stage!=='recording')return;state.seconds=Math.min(60,Math.floor((Date.now()-state.recordStarted)/1000));const timer=$('#fb-clock',app);if(timer)timer.textContent=state.seconds+' / 60 s';},250);
      state.limit=setTimeout(stopRecording,60000);render();
    }catch(e){stopTracks(stream);if(!state.active||state.recordGeneration!==generation)return;cancelRecorder();state.stage='idle';state.audioError=e&&e.name==='NotAllowedError'?'Das Mikrofon ist nicht freigegeben. Du kannst ohne Nachricht senden.':'Das Mikrofon ist gerade nicht verfügbar. Du kannst ohne Nachricht senden.';render();}
  };
  const submit=async()=>{
    if(!state.active||!state.connection||state.sending||state.invalidConnection||(state.audioRejected&&state.audio)||!valid()||['requesting','recording','stopping'].includes(state.stage))return;
    if(!state.attempt)state.attempt={data:{id:state.id,videoId:video.id,titel:String(video.title||'').slice(0,160),klasse:state.values.klasse,schwierigkeit:state.values.schwierigkeit,spass:state.values.spass},audio:state.audio};
    const form=new FormData();form.append('daten',JSON.stringify(state.attempt.data));
    if(state.attempt.audio){const type=state.attempt.audio.type.split(';')[0],extension=type==='audio/mp4'?'m4a':type==='audio/ogg'?'ogg':'webm';form.append('audio',state.attempt.audio,'nachricht.'+extension);}
    state.sending=true;state.error='';state.upload=new AbortController();state.uploadTimer=setTimeout(()=>state.upload?.abort(),30000);render();
    try{
      const response=await fetch(RUECKMELDUNG_API+'/feedback/abgeben',{method:'POST',headers:{Authorization:'Bearer '+state.connection.token},body:form,signal:state.upload.signal});
      if(!state.active)return;
      if(!response.ok){if(response.status===401||response.status===403){state.invalidConnection=true;state.error='Die Verbindung zur Klasse gilt nicht mehr. Zeig es deiner Lehrperson.';}else if(response.status===413){state.attempt=null;releaseAudio();state.stage='idle';state.error='Die Nachricht ist zu gross. Nimm sie kürzer auf oder sende ohne Nachricht.';}else if(response.status===415){state.attempt=null;state.audioRejected=true;state.error='Dieses Audioformat passt hier nicht. Verwirf die Nachricht und sende ohne Ton.';}else if(response.status===400){state.attempt=null;state.error='Die Rückmeldung wurde nicht angenommen. Prüfe deine Auswahl und versuche es nochmals.';}else if(response.status===429)state.error='Gerade kommen viele Antworten an. Versuch es gleich nochmals.';else state.error='Noch keine Bestätigung. Versuch es nochmals.';return;}
      leave();toast('Danke für deine Rückmeldung!');
    }catch(e){if(state.active)state.error='Noch keine Bestätigung. Prüfe die Verbindung und versuche es nochmals.';}
    finally{clearTimeout(state.uploadTimer);state.uploadTimer=null;state.upload=null;if(state.active){state.sending=false;render();}}
  };
  wire(app,{
    weiter:leave,vorlesen:read,
    waehlen:button=>{const key=button.dataset.key,value=Number(button.dataset.value);if(state.attempt||!['schwierigkeit','spass'].includes(key)||!Number.isInteger(value)||value<1||value>3)return;state.values[key]=value;state.error='';render();},
    klasse:button=>{const value=Number(button.dataset.value);if(state.attempt||!Number.isInteger(value)||value<1||value>6)return;state.values.klasse=value;render();},
    aufnahme:record,'aufnahme-stopp':stopRecording,
    'aufnahme-abbrechen':()=>{if(state.attempt)return;cancelRecorder();state.stage='idle';state.audioError='';render();},
    'aufnahme-verwerfen':()=>{if(state.attempt)return;cancelRecorder();releaseAudio();state.stage='idle';state.seconds=0;state.audioError='';state.audioRejected=false;state.error='';render();},
    senden:submit
  });
  render();
};
