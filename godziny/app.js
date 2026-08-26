const $=id=>document.getElementById(id),api="https://api.github.com",empty=()=>({version:1,months:{}});
let data=empty(),sha="",shown=new Date(),selected="",repo="",token="";

const pad=n=>String(n).padStart(2,"0"),monthKey=()=>`${shown.getFullYear()}-${pad(shown.getMonth()+1)}`,hours=n=>`${new Intl.NumberFormat("pl-PL",{maximumFractionDigits:2}).format(n/60)} h`,minutes=v=>Math.max(0,Math.round((Number(v)||0)*60)),encode=s=>btoa(String.fromCharCode(...new TextEncoder().encode(s))),decode=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,"")),c=>c.charCodeAt(0)));
const headers=()=>({Accept:"application/vnd.github+json",Authorization:`Bearer ${token}`,"X-GitHub-Api-Version":"2022-11-28"});
const weekdays=()=>{let y=shown.getFullYear(),m=shown.getMonth(),n=new Date(y,m+1,0).getDate(),x=0;for(let d=1;d<=n;d++){let w=new Date(y,m,d).getDay();if(w>0&&w<6)x++}return x};
const current=make=>{let k=monthKey();if(!data.months[k]&&make)data.months[k]={target:weekdays()*480,days:{}};return data.months[k]||{target:weekdays()*480,days:{}}};
const setStatus=(text,bad=false)=>{$("status").textContent=text;$('status').style.color=bad?"#b42318":"#16803b"};

async function request(path,options={}){
  let response=await fetch(`${api}${path}`,{...options,headers:{...headers(),...options.headers}}),body=await response.json().catch(()=>({}));
  if(!response.ok){let error=new Error(body.message||`Błąd ${response.status}`);error.status=response.status;throw error}
  return body
}

async function load(){
  await request(`/repos/${repo}`);
  try{
    let file=await request(`/repos/${repo}/contents/data.json`);
    data=JSON.parse(decode(file.content));sha=file.sha
  }catch(error){
    if(error.status!==404)throw error;
    data=empty();sha="";await sync()
  }
  render()
}

async function sync(){
  setStatus("Zapisywanie…");
  try{
    let body={message:`Godziny ${new Date().toISOString().slice(0,10)}`,content:encode(JSON.stringify(data))};
    if(sha)body.sha=sha;
    let result=await request(`/repos/${repo}/contents/data.json`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    sha=result.content.sha;setStatus("Zapisano")
  }catch(error){setStatus(error.status===409?"Zmiany na innym urządzeniu — połącz ponownie":"Nie zapisano w GitHub",true)}
}

async function connect(){
  repo=$("repo").value.trim();token=$("token").value.trim();$("login-error").textContent="";
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!token)return $("login-error").textContent="Podaj repozytorium i token.";
  $("connect").disabled=true;
  try{
    localStorage.setItem("hours-repo",repo);
    if($("remember").checked){localStorage.setItem("hours-token",token);sessionStorage.removeItem("hours-token")}else{sessionStorage.setItem("hours-token",token);localStorage.removeItem("hours-token")}
    await load();$("login").hidden=true;$("app").hidden=false
  }catch(error){$("login-error").textContent=error.status===404?"Nie znaleziono repozytorium lub token nie ma dostępu.":error.status===401?"Token jest nieprawidłowy.":error.message}
  $("connect").disabled=false
}

function render(){
  let value=current(false),entries=Object.values(value.days),planned=entries.reduce((s,d)=>s+(d.a||d.p||0),0),actual=entries.reduce((s,d)=>s+(d.a||0),0);
  $("month").textContent=shown.toLocaleDateString("pl-PL",{month:"long",year:"numeric"});$("target").textContent=hours(value.target);$("planned").textContent=hours(planned);$("actual").textContent=hours(actual);$("remaining").textContent=hours(Math.max(0,value.target-actual));
  let box=$("days"),y=shown.getFullYear(),m=shown.getMonth(),count=new Date(y,m+1,0).getDate(),lead=(new Date(y,m,1).getDay()+6)%7,today=new Date();box.replaceChildren();
  for(let i=0;i<lead;i++)box.append(dayButton());
  for(let d=1;d<=count;d++){
    let key=`${monthKey()}-${pad(d)}`,entry=value.days[key]||{},button=dayButton(d,entry);
    if(today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d)button.classList.add("today");
    button.onclick=()=>openDay(key,d,entry);box.append(button)
  }
}

function dayButton(day,entry={}){
  let button=document.createElement(day?"button":"span");button.className=day?"day":"day out";
  if(day){button.innerHTML=`<b>${day}</b>${entry.p?`<small class="p">P ${hours(entry.p)}</small>`:""}${entry.a?`<small class="a">W ${hours(entry.a)}</small>`:""}`}
  return button
}

function openDay(key,day,entry){
  selected=key;$("day-title").textContent=new Date(shown.getFullYear(),shown.getMonth(),day).toLocaleDateString("pl-PL",{weekday:"long",day:"numeric",month:"long"});$("day-plan").value=(entry.p||0)/60;$("day-actual").value=(entry.a||0)/60;$("day-dialog").showModal()
}

$("connect").onclick=connect;
$("logout").onclick=()=>{localStorage.removeItem("hours-token");sessionStorage.removeItem("hours-token");token="";$("token").value="";$("app").hidden=true;$("login").hidden=false};
$("prev").onclick=()=>{shown=new Date(shown.getFullYear(),shown.getMonth()-1,1);render()};
$("next").onclick=()=>{shown=new Date(shown.getFullYear(),shown.getMonth()+1,1);render()};
$("save-day").onclick=e=>{e.preventDefault();let value=current(true),entry={p:minutes($("day-plan").value),a:minutes($("day-actual").value)};if(entry.p||entry.a)value.days[selected]=entry;else delete value.days[selected];$("day-dialog").close();render();sync()};
$("target-card").onclick=()=>{$("target-input").value=current(false).target/60;$("target-dialog").showModal()};
$("save-target").onclick=e=>{e.preventDefault();current(true).target=minutes($("target-input").value);$("target-dialog").close();render();sync()};
$("fill").onclick=()=>$("fill-dialog").showModal();
$("save-fill").onclick=e=>{e.preventDefault();let value=current(true),amount=minutes($("fill-hours").value),y=shown.getFullYear(),m=shown.getMonth(),count=new Date(y,m+1,0).getDate();for(let d=1;d<=count;d++){let w=new Date(y,m,d).getDay(),key=`${monthKey()}-${pad(d)}`;if(w>0&&w<6&&!(value.days[key]?.p))value.days[key]={...value.days[key],p:amount}}$("fill-dialog").close();render();sync()};

repo=localStorage.getItem("hours-repo")||$("repo").value;let remembered=localStorage.getItem("hours-token");token=remembered||sessionStorage.getItem("hours-token")||"";$("repo").value=repo;$("token").value=token;if(token){$("remember").checked=!!remembered;connect()}if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
