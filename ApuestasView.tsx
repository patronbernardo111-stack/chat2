import React, { useState, useRef } from 'react';

// ── JUEGOS INTERACTIVOS ───────────────────────────────────────────────────
// Aviator Game
const AviatorGame:React.FC<{bet:number;onResult:(win:boolean,payout:number)=>void}>=({bet,onResult})=>{
  const [flying,setFlying]=useState(true);
  const [multiplier,setMultiplier]=useState(1.0);
  const [crashed,setCrashed]=useState(false);
  const [cashed,setCashed]=useState(false);
  
  React.useEffect(()=>{
    if(!flying||crashed||cashed)return;
    const timer=setInterval(()=>{
      setMultiplier(m=>{
        const next=Math.round((m+Math.random()*0.3)*100)/100;
        if(next>15){
          setCrashed(true);
          setFlying(false);
          onResult(false,0);
          return next;
        }
        return next;
      });
    },200);
    return()=>clearInterval(timer);
  },[flying,crashed,cashed,onResult]);

  return(
    <div style={{background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',borderRadius:'12px',padding:'24px',textAlign:'center',color:'#fff'}}>
      <div style={{fontSize:'28px',fontWeight:'900',marginBottom:'8px'}}>✈️ {multiplier.toFixed(2)}x</div>
      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',marginBottom:'16px'}}>
        {crashed?'💥 ¡CRASHED!':cashed?'✅ COBRADO':flying?'🚀 Volando...':''}
      </div>
      <div style={{display:'flex',gap:'8px',justifyContent:'center'}}>
        {!cashed&&flying&&<button onClick={()=>{setCashed(true);setFlying(false);onResult(true,Math.floor(bet*multiplier));}} style={{background:'#fbbf24',border:'none',color:'#1f2937',fontWeight:'700',padding:'10px 20px',borderRadius:'8px',cursor:'pointer'}}>COBRAR {Math.floor(bet*multiplier)} XAF</button>}
        {crashed&&<div style={{fontSize:'14px',fontWeight:'600',color:'#fca5a5'}}>Perdiste {bet} XAF</div>}
        {cashed&&<div style={{fontSize:'14px',fontWeight:'600',color:'#86efac'}}>¡Ganaste {Math.floor(bet*multiplier)} XAF!</div>}
      </div>
    </div>
  );
};

// Slots Game  
const SlotsGame:React.FC<{bet:number;onResult:(win:boolean,payout:number)=>void}>=({bet,onResult})=>{
  const [spinning,setSpinning]=useState(false);
  const [result,setResult]=useState<string[]>(['🎁','🎰','⭐']);
  const symbols=['🍎','🍊','🍋','🎁','🎰','⭐','💎','🔔'];
  
  const spin=()=>{
    setSpinning(true);
    setTimeout(()=>{
      const newResult=Array(3).fill(0).map(()=>symbols[Math.floor(Math.random()*symbols.length)]);
      setResult(newResult);
      const win=newResult[0]===newResult[1]&&newResult[1]===newResult[2];
      const payout=win?bet*50:0;
      onResult(win,payout);
      setSpinning(false);
    },1500);
  };

  return(
    <div style={{background:'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',borderRadius:'12px',padding:'20px',textAlign:'center',color:'#fff'}}>
      <div style={{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'16px'}}>
        {result.map((s,i)=><div key={i} style={{fontSize:'48px',background:'rgba(0,0,0,0.2)',borderRadius:'8px',padding:'12px 16px',minWidth:'60px',transform:spinning?`rotateY(${Math.random()*360}deg)`:'none',transition:'0.3s'}}>{s}</div>)}
      </div>
      <button onClick={spin} disabled={spinning} style={{background:spinning?'#9ca3af':'#fbbf24',border:'none',color:spinning?'#fff':'#1f2937',fontWeight:'700',padding:'12px 28px',borderRadius:'8px',cursor:spinning?'not-allowed':'pointer',fontSize:'14px'}}>
        {spinning?'GIRANDO...':'SPIN - '+bet+' XAF'}
      </button>
      {result[0]===result[1]&&result[1]===result[2]&&!spinning&&<div style={{fontSize:'14px',color:'#fcd34d',marginTop:'8px',fontWeight:'700'}}>🎉 ¡JACKPOT! {(bet*50).toLocaleString()} XAF</div>}
    </div>
  );
};

// Crash Game
const CrashGame:React.FC<{bet:number;onResult:(win:boolean,payout:number)=>void}>=({bet,onResult})=>{
  const [value,setValue]=useState(1.0);
  const [playing,setPlaying]=useState(true);
  const [crashed,setCrashed]=useState(false);
  const [selected,setSelected]=useState<number|null>(null);

  React.useEffect(()=>{
    if(!playing||crashed||selected!==null)return;
    const timer=setInterval(()=>{
      setValue(v=>{
        const next=Math.round((v+Math.random()*0.25)*100)/100;
        if(next>20){
          setCrashed(true);
          setPlaying(false);
          return next;
        }
        return next;
      });
    },150);
    return()=>clearInterval(timer);
  },[playing,crashed,selected]);

  return(
    <div style={{background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',borderRadius:'12px',padding:'20px',textAlign:'center',color:'#fff'}}>
      <div style={{fontSize:'32px',fontWeight:'900',marginBottom:'16px'}}>
        {value.toFixed(2)}x
        {crashed&&' 💥'}
      </div>
      {selected!==null?(
        <div style={{fontSize:'14px',color:selected>value?'#86efac':'#fca5a5'}}>
          {selected>value?`✅ ¡Ganaste! ${Math.floor(bet*selected)} XAF`:`❌ Perdiste ${bet} XAF`}
        </div>
      ):crashed&&selected===null?(
        <div style={{fontSize:'14px',color:'#fca5a5'}}>❌ No sacaste a tiempo - Desapareció en {value.toFixed(2)}x</div>
      ):(
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',justifyContent:'center'}}>
          {[1.5,2,3,5,10,15].map(mult=><button key={mult} onClick={()=>{if(!crashed&&playing){setSelected(mult);setPlaying(false);}}} disabled={crashed||playing} style={{background:crashed||!playing?'#9ca3af':'#fbbf24',color:crashed||!playing?'#888':'#1f2937',fontWeight:'700',padding:'8px 12px',borderRadius:'6px',fontSize:'12px',cursor:crashed||!playing?'not-allowed':'pointer'}}>{mult}x</button>)}
        </div>
      )}
    </div>
  );
};

// Ruleta Game
const RuletaGame:React.FC<{bet:number;onResult:(win:boolean,payout:number)=>void}>=({bet,onResult})=>{
  const [spinning,setSpinning]=useState(false);
  const [result,setResult]=useState<number|null>(null);
  const [selected,setSelected]=useState<number|null>(null);
  const numbers=Array(36).fill(0).map((_,i)=>i+1);
  const isRed=(n:number)=>[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n);

  const spinRuleta=()=>{
    if(selected===null)return;
    setSpinning(true);
    setTimeout(()=>{
      const res=Math.floor(Math.random()*36)+1;
      setResult(res);
      const win=res===selected;
      onResult(win,win?bet*35:0);
      setSpinning(false);
    },2000);
  };

  return(
    <div style={{background:'linear-gradient(135deg,#2ecc71 0%,#27ae60 100%)',borderRadius:'12px',padding:'16px',color:'#fff'}}>
      <div style={{fontSize:'18px',fontWeight:'700',marginBottom:'12px'}}>🎡 Ruleta</div>
      {result!==null&&<div style={{background:'rgba(0,0,0,0.2)',borderRadius:'8px',padding:'12px',textAlign:'center',marginBottom:'12px'}}>
        <div style={{fontSize:'32px',fontWeight:'900',color:isRed(result)?'#ff6b6b':'#000'}}>
          {isRed(result)?'🔴':'⚫'} {result}
        </div>
        <div style={{fontSize:'12px',marginTop:'4px',color:selected===result?'#86efac':'#fca5a5'}}>
          {selected===result?'✅ ¡GANASTE '+Math.floor(bet*35)+' XAF!':'❌ '+selected+' ≠ '+result}
        </div>
      </div>}
      {result===null&&<div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'4px',marginBottom:'12px'}}>
        {numbers.map(n=><button key={n} onClick={()=>setSelected(n)} disabled={spinning} style={{background:selected===n?(isRed(n)?'#ff6b6b':'#000'):'#fff',color:selected===n?'#fff':'#1f2937',fontWeight:selected===n?'700':'500',padding:'6px',borderRadius:'4px',fontSize:'10px',border:'none',cursor:spinning?'not-allowed':'pointer'}}>
          {n}
        </button>)}
      </div>}
      <button onClick={spinRuleta} disabled={spinning||result!==null} style={{width:'100%',background:spinning||result!==null?'#9ca3af':'#fbbf24',color:spinning||result!==null?'#888':'#1f2937',fontWeight:'700',padding:'10px',borderRadius:'6px',cursor:spinning||result!==null?'not-allowed':'pointer',fontSize:'14px',border:'none'}}>
        {spinning?'GIRANDO...':result!==null?'RESULTADO':selected?'APOSTAR '+bet+' XAF':'ELIGE NÚMERO'}
      </button>
    </div>
  );
};

// Dice Game
const DiceGame:React.FC<{bet:number;onResult:(win:boolean,payout:number)=>void}>=({bet,onResult})=>{
  const [rolling,setRolling]=useState(false);
  const [dice,setDice]=useState([3,4]);
  const [prediction,setPrediction]=useState<'alto'|'bajo'|null>(null);
  const total=dice[0]+dice[1];

  const roll=()=>{
    if(!prediction)return;
    setRolling(true);
    setTimeout(()=>{
      const d1=Math.floor(Math.random()*6)+1;
      const d2=Math.floor(Math.random()*6)+1;
      setDice([d1,d2]);
      const sum=d1+d2;
      const win=(prediction==='alto'&&sum>=8)||(prediction==='bajo'&&sum<=7);
      onResult(win,win?bet*2:0);
      setRolling(false);
    },1000);
  };

  return(
    <div style={{background:'linear-gradient(135deg,#f97316 0%,#ea580c 100%)',borderRadius:'12px',padding:'20px',textAlign:'center',color:'#fff'}}>
      <div style={{fontSize:'18px',fontWeight:'700',marginBottom:'12px'}}>🎲 Dados</div>
      <div style={{display:'flex',justifyContent:'center',gap:'16px',marginBottom:'16px'}}>
        {dice.map((d,i)=><div key={i} style={{fontSize:'48px',background:'rgba(255,255,255,0.2)',borderRadius:'12px',padding:'16px 20px',transform:rolling?`rotateZ(${Math.random()*360}deg)`:'none',transition:'0.3s'}}>{d}</div>)}
      </div>
      <div style={{fontSize:'24px',fontWeight:'900',marginBottom:'16px'}}>= {rolling?'?':total}</div>
      {prediction===null?(
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={()=>setPrediction('bajo')} style={{flex:1,background:'#3b82f6',border:'none',color:'#fff',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:'pointer'}}>⬇️ BAJO (≤7)</button>
          <button onClick={()=>setPrediction('alto')} style={{flex:1,background:'#ef4444',border:'none',color:'#fff',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:'pointer'}}>⬆️ ALTO (≥8)</button>
        </div>
      ):(
        <button onClick={roll} disabled={rolling} style={{width:'100%',background:rolling?'#9ca3af':'#fbbf24',color:rolling?'#fff':'#1f2937',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:rolling?'not-allowed':'pointer',fontSize:'14px',border:'none'}}>
          {rolling?'RODANDO...':'TIRAR'}
        </button>
      )}
    </div>
  );
};

// Coin Flip Game
const CoinFlipGame:React.FC<{bet:number;onResult:(win:boolean,payout:number)=>void}>=({bet,onResult})=>{
  const [flipping,setFlipping]=useState(false);
  const [result,setResult]=useState<'cara'|'cruz'|null>(null);
  const [choice,setChoice]=useState<'cara'|'cruz'|null>(null);

  const flip=()=>{
    if(!choice)return;
    setFlipping(true);
    setTimeout(()=>{
      const res=Math.random()>0.5?'cara':'cruz';
      setResult(res);
      const win=res===choice;
      onResult(win,win?bet*2:0);
      setFlipping(false);
    },1200);
  };

  return(
    <div style={{background:'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)',borderRadius:'12px',padding:'20px',textAlign:'center',color:'#fff'}}>
      <div style={{fontSize:'18px',fontWeight:'700',marginBottom:'16px'}}>🪙 Cara o Cruz</div>
      <div style={{fontSize:'64px',marginBottom:'16px',background:'rgba(255,255,255,0.2)',borderRadius:'16px',padding:'20px',transform:flipping?'rotateY(720deg)':'none',transition:'0.8s cubic-bezier(0.4,0.2,0.2,1)'}}>
        {result==='cara'?'👑':result==='cruz'?'🦅':'?'}
      </div>
      {choice===null?(
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={()=>setChoice('cara')} style={{flex:1,background:'#ec4899',border:'none',color:'#fff',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:'pointer'}}>👑 CARA</button>
          <button onClick={()=>setChoice('cruz')} style={{flex:1,background:'#06b6d4',border:'none',color:'#fff',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:'pointer'}}>🦅 CRUZ</button>
        </div>
      ):(
        <button onClick={flip} disabled={flipping||result!==null} style={{width:'100%',background:flipping||result!==null?'#9ca3af':'#fbbf24',color:flipping||result!==null?'#fff':'#1f2937',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:flipping||result!==null?'not-allowed':'pointer',fontSize:'14px',border:'none'}}>
          {flipping?'GIRANDO...':result!==null?'RESULTADO':'LANZAR'}
        </button>
      )}
      {result!==null&&<div style={{marginTop:'12px',fontSize:'12px',color:result===choice?'#86efac':'#fca5a5'}}>{result===choice?'✅ ¡GANASTE!':'❌ PERDISTE'}</div>}
    </div>
  );
};

// Lucky Wheel Game
const LuckyWheelGame:React.FC<{bet:number;onResult:(win:boolean,payout:number)=>void}>=({bet,onResult})=>{
  const [spinning,setSpinning]=useState(false);
  const [rotation,setRotation]=useState(0);
  const segments=['🎁','💰','🎉','✨','🏆','🎊','💎','🌟'];
  const multipliers=[0.5,1,2,3,0.25,1.5,5,2.5];

  const spin=()=>{
    setSpinning(true);
    const spins=Math.floor(Math.random()*4)+4;
    const finalRotation=spins*360+Math.random()*360;
    setRotation(finalRotation);
    
    setTimeout(()=>{
      const winSegment=Math.floor((finalRotation%360)/(360/segments.length));
      const mult=multipliers[winSegment]||1;
      const payout=Math.floor(bet*mult);
      onResult(mult>1,payout);
      setSpinning(false);
    },3000);
  };

  return(
    <div style={{background:'conic-gradient(#ff6b6b 0deg 45deg,#4f46e5 45deg 90deg,#10b981 90deg 135deg,#f59e0b 135deg 180deg,#ec4899 180deg 225deg,#8b5cf6 225deg 270deg,#06b6d4 270deg 315deg,#f97316 315deg 360deg)',borderRadius:'12px',padding:'20px',textAlign:'center',color:'#fff',position:'relative',minHeight:'200px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10,fontSize:'24px'}}>🎯</div>
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',marginBottom:'16px',height:'120px'}}>
        <div style={{width:'100px',height:'100px',borderRadius:'50%',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',transform:`rotate(${rotation}deg)`,transition:spinning?'transform 3s cubic-bezier(0.2,0.8,0.2,1)':'none',position:'relative'}}>
          {segments.map((seg,i)=><div key={i} style={{position:'absolute',width:'50px',height:'50px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',transform:`rotate(${i*(360/segments.length)}deg) translateY(-50px)`}}>{seg}</div>)}
        </div>
      </div>
      <button onClick={spin} disabled={spinning} style={{width:'100%',background:spinning?'#9ca3af':'#fbbf24',color:spinning?'#fff':'#1f2937',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:spinning?'not-allowed':'pointer',fontSize:'14px',border:'none'}}>
        {spinning?'GIRANDO...':'GIRAR '+bet+' XAF'}
      </button>
    </div>
  );
};

// Higher or Lower Game
const HigherLowerGame:React.FC<{bet:number;onResult:(win:boolean,payout:number)=>void}>=({bet,onResult})=>{
  const [card,setCard]=useState(7);
  const [prediction,setPrediction]=useState<'higher'|'lower'|null>(null);
  const [result,setResult]=useState<number|null>(null);
  const [playing,setPlaying]=useState(true);

  const play=()=>{
    if(!prediction||!playing)return;
    const newCard=Math.floor(Math.random()*13)+1;
    setResult(newCard);
    const win=(prediction==='higher'&&newCard>card)||(prediction==='lower'&&newCard<card);
    onResult(win,win?bet*2:0);
    setPlaying(false);
  };

  return(
    <div style={{background:'linear-gradient(135deg,#31a24c 0%,#1e7e34 100%)',borderRadius:'12px',padding:'20px',textAlign:'center',color:'#fff'}}>
      <div style={{fontSize:'18px',fontWeight:'700',marginBottom:'16px'}}>♠️ Mayor o Menor</div>
      <div style={{display:'flex',justifyContent:'space-around',alignItems:'center',marginBottom:'20px'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',marginBottom:'6px'}}>Carta Actual</div>
          <div style={{fontSize:'48px',background:'#fff',color:'#1e7e34',padding:'16px 24px',borderRadius:'8px',fontWeight:'900',minWidth:'80px'}}>
            {card}
          </div>
        </div>
        <div style={{fontSize:'24px'}}>?</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',marginBottom:'6px'}}>Nueva Carta</div>
          <div style={{fontSize:'48px',background:'rgba(255,255,255,0.2)',color:'#fff',padding:'16px 24px',borderRadius:'8px',fontWeight:'900',minWidth:'80px'}}>
            {result||'🔄'}
          </div>
        </div>
      </div>
      {playing?(
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={()=>{setPrediction('higher');play();}} style={{flex:1,background:'#ef4444',border:'none',color:'#fff',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:'pointer'}}>⬆️ MAYOR</button>
          <button onClick={()=>{setPrediction('lower');play();}} style={{flex:1,background:'#3b82f6',border:'none',color:'#fff',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:'pointer'}}>⬇️ MENOR</button>
        </div>
      ):(
        <button onClick={()=>{setResult(null);setPrediction(null);setPlaying(true);}} style={{width:'100%',background:'#fbbf24',color:'#1f2937',fontWeight:'700',padding:'12px',borderRadius:'8px',cursor:'pointer',fontSize:'14px',border:'none'}}>
          JUGAR DE NUEVO
        </button>
      )}
    </div>
  );
};

interface Props { onBack: () => void; userBalance: number; onDebit: (amount: number) => void; }
type BSI = { id: string; matchLabel: string; pick: string; odds: number; stake: string; };
interface Match { id: string; league: string; li: string; home: string; away: string; time: string; live?: boolean; score?: string; minute?: number; o1: number; oX?: number; o2: number; mkts?: { name: string; opts: { label: string; odds: number }[] }[]; }
interface SS { id: string; label: string; icon: string; matches: Match[]; }
interface CG { id: string; name: string; icon: string; provider: string; rtp: string; hot?: boolean; type: 'slots'|'table'|'live'|'crash'; }
interface LG { id: string; name: string; icon: string; jackpot: string; price: number; draw: string; pc: number; mn: number; }
interface Co { id: string; name: string; tagline: string; color: string; type: 'sports'|'casino'|'lottery'; bonus: string; minBet: number; minDeposit: number; url: string; officialUrls?: string[]; sports?: SS[]; casino?: CG[]; lottery?: LG[]; }
const sd = new Date().getDate() + new Date().getMonth()*31;
const rng = (n:number) => { const x=Math.sin(n+sd)*10000; return x-Math.floor(x); };
const ro = (b:number,n:number) => parseFloat(Math.max(1.01,b+rng(n)*0.5-0.25).toFixed(2));
const mk = (id:string,league:string,li:string,home:string,away:string,time:string,o1:number,oX:number|undefined,o2:number,live?:boolean,score?:string,min?:number,mkts?:{name:string;opts:{label:string;odds:number}[]}[]):Match => ({id,league,li,home,away,time,live,score,minute:min,o1:ro(o1,o1*7),oX:oX?ro(oX,oX*13):undefined,o2:ro(o2,o2*11),mkts});
const AG:SS[]=[
  {id:'futbol',label:'Fútbol',icon:'⚽',matches:[
    mk('ag1','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Liverpool','Arsenal','Hoy 21:00',1.55,4.20,5.50,true,'2-1',67,[{name:'Más/Menos',opts:[{label:'+2.5',odds:1.55},{label:'-2.5',odds:2.40}]},{name:'Ambos marcan',opts:[{label:'Sí',odds:1.65},{label:'No',odds:2.10}]}]),
    mk('ag2','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Man City','Chelsea','Hoy 18:30',1.80,3.60,4.20,false,undefined,undefined,[{name:'Handicap',opts:[{label:'Man City -1',odds:2.20},{label:'Chelsea +1',odds:1.70}]}]),
    mk('ag3','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Man United','Tottenham','Mañana 16:00',2.10,3.40,3.30),
    mk('ag4','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Newcastle','Aston Villa','Sáb 14:00',2.30,3.20,3.10),
    mk('ag5','La Liga','🇪🇸','Real Madrid','Barcelona','Sáb 21:00',2.20,3.40,3.10,false,undefined,undefined,[{name:'Goleador',opts:[{label:'Mbappé',odds:2.50},{label:'Lewandowski',odds:3.00},{label:'Vinicius',odds:3.50}]},{name:'Más/Menos',opts:[{label:'+2.5',odds:1.60},{label:'-2.5',odds:2.25}]}]),
    mk('ag6','La Liga','🇪🇸','Atletico Madrid','Sevilla','Dom 18:30',1.75,3.50,4.50),
    mk('ag7','Serie A','','Inter Milan','AC Milan','Dom 20:45',2.00,3.30,3.60,false,undefined,undefined,[{name:'Más/Menos',opts:[{label:'+2.5',odds:1.75},{label:'-2.5',odds:2.00}]}]),
    mk('ag8','Serie A','🇮🇹','Juventus','Napoli','Sáb 18:00',2.30,3.20,3.00),
    mk('ag9','Bundesliga','🇩🇪','Bayern Munich','Borussia Dortmund','Sáb 18:30',1.65,4.00,5.00,false,undefined,undefined,[{name:'Handicap',opts:[{label:'Bayern -1.5',odds:2.10},{label:'Dortmund +1.5',odds:1.75}]}]),
    mk('ag10','Ligue 1','🇫🇷','PSG','Marseille','Dom 21:00',1.55,4.20,5.50),
    mk('ag11','Champions League','⭐','Real Madrid','Bayern Munich','Mar 21:00',2.10,3.50,3.30,false,undefined,undefined,[{name:'Clasificado',opts:[{label:'Real Madrid',odds:1.80},{label:'Bayern',odds:2.00}]},{name:'Ambos marcan',opts:[{label:'Sí',odds:1.75},{label:'No',odds:2.00}]}]),
    mk('ag12','Champions League','⭐','Barcelona','Inter Milan','Mié 21:00',1.90,3.60,4.00),
    mk('ag13','Champions League','⭐','Man City','PSG','Mar 21:00',1.75,3.80,4.50),
    mk('ag14','Champions League','⭐','Liverpool','Juventus','Mié 21:00',1.60,4.00,5.50),
    mk('ag15','Europa League','🟠','Atletico Madrid','Roma','Jue 21:00',1.95,3.40,3.80),
    mk('ag16','Copa África','🌍','Senegal','Marruecos','Sáb 20:00',2.60,3.10,2.60),
    mk('ag17','Copa África','🌍','Nigeria','Camerún','Dom 17:00',2.20,3.20,3.10),
    mk('ag18','CAF Champions League','🌍','Al Ahly','Wydad Casablanca','Mar 20:00',1.85,3.40,4.20),
    mk('ag19','Clasificación Mundial','🌐','Brasil','Argentina','Mar 02:00',2.30,3.20,2.90),
  ]},
  {id:'baloncesto',label:'Basket',icon:'🏀',matches:[
    mk('agb1','NBA','🇺🇸','LA Lakers','Golden State Warriors','Hoy 02:30',1.95,undefined,1.88,true,'89-94',38,[{name:'Total puntos',opts:[{label:'+215.5',odds:1.90},{label:'-215.5',odds:1.90}]}]),
    mk('agb2','NBA','🇺🇸','Boston Celtics','Miami Heat','Hoy 01:00',1.65,undefined,2.30),
    mk('agb3','NBA','🇺🇸','Denver Nuggets','Phoenix Suns','Mañana 03:00',1.80,undefined,2.05),
    mk('agb4','EuroLiga','🇪🇺','Real Madrid','CSKA Moscú','Jue 20:45',1.70,undefined,2.20),
  ]},
  {id:'tenis',label:'Tenis',icon:'🎾',matches:[
    mk('agt1','ATP Masters 1000','🎾','Carlos Alcaraz','Jannik Sinner','Hoy 14:00',1.75,undefined,2.10,true,'6-4, 3-2',0,[{name:'Sets',opts:[{label:'2-0',odds:2.50},{label:'2-1',odds:2.80},{label:'0-2',odds:3.20},{label:'1-2',odds:3.50}]}]),
    mk('agt2','ATP Masters 1000','🎾','Novak Djokovic','Alexander Zverev','Mañana 15:00',1.60,undefined,2.40),
    mk('agt3','WTA Premier','🎾','Iga Swiatek','Aryna Sabalenka','Dom 12:00',1.65,undefined,2.25),
  ]},
  {id:'boxeo',label:'Boxeo',icon:'🥊',matches:[
    mk('agx1','Peso Pesado WBC','🥊','Tyson Fury','Anthony Joshua','Sáb 23:00',1.80,undefined,2.05,false,undefined,undefined,[{name:'Método',opts:[{label:'KO/TKO Fury',odds:2.50},{label:'Decisión Fury',odds:3.00},{label:'KO/TKO Joshua',odds:3.50},{label:'Empate',odds:18.00}]}]),
    mk('agx2','Peso Welter WBA','🥊','Errol Spence Jr.','Terence Crawford','Dom 02:00',2.10,undefined,1.75),
  ]},
  {id:'mma',label:'MMA',icon:'🥋',matches:[
    mk('agm1','UFC 310','🥋','Jon Jones','Stipe Miocic','Dom 04:00',1.55,undefined,2.55,false,undefined,undefined,[{name:'Método',opts:[{label:'KO/TKO Jones',odds:2.20},{label:'Sumisión Jones',odds:4.00},{label:'Decisión Jones',odds:3.50}]},{name:'Ronda',opts:[{label:'Ronda 1',odds:3.00},{label:'Ronda 2',odds:3.50},{label:'Ronda 3+',odds:2.50}]}]),
    mk('agm2','UFC Fight Night','🥋','Israel Adesanya','Alex Pereira','Sáb 03:00',2.30,undefined,1.65),
  ]},
  {id:'esports',label:'eSports',icon:'🎮',matches:[
    mk('age1','CS2 - ESL Pro League','🎮','Natus Vincere','FaZe Clan','Hoy 17:00',1.75,undefined,2.10,true,'1-0 mapas',0,[{name:'Mapas',opts:[{label:'2-0',odds:2.80},{label:'2-1',odds:2.20},{label:'0-2',odds:3.50}]}]),
    mk('age2','LoL - LEC','🎮','G2 Esports','Fnatic','Hoy 19:00',1.60,undefined,2.35),
    mk('age3','Dota 2','🎮','Team Spirit','OG','Mañana 12:00',1.85,undefined,2.00),
  ]},
];
const BT:SS[]=[
  {id:'futbol',label:'Fútbol',icon:'⚽',matches:[
    mk('bt1','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Arsenal','Man City','Hoy 20:00',3.20,3.50,2.10,true,'0-1',55,[{name:'Más/Menos',opts:[{label:'+2.5',odds:1.60},{label:'-2.5',odds:2.30}]}]),
    mk('bt2','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Chelsea','Newcastle','Mañana 18:30',1.90,3.40,3.80),
    mk('bt3','La Liga','🇪🇸','Barcelona','Atletico Madrid','Dom 20:00',1.85,3.50,4.00,false,undefined,undefined,[{name:'Goleador',opts:[{label:'Lewandowski',odds:2.80},{label:'Griezmann',odds:3.50}]}]),
    mk('bt4','La Liga','🇪🇸','Real Madrid','Girona','Sáb 16:15',1.45,4.50,7.00),
    mk('bt5','Serie A','','Napoli','Juventus','Dom 15:00',2.80,3.20,2.50),
    mk('bt6','Bundesliga','🇩🇪','Borussia Dortmund','Bayer Leverkusen','Sáb 15:30',2.80,3.30,2.50),
    mk('bt7','Champions League','⭐','PSG','Arsenal','Mar 21:00',2.00,3.50,3.60,false,undefined,undefined,[{name:'Clasificado',opts:[{label:'PSG',odds:1.90},{label:'Arsenal',odds:1.90}]}]),
    mk('bt8','Champions League','⭐','Juventus','Man City','Mié 21:00',3.50,3.40,2.00),
    mk('bt9','Europa League','🟠','Man United','Ajax','Jue 21:00',1.80,3.50,4.20),
    mk('bt10','Copa África','🌍','Marruecos','Nigeria','Dom 19:00',2.20,3.20,3.30),
    mk('bt11','Clasificación Mundial','🌐','Camerún','Senegal','Vie 20:00',2.80,3.10,2.50),
  ]},
  {id:'baloncesto',label:'Basket',icon:'🏀',matches:[
    mk('btb1','NBA','🇺🇸','Boston Celtics','Cleveland Cavaliers','Hoy 00:30',1.60,undefined,2.40),
    mk('btb2','NBA','🇺🇸','Golden State Warriors','San Antonio Spurs','Hoy 03:00',1.50,undefined,2.60),
    mk('btb3','EuroLiga','🇪🇺','Olympiacos','Panathinaikos','Jue 19:00',2.10,undefined,1.75),
  ]},
  {id:'rugby',label:'Rugby',icon:'🏉',matches:[
    mk('btr1','Six Nations','🏉','Francia','Inglaterra','Sáb 16:45',1.85,undefined,1.98,false,undefined,undefined,[{name:'Hándicap',opts:[{label:'Francia -5.5',odds:1.90},{label:'Inglaterra +5.5',odds:1.90}]}]),
    mk('btr2','Rugby Championship','🏉','Nueva Zelanda','Sudáfrica','Dom 09:05',1.70,undefined,2.15),
  ]},
  {id:'tenis',label:'Tenis',icon:'🎾',matches:[
    mk('btt1','ATP Masters 1000','🎾','Novak Djokovic','Rafael Nadal','Mañana 15:00',1.60,undefined,2.40),
    mk('btt2','ATP 500','🎾','Carlos Alcaraz','Holger Rune','Sáb 14:00',1.55,undefined,2.50),
  ]},
  {id:'boxeo',label:'Boxeo',icon:'🥊',matches:[
    mk('btx1','Peso Semipesado WBC','🥊','Dmitry Bivol','Artur Beterbiev','Sáb 22:00',2.20,undefined,1.70,false,undefined,undefined,[{name:'Método',opts:[{label:'KO/TKO',odds:2.00},{label:'Decisión',odds:1.85},{label:'Empate',odds:20.00}]}]),
    mk('btx2','Peso Pesado IBF','🥊','Anthony Joshua','Deontay Wilder','Dom 23:00',1.90,undefined,1.95),
  ]},
  {id:'mma',label:'MMA',icon:'🥋',matches:[
    mk('btm1','UFC Fight Night','🥋','Conor McGregor','Dustin Poirier','Sáb 04:00',1.80,undefined,2.05,false,undefined,undefined,[{name:'Método',opts:[{label:'KO/TKO',odds:1.90},{label:'Sumisión',odds:3.50},{label:'Decisión',odds:2.80}]}]),
    mk('btm2','Bellator','🥋','Ryan Bader','Vadim Nemkov','Dom 03:00',2.10,undefined,1.75),
  ]},
  {id:'esports',label:'eSports',icon:'🎮',matches:[
    mk('bte1','CS2 - BLAST Premier','🎮','Astralis','Team Vitality','Hoy 18:00',2.20,undefined,1.70),
    mk('bte2','LoL - LCK','🎮','T1','Gen.G','Mañana 10:00',1.65,undefined,2.30),
  ]},
  {id:'hockey',label:'Hockey',icon:'🏒',matches:[
    mk('bth1','NHL','🏒','Toronto Maple Leafs','Boston Bruins','Hoy 01:00',1.90,undefined,1.95,false,undefined,undefined,[{name:'Total goles',opts:[{label:'+5.5',odds:1.85},{label:'-5.5',odds:1.90}]}]),
    mk('bth2','NHL','🏒','Colorado Avalanche','Vegas Golden Knights','Mañana 03:00',1.85,undefined,2.00),
  ]},
];
const XB:SS[]=[
  {id:'futbol',label:'Fútbol',icon:'⚽',matches:[
    mk('xb1','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Liverpool','Man City','Hoy 21:00',2.40,3.30,2.80,true,'1-1',72,[{name:'Más/Menos',opts:[{label:'+2.5',odds:1.55},{label:'-2.5',odds:2.40}]},{name:'Handicap asiático',opts:[{label:'Liverpool -0.5',odds:2.50},{label:'Man City -0.5',odds:2.90}]},{name:'Córners',opts:[{label:'+9.5',odds:1.85},{label:'-9.5',odds:1.90}]}]),
    mk('xb2','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Arsenal','Chelsea','Mañana 20:00',1.95,3.40,3.70),
    mk('xb3','La Liga','🇪🇸','Real Madrid','Atletico Madrid','Dom 21:00',2.00,3.40,3.60,false,undefined,undefined,[{name:'Goleador',opts:[{label:'Mbappé',odds:2.40},{label:'Griezmann',odds:3.20},{label:'Vinicius',odds:3.00}]},{name:'Tarjetas',opts:[{label:'+3.5',odds:1.90},{label:'-3.5',odds:1.85}]}]),
    mk('xb4','La Liga','🇪🇸','Barcelona','Sevilla','Sáb 18:30',1.60,3.80,5.50),
    mk('xb5','Serie A','🇮🇹','Inter Milan','Juventus','Dom 20:45',2.10,3.20,3.40,false,undefined,undefined,[{name:'Handicap',opts:[{label:'Inter -0.5',odds:2.20},{label:'Juventus +0.5',odds:1.70}]}]),
    mk('xb6','Bundesliga','🇩🇪','Bayern Munich','RB Leipzig','Sáb 18:30',1.70,3.80,4.80,false,undefined,undefined,[{name:'Handicap',opts:[{label:'Bayern -1.5',odds:2.00},{label:'Leipzig +1.5',odds:1.85}]}]),
    mk('xb7','Ligue 1','🇫🇷','PSG','Nice','Sáb 21:00',1.40,4.80,8.00),
    mk('xb8','Champions League','⭐','Barcelona','Bayern Munich','Mar 21:00',2.30,3.40,3.00,false,undefined,undefined,[{name:'Clasificado',opts:[{label:'Barcelona',odds:2.00},{label:'Bayern',odds:1.80}]},{name:'Goleador',opts:[{label:'Lewandowski',odds:2.80},{label:'Kane',odds:3.00},{label:'Yamal',odds:4.00}]}]),
    mk('xb9','Champions League','⭐','Man City','Real Madrid','Mié 21:00',2.20,3.50,3.10),
    mk('xb10','Champions League','⭐','PSG','Liverpool','Mar 21:00',2.40,3.30,2.90),
    mk('xb11','Europa League','🟠','Man United','Ajax','Jue 21:00',1.80,3.50,4.20),
    mk('xb12','Copa África','🌍','Marruecos','Senegal','Sáb 20:00',2.30,3.20,3.00),
    mk('xb13','CAF Champions League','🌍','Al Ahly','Espérance Tunis','Mar 20:00',2.00,3.30,3.60),
    mk('xb14','Clasificación Mundial','🌐','Argentina','Uruguay','Jue 01:00',1.80,3.50,4.50),
    mk('xb15','Clasificación Mundial','🌐','España','Alemania','Vie 20:45',2.10,3.30,3.40),
  ]},
  {id:'baloncesto',label:'Basket',icon:'🏀',matches:[
    mk('xbb1','NBA','🇺🇸','Denver Nuggets','LA Lakers','Hoy 03:00',1.75,undefined,2.10,true,'102-98',45,[{name:'Total puntos',opts:[{label:'+218.5',odds:1.90},{label:'-218.5',odds:1.90}]},{name:'Handicap',opts:[{label:'Nuggets -4.5',odds:1.90},{label:'Lakers +4.5',odds:1.90}]}]),
    mk('xbb2','NBA','🇺🇸','Miami Heat','Chicago Bulls','Hoy 01:30',1.65,undefined,2.30),
    mk('xbb3','EuroLiga','🇪🇺','Anadolu Efes','Maccabi Tel Aviv','Jue 20:00',1.65,undefined,2.30),
  ]},
  {id:'tenis',label:'Tenis',icon:'🎾',matches:[
    mk('xbt1','ATP Masters 1000','🎾','Carlos Alcaraz','Daniil Medvedev','Hoy 16:00',1.70,undefined,2.20),
    mk('xbt2','Roland Garros','🎾','Rafael Nadal','Novak Djokovic','Mañana 14:00',2.20,undefined,1.65),
    mk('xbt3','WTA Finals','🎾','Iga Swiatek','Aryna Sabalenka','Dom 14:00',1.65,undefined,2.25),
  ]},
  {id:'mma',label:'MMA',icon:'🥋',matches:[
    mk('xbm1','UFC 311','🥋','Charles Oliveira','Islam Makhachev','Sáb 04:00',2.50,undefined,1.55,false,undefined,undefined,[{name:'Método',opts:[{label:'KO/TKO',odds:3.00},{label:'Sumisión',odds:2.50},{label:'Decisión',odds:2.20}]},{name:'Ronda',opts:[{label:'Ronda 1',odds:3.50},{label:'Ronda 2',odds:4.00},{label:'Ronda 3+',odds:2.00}]}]),
    mk('xbm2','ONE Championship','🥋','Rodtang Jitmuangnon','Demetrious Johnson','Dom 14:00',1.70,undefined,2.20),
  ]},
  {id:'esports',label:'eSports',icon:'🎮',matches:[
    mk('xbe1','CS2 - Major','🎮','Team Liquid','Cloud9','Hoy 20:00',1.80,undefined,2.05),
    mk('xbe2','LoL - Worlds','🎮','T1','JDG','Mañana 09:00',1.75,undefined,2.10),
    mk('xbe3','Valorant','🎮','Fnatic','NaVi','Dom 17:00',2.00,undefined,1.85),
  ]},
  {id:'hockey',label:'Hockey',icon:'🏒',matches:[
    mk('xbh1','NHL','🏒','New York Rangers','Pittsburgh Penguins','Hoy 00:00',1.85,undefined,2.00),
    mk('xbh2','NHL','🏒','Tampa Bay Lightning','Florida Panthers','Mañana 01:00',1.90,undefined,1.95),
  ]},
  {id:'beisbol',label:'Béisbol',icon:'⚾',matches:[
    mk('xbbb1','MLB','⚾','New York Yankees','LA Dodgers','Hoy 00:10',1.95,undefined,1.88,true,'3-2 (7ª)',0),
    mk('xbbb2','MLB','⚾','Houston Astros','Atlanta Braves','Mañana 00:05',1.80,undefined,2.05),
  ]},
  {id:'voleibol',label:'Voley',icon:'🏐',matches:[
    mk('xbv1','Liga de Naciones','🏐','Brasil','Polonia','Sáb 20:00',1.70,undefined,2.20),
    mk('xbv2','Liga de Naciones','🏐','Francia','Italia','Dom 18:00',2.00,undefined,1.85),
  ]},
];
const FC:CG[]=[
  {id:'aviator',name:'Aviator',icon:'✈️',provider:'Spribe',rtp:'97.0%',hot:true,type:'crash'},
  {id:'crash',name:'Crash Game',icon:'💥',provider:'Spribe',rtp:'97.0%',hot:true,type:'crash'},
  {id:'plinko',name:'Plinko',icon:'⚪',provider:'Spribe',rtp:'97.0%',type:'crash'},
  {id:'olympus',name:'Gates of Olympus',icon:'⚡',provider:'Pragmatic',rtp:'96.5%',hot:true,type:'slots'},
  {id:'bonanza',name:'Sweet Bonanza',icon:'🎁',provider:'Pragmatic',rtp:'96.5%',hot:true,type:'slots'},
  {id:'ruleta',name:'Ruleta Live',icon:'🎰',provider:'Evolution',rtp:'97.3%',hot:true,type:'live'},
  {id:'lightning',name:'Lightning Roulette',icon:'⚡',provider:'Evolution',rtp:'97.3%',hot:true,type:'live'},
  {id:'baccarat',name:'Baccarat Live',icon:'🃏',provider:'Evolution',rtp:'98.9%',type:'live'},
];
const GL:LG[]=[
  {id:'supermillones',name:'Super Millones GQ',icon:'💰',jackpot:'100,000,000 XAF',price:1000,draw:'Viernes 20:00',pc:6,mn:49},
  {id:'nacional',name:'Lotería Nacional GQ',icon:'🎟️',jackpot:'50,000,000 XAF',price:500,draw:'Sábados 20:00',pc:6,mn:49},
  {id:'cemac',name:'Lotería CEMAC',icon:'🌍',jackpot:'500,000,000 XAF',price:500,draw:'1er Sábado del mes',pc:6,mn:49},
  {id:'loto649',name:'Loto 6/49',icon:'🎱',jackpot:'25,000,000 XAF',price:300,draw:'Miércoles y Sábado',pc:6,mn:49},
  {id:'keno',name:'Keno GQ',icon:'🔢',jackpot:'10,000,000 XAF',price:100,draw:'Cada 5 minutos',pc:10,mn:49},
  {id:'quiniela',name:'Quiniela Semanal',icon:'⚽',jackpot:'15,000,000 XAF',price:500,draw:'Domingos 22:00',pc:5,mn:15},
  {id:'bingo',name:'Bingo GQ',icon:'🎯',jackpot:'2,000,000 XAF',price:200,draw:'Cada hora',pc:5,mn:49},
  {id:'rasca',name:'Rasca y Gana',icon:'🪙',jackpot:'5,000,000 XAF',price:200,draw:'Instantáneo',pc:3,mn:20},
];
const COMPANIES:Co[]=[
  // URLs con respaldos para evitar pantallas en blanco cuando un dominio falla.
  {id:'africagames',name:'Africa Games',tagline:'Apuestas deportivas · GQ',color:'#16a34a',type:'sports',bonus:'50% primer depósito hasta 25,000 XAF',minBet:200,minDeposit:500,url:'https://africasports.eu/',officialUrls:['https://africasports.eu/','https://www.africabet.com/en/'],sports:AG},
  {id:'betomax',name:'Bettomax',tagline:'Leisure World Holdings · 5 países África',color:'#dc2626',type:'sports',bonus:'Apuesta 5,000 XAF → 1,000 gratis',minBet:500,minDeposit:1000,url:'https://www.bettomax.com',officialUrls:['https://www.bettomax.com','https://www.bettomax.gq','https://bettomax.com','https://bettomax.gq'],sports:BT},
  {id:'1xbet',name:'1XBET',tagline:'Líder mundial · +60 deportes',color:'#1d4ed8',type:'sports',bonus:'100% primer depósito hasta 50,000 XAF',minBet:200,minDeposit:1000,url:'https://1xbet.com',officialUrls:['https://1xbet.com','https://1xbet.co.uk','https://1xbet.mobi','https://1xbet.app'],sports:XB},
  {id:'forza',name:'Forza Bet',tagline:'Casino online · GQ · Slots & Live',color:'#7c3aed',type:'casino',bonus:'100 giros gratis al registrarte',minBet:200,minDeposit:500,url:'https://forza.bet',officialUrls:['https://forza.bet','https://forza.bet/en','https://forza.bet/en/sports'],casino:FC},
  {id:'betano',name:'Betano',tagline:'Apuestas deportivas · Live · Casino',color:'#d97706',type:'sports',bonus:'100% primer depósito hasta 30,000 XAF',minBet:100,minDeposit:500,url:'https://www.betano.com/',officialUrls:['https://www.betano.com/','https://betano.com/','https://www.betano.co.uk/','https://betano.co.uk/'],sports:AG},
];
// ── Logo SVG ──────────────────────────────────────────────────────────────────
const Logo:React.FC<{id:string;size?:number}>=({id,size=44})=>{
  const r=Math.round(size*0.22);
  const map:Record<string,React.ReactElement>={
    africagames:<svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#16a34a"/><path d="M38 18C34 18 30 22 30 28L30 36C28 38 26 42 28 46C26 50 28 54 30 56L32 62C34 68 38 72 42 74C44 76 46 78 48 80C50 82 52 80 54 78C56 76 58 74 60 70L62 64C64 60 66 56 64 52C66 48 64 44 62 40L62 32C62 26 58 22 54 20C50 18 44 18 38 18Z" fill="white" opacity="0.9"/><path d="M50 30L52 36L58 36L53 40L55 46L50 42L45 46L47 40L42 36L48 36Z" fill="#facc15"/></svg>,
    betomax:<svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#dc2626"/><rect x="28" y="20" width="10" height="60" rx="3" fill="white"/><path d="M38 20L54 20C61 20 67 25 67 33C67 39 63 43 57 44L38 44Z" fill="white" opacity="0.9"/><path d="M38 46L56 46C64 46 70 52 70 60C70 68 64 74 56 74L38 74Z" fill="white" opacity="0.9"/></svg>,
    '1xbet':<svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#1d4ed8"/><text x="14" y="62" fill="white" fontSize="38" fontWeight="900" fontFamily="Arial Black,sans-serif">1</text><text x="46" y="62" fill="#facc15" fontSize="38" fontWeight="900" fontFamily="Arial Black,sans-serif">X</text><text x="50" y="82" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="2">BET</text></svg>,
    forza:<svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#7c3aed"/><path d="M58 15L35 52L50 52L42 85L68 45L52 45Z" fill="white"/><path d="M58 15L35 52L50 52L42 85L68 45L52 45Z" fill="#facc15" opacity="0.4"/></svg>,
    betano:<svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#d97706"/><circle cx="30" cy="35" r="18" fill="white"/><circle cx="70" cy="35" r="18" fill="white"/><rect x="25" y="65" width="50" height="20" rx="4" fill="white"/><text x="50" y="78" textAnchor="middle" fill="#d97706" fontSize="12" fontWeight="900" fontFamily="Arial,sans-serif">BET</text></svg>,
  };
  return map[id]||<svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#555"/></svg>;
};

// ── WebView embebido ──────────────────────────────────────────────────────────
const WebModal:React.FC<{co:Co;onClose:()=>void;userBalance:number;onDebit:(amount:number)=>void}>=({co,onClose,userBalance,onDebit})=>{
  const wvRef = useRef<any>(null);
  const [loading,setLoading]=useState(true);
  const [curUrl,setCurUrl]=useState(co.url);
  const [showRecharge,setShowRecharge]=useState(false);
  const [rechargeAmt,setRechargeAmt]=useState('5000');
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
  
  const urlCandidates = React.useMemo(() => {
    const list = [co.url, ...(co.officialUrls||[])].filter(Boolean);
    return Array.from(new Set(list));
  }, [co]);

  React.useEffect(()=>{
    if(!isElectron) return; // Si no es Electron, no usar addEventListener
    const wv=wvRef.current;
    if(!wv)return;
    
    const onLoad=()=>setLoading(false);
    const onStart=()=>setLoading(true);
    const onFail=(e:any)=>{
      const code = Number(e?.errorCode ?? 0);
      if(code===-3) return;
      setLoading(false);
    };
    
    wv.addEventListener('did-finish-load',onLoad);
    wv.addEventListener('did-start-loading',onStart);
    wv.addEventListener('did-fail-load',onFail);
    
    return()=>{
      wv.removeEventListener('did-finish-load',onLoad);
      wv.removeEventListener('did-start-loading',onStart);
      wv.removeEventListener('did-fail-load',onFail);
    };
  },[isElectron]);

  return(
    <div style={{position:'fixed',inset:0,zIndex:500,background:'#fff',display:'flex',flexDirection:'column'}}>
      {/* Barra superior estilo WhatsApp */}
      <div style={{background:co.color,padding:'56px 10px 10px',display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:'4px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',width:'32px',height:'32px'}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <Logo id={co.id} size={36}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:'15px',fontWeight:'800',color:'#fff',lineHeight:1.2,letterSpacing:'0.2px'}}>{co.name}</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.78)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>💰 {userBalance.toLocaleString()} XAF</div>
        </div>
        <button onClick={()=>setShowRecharge(true)} style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',cursor:'pointer',padding:'6px 10px',display:'flex',borderRadius:'6px',fontSize:'12px',fontWeight:'600',alignItems:'center',gap:'4px'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
          Recargar
        </button>
        {!isElectron && (
          <button onClick={()=>window.open(curUrl,'_blank','noopener,noreferrer')} style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',cursor:'pointer',padding:'6px 10px',display:'flex',borderRadius:'6px',fontSize:'12px',fontWeight:'600',alignItems:'center',gap:'4px'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        )}
        {isElectron && (
          <>
            <button onClick={()=>wvRef.current?.goBack?.()} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:'4px',display:'flex'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={()=>wvRef.current?.goForward?.()} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:'4px',display:'flex'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button onClick={()=>wvRef.current?.reload?.()} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:'4px',display:'flex'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </>
        )}
      </div>
      {/* Barra de progreso */}
      {loading&&<div style={{height:'3px',background:co.color,width:'100%',opacity:0.6}}/>}
      
      {/* Iframe para navegador o WebView para Electron */}
      {isElectron ? (
        <webview
          ref={wvRef}
          src={curUrl}
          style={{flex:1,width:'100%',border:'none'} as any}
          allowpopups="true"
          nodeintegration="false"
          enableremotemodule="false"
          disablewebsecurity="true"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          partition="persist:betting"
        />
      ) : (
        <div style={{flex:1,width:'100%',position:'relative',background:'#fff'}}>
          <iframe
            key={curUrl}
            ref={wvRef}
            src={curUrl}
            style={{flex:1,width:'100%',height:'100%',border:'none',background:'#fff',position:'absolute',inset:0}}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-presentation"
            onLoad={()=>setLoading(false)}
            onError={()=>setLoading(false)}
            title={co.name}
          />
        </div>
      )}
      
      {/* Modal recarga de saldo */}
      {showRecharge&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',zIndex:600}}>
          <div style={{background:'#fff',borderRadius:'20px 20px 0 0',width:'100%',maxHeight:'60vh',overflow:'auto',padding:'20px 16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <div style={{fontSize:'16px',fontWeight:'700',color:'#111'}}>💰 Recargar Saldo</div>
              <button onClick={()=>setShowRecharge(false)} style={{background:'#f0f0f0',border:'none',borderRadius:'50%',width:'28px',height:'28px',cursor:'pointer',fontSize:'14px',color:'#555'}}>✕</button>
            </div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',color:'#999',fontWeight:600,marginBottom:'6px'}}>Saldo actual</div>
              <div style={{fontSize:'20px',fontWeight:'800',color:co.color}}>{userBalance.toLocaleString()} XAF</div>
            </div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',color:'#999',fontWeight:600,marginBottom:'6px'}}>Monto a recargar</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'8px',marginBottom:'10px'}}>
                {['1000','5000','10000','50000'].map(amt=>(
                  <button key={amt} onClick={()=>setRechargeAmt(amt)}
                    style={{padding:'10px',borderRadius:'8px',border:`2px solid ${rechargeAmt===amt?co.color:'#e0e0e0'}`,background:rechargeAmt===amt?co.color+'20':'#fafafa',color:rechargeAmt===amt?co.color:'#333',fontSize:'12px',fontWeight:rechargeAmt===amt?700:500,cursor:'pointer'}}>
                    {parseInt(amt).toLocaleString()}
                  </button>
                ))}
              </div>
              <input type="number" value={rechargeAmt} onChange={(e)=>setRechargeAmt(e.target.value || '0')} style={{width:'100%',padding:'10px',borderRadius:'8px',border:'1px solid #ddd',fontSize:'14px',boxSizing:'border-box'}}/>
            </div>
            <button onClick={()=>{
              const amt=parseInt(rechargeAmt)||0;
              if(amt>0){
                onDebit(-amt);
                setRechargeAmt('5000');
                setShowRecharge(false);
              }
            }} style={{width:'100%',padding:'14px',background:co.color,border:'none',borderRadius:'10px',color:'#fff',fontSize:'15px',fontWeight:'700',cursor:'pointer'}}>
              Confirmar Recarga · {parseInt(rechargeAmt).toLocaleString()} XAF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
export const ApuestasView:React.FC<Props>=({onBack,userBalance,onDebit})=>{
  const [sel,setSel]=useState<Co|null>(null);
  const [sid,setSid]=useState('futbol');
  const [lgf,setLgf]=useState('Todos');
  const [slip,setSlip]=useState<BSI[]>([]);
  const [showSlip,setShowSlip]=useState(false);
  const [res,setRes]=useState<{win:boolean;payout:number}|null>(null);
  const [xm,setXm]=useState<string|null>(null);
  const [csel,setCsel]=useState<CG|null>(null);
  const [camt,setCamt]=useState('');
  const [cres,setCres]=useState<{win:boolean;mult:number;payout:number}|null>(null);
  const [cgaming,setCgaming]=useState(false);
  const [lsel,setLsel]=useState<LG|null>(null);
  const [lnums,setLnums]=useState<number[]>([]);
  const [lres,setLres]=useState<{win:boolean;prize:number}|null>(null);
  const [ramt,setRamt]=useState('');
  const [rok,setRok]=useState(false);
  const [tab,setTab]=useState<'apostar'|'recargar'>('apostar');
  const [showWeb,setShowWeb]=useState(false);

  const ac=sel?.color||'#1d4ed8';
  const sp=sel?.sports?.find(s=>s.id===sid);
  const leagues=sp?['Todos',...Array.from(new Set(sp.matches.map(m=>m.league)))]:[];
  const matches=sp?.matches.filter(m=>lgf==='Todos'||m.league===lgf)??[];
  const ts=slip.reduce((s,b)=>s+(parseInt(b.stake)||0),0);
  const tp=slip.reduce((s,b)=>s+Math.floor((parseInt(b.stake)||0)*b.odds),0);

  const addBet=(match:Match,pick:string,odds:number)=>{
    setSlip(prev=>{
      const ex=prev.findIndex(b=>b.id===match.id);
      const item:BSI={id:match.id,matchLabel:`${match.home} vs ${match.away}`,pick,odds,stake:ex>=0?prev[ex].stake:''};
      if(ex>=0){const n=[...prev];n[ex]=item;return n;}
      return [...prev,item];
    });
  };
  const isSel=(id:string,pick:string)=>slip.some(b=>b.id===id&&b.pick===pick);
  const placeBets=()=>{
    if(ts<=0||ts>userBalance)return;
    onDebit(ts);
    const win=Math.random()>0.45;
    if(win)onDebit(-tp);
    setRes({win,payout:win?tp:0});
    setSlip([]);setShowSlip(false);
  };
  const playCasino=()=>{
    const n=parseInt(camt);
    if(!n||n<(sel?.minBet||200)||n>userBalance)return;
    setCgaming(true);
  };
  const playLottery=()=>{
    if(!lsel||lnums.length<lsel.pc||lsel.price>userBalance)return;
    onDebit(lsel.price);
    const win=Math.random()>0.80;
    const prizes=[500,1000,2500,5000,10000,50000,100000];
    const prize=win?prizes[Math.floor(Math.random()*prizes.length)]:0;
    if(prize>0)onDebit(-prize);
    setLres({win,prize});setLnums([]);
  };
  const goBack=()=>{setSel(null);setSlip([]);setSid('futbol');setLgf('Todos');setCsel(null);setLsel(null);setRok(false);setTab('apostar');setShowWeb(false);setCgaming(false);setCres(null);};

  // Botón abrir web oficial - SIEMPRE dentro de la app
  const openOfficialSite = async () => {
    if (!sel) return;
    setShowWeb(true);
  };

  const OpenWebBtn=()=>(
    <button onClick={openOfficialSite}
      style={{position:'fixed',bottom:'90px',right:'16px',zIndex:9999,background:ac,border:'2px solid rgba(255,255,255,0.3)',borderRadius:'12px',padding:'13px 18px',color:'#fff',fontSize:'13px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',boxShadow:`0 4px 16px ${ac}99`,transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)'}}
      onMouseEnter={(e)=>{const btn=e.currentTarget;btn.style.background='rgba(0,0,0,0.6)';btn.style.boxShadow=`0 6px 20px ${ac}bb`;btn.style.transform='scale(1.05) translateY(-2px)';}}
      onMouseLeave={(e)=>{const btn=e.currentTarget;btn.style.background=ac;btn.style.boxShadow=`0 4px 16px ${ac}99`;btn.style.transform='translateY(0)';}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Sitio oficial
    </button>
  );

  // ── WebView modal ──────────────────────────────────────────────────────────
  if(showWeb&&sel)return <WebModal co={sel} onClose={()=>setShowWeb(false)} userBalance={userBalance} onDebit={onDebit}/>;

  // ── Lista de empresas ──────────────────────────────────────────────────────
  if(!sel)return(
    <div style={{height:'100%',background:'#f0f2f5',display:'flex',flexDirection:'column',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflow:'hidden'}}>
      {/* Header estilo WhatsApp */}
      <div style={{background:'#075e54',padding:'56px 16px 12px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <button onClick={onBack} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:'4px',display:'flex'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{flex:1}}>
            <div style={{fontSize:'18px',fontWeight:'700',color:'#fff'}}>Juegos & Apuestas</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.7)'}}>5 plataformas · Licenciadas</div>
          </div>
          <div style={{background:'rgba(255,255,255,0.15)',borderRadius:'20px',padding:'4px 10px'}}>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)',fontWeight:600}}>{userBalance.toLocaleString()} XAF</div>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'8px 0 80px'}}>
        {COMPANIES.map(co=>(
          <button key={co.id} onClick={()=>{setSel(co);setSid(co.sports?.[0]?.id||'futbol');setLgf('Todos');}}
            style={{width:'100%',background:'#fff',border:'none',borderBottom:'1px solid #f0f0f0',padding:'14px 16px',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:'12px',transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}
            onMouseEnter={(e)=>{e.currentTarget.style.background='#f8f9fa';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';e.currentTarget.style.transform='translateX(4px)';}}
            onMouseLeave={(e)=>{e.currentTarget.style.background='#fff';e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)';e.currentTarget.style.transform='translateX(0)';}}
            >
            <Logo id={co.id} size={44}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                <span style={{fontSize:'15px',fontWeight:'700',color:'#111'}}>{co.name}</span>
                <span style={{fontSize:'11px',color:'#999',fontWeight:500,background:'#f5f5f5',padding:'2px 8px',borderRadius:'4px'}}>{co.type==='sports'?`${co.sports!.length} deportes`:co.type==='casino'?`${co.casino!.length} juegos`:`${co.lottery!.length} loterías`}</span>
              </div>
              <div style={{fontSize:'12px',color:'#666',marginBottom:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{co.tagline}</div>
              <div style={{fontSize:'11px',color:co.color,fontWeight:700,background:`${co.color}10`,padding:'3px 8px',borderRadius:'4px',display:'inline-block'}}>🎁 {co.bonus}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" style={{transition:'transform 0.2s'}}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>
    </div>
  );
  // ── Vista deportes ─────────────────────────────────────────────────────────
  if(sel.type==='sports')return(
    <div style={{height:'100%',background:'#f0f2f5',display:'flex',flexDirection:'column',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflow:'hidden'}}>
      {/* Header */}
      <div style={{background:ac,padding:'56px 8px 0',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',paddingBottom:'8px'}}>
          <button onClick={goBack} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:'4px',display:'flex'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <Logo id={sel.id} size={32}/>
          <div style={{flex:1}}>
            <div style={{fontSize:'16px',fontWeight:'700',color:'#fff'}}>{sel.name}</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.75)'}}>{sel.tagline}</div>
          </div>
          <div style={{background:'rgba(255,255,255,0.2)',borderRadius:'16px',padding:'3px 10px'}}>
            <div style={{fontSize:'11px',color:'#fff',fontWeight:600}}>{userBalance.toLocaleString()} XAF</div>
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',borderTop:'1px solid rgba(255,255,255,0.2)'}}>
          {(['apostar','recargar'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'10px 0',background:'none',border:'none',borderBottom:`2px solid ${tab===t?'#fff':'transparent'}`,color:tab===t?'#fff':'rgba(255,255,255,0.6)',fontSize:'13px',fontWeight:tab===t?700:500,cursor:'pointer'}}>
              {t==='apostar'?'⚽ Apostar':'💳 Recargar'}
            </button>
          ))}
        </div>
      </div>

      {tab==='recargar'?(
        <div style={{flex:1,overflowY:'auto',padding:'12px 16px 80px'}}>
          <div style={{background:'#fff',borderRadius:'12px',padding:'16px',marginBottom:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#111',marginBottom:'12px'}}>Recargar cuenta {sel.name}</div>
            <input type="number" value={ramt} onChange={e=>setRamt(e.target.value)} placeholder={`Mín. ${sel.minDeposit.toLocaleString()} XAF`}
              style={{width:'100%',padding:'11px 12px',background:'#f5f5f5',border:'1px solid #e0e0e0',borderRadius:'8px',color:'#111',fontSize:'15px',fontWeight:'600',outline:'none',boxSizing:'border-box',fontFamily:'inherit',marginBottom:'10px'}}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',marginBottom:'12px'}}>
              {[1000,2500,5000,10000,25000,50000].map(v=>(<button key={v} onClick={()=>setRamt(String(v))} style={{padding:'10px 8px',borderRadius:'9px',border:'none',background:ramt===String(v)?ac:'#f0f2f5',color:ramt===String(v)?'#fff':'#333',fontSize:'12px',fontWeight:ramt===String(v)?700:600,cursor:'pointer',transition:'all 0.2s',boxShadow:ramt===String(v)?`0 2px 8px ${ac}40`:'0 1px 2px rgba(0,0,0,0.05)'}} onMouseEnter={(e)=>{if(ramt!==String(v))e.currentTarget.style.background='#e8ecf1'}} onMouseLeave={(e)=>{if(ramt!==String(v))e.currentTarget.style.background='#f0f2f5'}}>{v.toLocaleString()}</button>))}
            </div>
            <button onClick={()=>{const n=parseInt(ramt);if(n>=sel.minDeposit&&n<=userBalance){onDebit(n);setRok(true);setRamt('');}}}
              style={{width:'100%',padding:'14px',background:ac,border:'none',borderRadius:'11px',color:'#fff',fontSize:'15px',fontWeight:'800',cursor:'pointer',transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',boxShadow:`0 4px 15px ${ac}40`,letterSpacing:'0.3px'}} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 6px 20px ${ac}60`}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 4px 15px ${ac}40`}}>
              💳 Pagar con EGCHAT Wallet
            </button>
          </div>
          {rok&&<div style={{background:'#e8f5e9',border:'1px solid #a5d6a7',borderRadius:'10px',padding:'14px',textAlign:'center'}}><div style={{fontSize:'20px',marginBottom:'4px'}}>✅</div><div style={{fontSize:'13px',fontWeight:'600',color:'#2e7d32'}}>¡Recarga exitosa!</div></div>}
        </div>
      ):(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* Sport tabs */}
          <div style={{background:'#fff',borderBottom:'1px solid #f0f0f0',display:'flex',gap:'0',overflowX:'auto',flexShrink:0}}>
            {sel.sports!.map(s=>(
              <button key={s.id} onClick={()=>{setSid(s.id);setLgf('Todos');}}
                style={{flexShrink:0,padding:'10px 14px',background:'none',border:'none',borderBottom:`2px solid ${sid===s.id?ac:'transparent'}`,color:sid===s.id?ac:'#666',fontSize:'12px',fontWeight:sid===s.id?700:500,cursor:'pointer',whiteSpace:'nowrap'}}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
          {/* League filter */}
          <div style={{background:'#fff',borderBottom:'1px solid #f0f0f0',display:'flex',gap:'6px',overflowX:'auto',padding:'6px 12px',flexShrink:0}}>
            {leagues.map(lg=>(
              <button key={lg} onClick={()=>setLgf(lg)}
                style={{flexShrink:0,padding:'4px 10px',borderRadius:'14px',border:`1px solid ${lgf===lg?ac:'#e0e0e0'}`,background:lgf===lg?ac:'#fff',color:lgf===lg?'#fff':'#666',fontSize:'11px',fontWeight:lgf===lg?700:400,cursor:'pointer',whiteSpace:'nowrap'}}>
                {lg}
              </button>
            ))}
          </div>
          {/* Matches */}
          <div style={{flex:1,overflowY:'auto',padding:'0 0 80px'}}>
            {matches.some(m=>m.live)&&(
              <div style={{background:'#fff3e0',padding:'6px 16px',display:'flex',alignItems:'center',gap:'6px'}}>
                <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#ef4444'}}/>
                <span style={{fontSize:'11px',fontWeight:'700',color:'#e65100'}}>EN VIVO — {matches.filter(m=>m.live).length} partidos</span>
              </div>
            )}
            {matches.length===0&&<div style={{textAlign:'center',padding:'40px 20px',color:'#999',fontSize:'13px'}}>No hay eventos disponibles</div>}
            {matches.map(match=>{
              const hd=match.oX!==undefined;
              return(
                <div key={match.id} style={{background:'#fff',borderBottom:'1px solid #f5f5f5',padding:'10px 16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                    <span style={{fontSize:'10px',color:'#999',fontWeight:600}}>{match.li} {match.league}</span>
                    {match.live?<span style={{fontSize:'10px',fontWeight:'700',color:'#ef4444'}}>🔴 {match.minute}' {match.score}</span>:<span style={{fontSize:'10px',color:'#999'}}>{match.time}</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',marginBottom:'8px',gap:'8px'}}>
                    <div style={{flex:1,fontSize:'13px',fontWeight:'600',color:'#111'}}>{match.home}</div>
                    <div style={{fontSize:'10px',color:'#bbb',fontWeight:600}}>VS</div>
                    <div style={{flex:1,textAlign:'right',fontSize:'13px',fontWeight:'600',color:'#111'}}>{match.away}</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:hd?'1fr 1fr 1fr':'1fr 1fr',gap:'5px',marginBottom:match.mkts?'6px':'0'}}>
                    {[{key:'home',label:hd?'1':match.home.split(' ')[0],val:match.o1},...(hd?[{key:'draw',label:'X',val:match.oX!}]:[]),{key:'away',label:hd?'2':match.away.split(' ')[0],val:match.o2}].map(opt=>{
                      const active=isSel(match.id,opt.key);
                      return <button key={opt.key} onClick={()=>addBet(match,opt.key,opt.val)}
                        style={{padding:'9px 6px',borderRadius:'10px',border:'none',background:active?ac:`#f5f6f7`,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',boxShadow:active?`0 4px 12px ${ac}40`:'0 1px 3px rgba(0,0,0,0.08)',fontWeight:active?800:600}}
                        onMouseEnter={(e)=>{if(!active)e.currentTarget.style.background='#eff1f5';e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=active?`0 6px 16px ${ac}50`:'0 2px 8px rgba(0,0,0,0.12)'}}
                        onMouseLeave={(e)=>{if(!active)e.currentTarget.style.background='#f5f6f7';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=active?`0 4px 12px ${ac}40`:'0 1px 3px rgba(0,0,0,0.08)';}}>
                        <span style={{fontSize:'10px',color:active?'rgba(255,255,255,0.9)':'#666',fontWeight:700,letterSpacing:'-0.3px'}}>{opt.label}</span>
                        <span style={{fontSize:'14px',fontWeight:'900',color:active?'#fff':'#111'}}>{opt.val.toFixed(2)}</span>
                      </button>;
                    })}
                  </div>
                  {match.mkts&&match.mkts.length>0&&(
                    <div>
                      <button onClick={()=>setXm(xm===match.id?null:match.id)} style={{background:'none',border:'none',color:'#999',fontSize:'11px',cursor:'pointer',padding:'2px 0',fontWeight:500}}>
                        {xm===match.id?'▲ Ocultar':'▼ +'+match.mkts.length+' mercados'}
                      </button>
                      {xm===match.id&&match.mkts.map(mkt=>(
                        <div key={mkt.name} style={{marginTop:'6px'}}>
                          <div style={{fontSize:'10px',color:'#999',fontWeight:700,marginBottom:'4px',textTransform:'uppercase'}}>{mkt.name}</div>
                          <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                            {mkt.opts.map(opt=>{
                              const active=isSel(match.id,opt.label);
                              return <button key={opt.label} onClick={()=>addBet(match,opt.label,opt.odds)}
                                style={{padding:'6px 12px',borderRadius:'8px',border:'none',background:active?ac:'#f0f2f5',cursor:'pointer',display:'flex',gap:'6px',alignItems:'center',transition:'all 0.2s',boxShadow:active?`0 3px 10px ${ac}35`:'0 1px 2px rgba(0,0,0,0.05)',fontSize:'12px',fontWeight:active?700:500}}
                                onMouseEnter={(e)=>{if(!active)e.currentTarget.style.background='#e8ecf1';e.currentTarget.style.boxShadow=active?`0 4px 14px ${ac}45`:'0 2px 6px rgba(0,0,0,0.1)'}}
                                onMouseLeave={(e)=>{if(!active)e.currentTarget.style.background='#f0f2f5';e.currentTarget.style.boxShadow=active?`0 3px 10px ${ac}35`:'0 1px 2px rgba(0,0,0,0.05)';}}>
                                <span style={{color:active?'#fff':'#555'}}>{opt.label}</span>
                                <span style={{fontWeight:'900',color:active?'rgba(255,255,255,0.95)':'#1d4ed8'}}>{opt.odds.toFixed(2)}</span>
                              </button>;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <OpenWebBtn/>

      {/* Bet slip flotante */}
      {slip.length>0&&!showSlip&&(
        <button onClick={()=>setShowSlip(true)} style={{position:'fixed',bottom:'76px',left:'16px',background:ac,border:'none',borderRadius:'28px',padding:'12px 20px',color:'#fff',fontSize:'13px',fontWeight:'800',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',boxShadow:`0 4px 16px ${ac}50`,zIndex:100,transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',letterSpacing:'0.3px'}} onMouseEnter={(e)=>{e.currentTarget.style.transform='scale(1.05) translateY(-2px)';e.currentTarget.style.boxShadow=`0 6px 24px ${ac}70`}} onMouseLeave={(e)=>{e.currentTarget.style.transform='scale(1) translateY(0)';e.currentTarget.style.boxShadow=`0 4px 16px ${ac}50`}}>
          <span style={{background:'rgba(255,255,255,0.3)',borderRadius:'50%',width:'22px',height:'22px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'900'}}>{slip.length}</span>
          Boleto · {tp.toLocaleString()} XAF
        </button>
      )}
      {showSlip&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'flex-end'}}>
          <div style={{background:'#fff',borderRadius:'20px 20px 0 0',width:'100%',maxHeight:'80vh',overflow:'auto',padding:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <div style={{fontSize:'16px',fontWeight:'800',color:'#111'}}>🎯 Boleto ({slip.length})</div>
              <button onClick={()=>setShowSlip(false)} style={{background:'#f0f2f5',border:'none',borderRadius:'50%',width:'32px',height:'32px',cursor:'pointer',fontSize:'16px',color:'#555',fontWeight:700,transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center'}} onMouseEnter={(e)=>{e.currentTarget.style.background='#e0e3e8'}} onMouseLeave={(e)=>{e.currentTarget.style.background='#f0f2f5'}}>✕</button>
            </div>
            {slip.map((b,i)=>(
              <div key={b.id} style={{background:'#f5f7fa',borderRadius:'12px',padding:'12px',marginBottom:'10px',border:'1px solid #e8ecf1',transition:'all 0.2s'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'11px',color:'#999',fontWeight:600}}>{b.matchLabel}</div>
                    <div style={{fontSize:'13px',fontWeight:'700',color:'#111'}}>{b.pick} · <span style={{color:ac,fontWeight:900}}>{b.odds.toFixed(2)}</span></div>
                  </div>
                  <button onClick={()=>setSlip(p=>p.filter((_,j)=>j!==i))} style={{background:'rgba(255,0,0,0.08)',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'18px',fontWeight:700,borderRadius:'50%',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}} onMouseEnter={(e)=>{e.currentTarget.style.background='rgba(255,0,0,0.15)'}} onMouseLeave={(e)=>{e.currentTarget.style.background='rgba(255,0,0,0.08)'}}>✕</button>
                </div>
                <input type="number" value={b.stake} onChange={e=>setSlip(p=>p.map((x,j)=>j===i?{...x,stake:e.target.value}:x))} placeholder={`Mín. ${sel.minBet.toLocaleString()} XAF`}
                  style={{width:'100%',padding:'10px 12px',background:'#fff',border:'1px solid #e0e3e8',borderRadius:'8px',color:'#111',fontSize:'13px',fontWeight:600,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}/>
                {parseInt(b.stake)>0&&<div style={{fontSize:'12px',color:'#16a34a',marginTop:'4px',fontWeight:700}}>💰 Ganancia: {Math.floor(parseInt(b.stake)*b.odds).toLocaleString()} XAF</div>}
              </div>
            ))}
            <div style={{background:'#f5f5f5',borderRadius:'10px',padding:'10px',marginBottom:'10px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}><span style={{fontSize:'12px',color:'#666'}}>Total apostado</span><span style={{fontSize:'12px',fontWeight:'700',color:'#111'}}>{ts.toLocaleString()} XAF</span></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'12px',color:'#666'}}>Ganancia posible</span><span style={{fontSize:'14px',fontWeight:'800',color:ac}}>{tp.toLocaleString()} XAF</span></div>
            </div>
            <button onClick={placeBets} disabled={ts<=0||ts>userBalance}
              style={{width:'100%',padding:'14px',background:ts>0&&ts<=userBalance?ac:'#ccc',border:'none',borderRadius:'11px',color:'#fff',fontSize:'15px',fontWeight:'800',cursor:ts>0?'pointer':'not-allowed',transition:'all 0.2s',boxShadow:ts>0?`0 4px 15px ${ac}40`:'0 2px 4px rgba(0,0,0,0.1)',letterSpacing:'0.3px'}} onMouseEnter={(e)=>{if(ts>0){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 6px 20px ${ac}60`}}} onMouseLeave={(e)=>{if(ts>0){e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 4px 15px ${ac}40`}}}>
              {ts>userBalance?'Saldo insuficiente':`Confirmar · ${ts.toLocaleString()} XAF`}
            </button>
          </div>
        </div>
      )}
      {res&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'24px',padding:'32px 24px',textAlign:'center',maxWidth:'320px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{fontSize:'56px',marginBottom:'14px'}}>{res.win?'🏆':'😔'}</div>
            <div style={{fontSize:'22px',fontWeight:'900',color:res.win?ac:'#ef4444',marginBottom:'8px',letterSpacing:'-0.5px'}}>{res.win?'¡GANASTE!':'Esta vez no'}</div>
            {res.win&&<div style={{fontSize:'28px',fontWeight:'900',color:'#16a34a',marginBottom:'8px',background:'#e8f5e9',padding:'8px 12px',borderRadius:'10px'}}>{res.payout.toLocaleString()} XAF</div>}
            <button onClick={()=>setRes(null)} style={{width:'100%',padding:'14px',background:ac,border:'none',borderRadius:'11px',color:'#fff',fontSize:'15px',fontWeight:'800',cursor:'pointer',marginTop:'12px',transition:'all 0.2s',boxShadow:`0 4px 12px ${ac}40`}} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 6px 16px ${ac}60`}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 4px 12px ${ac}40`}}>Continuar apostando</button>
          </div>
        </div>
      )}
    </div>
  );
  // ── Vista casino - GALERÍA DE JUEGOS ──────────────────────────────────────
  if(sel.type==='casino')return(
    <div style={{height:'100%',background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',display:'flex',flexDirection:'column',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflow:'hidden'}}>
      <div style={{background:'rgba(0,0,0,0.3)',padding:'56px 12px 12px',flexShrink:0,borderBottom:'2px solid rgba(255,255,255,0.1)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
          <button onClick={goBack} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',cursor:'pointer',padding:'8px',display:'flex',borderRadius:'8px'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></button>
          <div><div style={{fontSize:'18px',fontWeight:'800',color:'#fff'}}>🎮 JUEGOS ARCADE</div><div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>Saldo: {userBalance.toLocaleString()} XAF</div></div>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 12px 100px'}}>
        {!csel?(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
              {[
                {id:'aviator',name:'✈️ Aviator',desc:'Multiplicador Volante',color:'#667eea',icon:'🚀'},
                {id:'crash',name:'💥 Crash',desc:'Explotar antes',color:'#f97316',icon:'⚡'},
                {id:'plinko',name:'🎰 Slots',desc:'Ruedas Giratorias',color:'#8b5cf6',icon:'🎁'},
                {id:'ruleta',name:'🎡 Ruleta',desc:'Elige el Número',color:'#10b981',icon:'🎯'},
                {id:'dice',name:'🎲 Dados',desc:'Alto o Bajo',color:'#f97316',icon:'🔥'},
                {id:'coinflip',name:'🪙 Coin Flip',desc:'Cara o Cruz',color:'#8b5cf6',icon:'👑'},
                {id:'wheel',name:'🎪 Lucky Wheel',desc:'Rueda de Suerte',color:'#ec4899',icon:'⭐'},
                {id:'highlow',name:'♠️ Mayor/Menor',desc:'Predice la Carta',color:'#06b6d4',icon:'🃏'}
              ].map(game=>(
                <button key={game.id} className="game-card" onClick={()=>{setCsel({id:game.id,name:game.name,icon:game.icon,provider:'EGCHAT',rtp:'97%',type:'crash'});setCamt('500');setCres(null);}}
                  style={{background:`linear-gradient(135deg,${game.color} 0%,${game.color}dd 100%)`,border:'none',borderRadius:'12px',padding:'16px',cursor:'pointer',boxShadow:'0 4px 15px rgba(0,0,0,0.2)',color:'#fff',textAlign:'center'}}>
                  <div className="game-card-icon" style={{fontSize:'34px',marginBottom:'6px'}}>{game.icon}</div>
                  <div style={{fontSize:'13px',fontWeight:'800',marginBottom:'2px'}}>{game.name}</div>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.8)'}}>{game.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ):(
          <div>
            <div style={{background:'rgba(0,0,0,0.2)',borderRadius:'12px',padding:'14px',marginBottom:'16px',color:'#fff'}}>
              <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'8px'}}>{csel.name} - JUGANDO</div>
              <div style={{display:'flex',gap:'8px'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.7)'}}>APUESTA</div>
                  <input type="number" value={camt} onChange={e=>setCamt(e.target.value)} style={{width:'100%',padding:'8px 10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'6px',color:'#fff',fontSize:'14px',fontWeight:'700',outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.7)'}}>CANTIDAD RÁPIDA</div>
                  <div style={{display:'flex',gap:'4px'}}>
                    {[500,1000,2500].map(v=>(<button key={v} onClick={()=>setCamt(String(v))} style={{flex:1,padding:'8px',background:camt===String(v)?'#fff':'rgba(255,255,255,0.2)',color:camt===String(v)?'#667eea':'#fff',fontWeight:'700',fontSize:'11px',borderRadius:'4px',border:'none',cursor:'pointer'}}>{v}</button>))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{background:'rgba(0,0,0,0.1)',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
              {csel.id==='aviator'&&<AviatorGame bet={parseInt(camt)||500} onResult={(win,payout)=>{onDebit(parseInt(camt)||500);setCres({win,mult:payout>0?payout/(parseInt(camt)||500):0,payout});setCgaming(false);}}/>}
              {csel.id==='crash'&&<CrashGame bet={parseInt(camt)||500} onResult={(win,payout)=>{onDebit(parseInt(camt)||500);setCres({win,mult:payout>0?payout/(parseInt(camt)||500):0,payout});setCgaming(false);}}/>}
              {csel.id==='plinko'&&<SlotsGame bet={parseInt(camt)||500} onResult={(win,payout)=>{onDebit(parseInt(camt)||500);setCres({win,mult:payout>0?payout/(parseInt(camt)||500):0,payout});setCgaming(false);}}/>}
              {csel.id==='ruleta'&&<RuletaGame bet={parseInt(camt)||500} onResult={(win,payout)=>{onDebit(parseInt(camt)||500);setCres({win,mult:payout>0?payout/(parseInt(camt)||500):0,payout});setCgaming(false);}}/>}
              {csel.id==='dice'&&<DiceGame bet={parseInt(camt)||500} onResult={(win,payout)=>{onDebit(parseInt(camt)||500);setCres({win,mult:payout>0?payout/(parseInt(camt)||500):0,payout});setCgaming(false);}}/>}
              {csel.id==='coinflip'&&<CoinFlipGame bet={parseInt(camt)||500} onResult={(win,payout)=>{onDebit(parseInt(camt)||500);setCres({win,mult:payout>0?payout/(parseInt(camt)||500):0,payout});setCgaming(false);}}/>}
              {csel.id==='wheel'&&<LuckyWheelGame bet={parseInt(camt)||500} onResult={(win,payout)=>{onDebit(parseInt(camt)||500);setCres({win,mult:payout>0?payout/(parseInt(camt)||500):0,payout});setCgaming(false);}}/>}
              {csel.id==='highlow'&&<HigherLowerGame bet={parseInt(camt)||500} onResult={(win,payout)=>{onDebit(parseInt(camt)||500);setCres({win,mult:payout>0?payout/(parseInt(camt)||500):0,payout});setCgaming(false);}}/>}
            </div>
            {cres&&(
              <div style={{background:cres.win?'linear-gradient(135deg,#10b981 0%,#059669 100%)':'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',borderRadius:'12px',padding:'16px',textAlign:'center',color:'#fff'}}>
                <div style={{fontSize:'40px',marginBottom:'8px'}}>{cres.win?'🏆🎉':'😔'}</div>
                <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'4px'}}>{cres.win?'¡¡GANASTE!!':'NO GANASTE ESTA VEZ'}</div>
                {cres.win&&<div style={{fontSize:'20px',fontWeight:'900',marginBottom:'12px'}}>+{cres.payout.toLocaleString()} XAF</div>}
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={()=>{setCsel(null);setCres(null);setCamt('');}} style={{flex:1,background:'rgba(0,0,0,0.2)',border:'none',color:'#fff',fontWeight:'700',padding:'10px',borderRadius:'6px',cursor:'pointer'}}>← Volver</button>
                  <button onClick={()=>{setCres(null);}} style={{flex:1,background:'rgba(255,255,255,0.3)',border:'none',color:'#fff',fontWeight:'700',padding:'10px',borderRadius:'6px',cursor:'pointer'}}>Jugar De Nuevo</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );


  // ── Vista lotería ──────────────────────────────────────────────────────────
  return(
    <div style={{height:'100%',background:'#f0f2f5',display:'flex',flexDirection:'column',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflow:'hidden'}}>
      <div style={{background:ac,padding:'56px 8px 12px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <button onClick={goBack} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:'4px',display:'flex'}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></button>
          <Logo id={sel.id} size={32}/>
          <div style={{flex:1}}><div style={{fontSize:'16px',fontWeight:'700',color:'#fff'}}>{sel.name}</div><div style={{fontSize:'11px',color:'rgba(255,255,255,0.75)'}}>Lotería Oficial GQ</div></div>
          <div style={{background:'rgba(255,255,255,0.2)',borderRadius:'16px',padding:'3px 10px'}}><div style={{fontSize:'11px',color:'#fff',fontWeight:600}}>{userBalance.toLocaleString()} XAF</div></div>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 0 80px'}}>
        <div style={{background:'linear-gradient(135deg,#78350f,#d97706)',margin:'8px 0 0',padding:'14px 16px',textAlign:'center'}}>
          <div style={{fontSize:'10px',fontWeight:'700',color:'rgba(255,255,255,0.7)',textTransform:'uppercase',letterSpacing:'1px'}}>Bote acumulado</div>
          <div style={{fontSize:'24px',fontWeight:'800',color:'#fff',margin:'2px 0'}}>100,000,000 XAF</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)'}}>Super Millones · Viernes 20:00</div>
        </div>
        {sel.lottery!.map(g=>(
          <button key={g.id} onClick={()=>{setLsel(g);setLnums([]);setLres(null);}}
            style={{width:'100%',background:lsel?.id===g.id?`${ac}10`:'#fff',border:'none',borderBottom:'1px solid #f0f0f0',padding:'12px 16px',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:'12px'}}>
            <span style={{fontSize:'28px'}}>{g.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:'#111',marginBottom:'2px'}}>{g.name}</div>
              <div style={{display:'flex',gap:'8px'}}>
                <span style={{fontSize:'11px',color:'#d97706',fontWeight:600}}>🏆 {g.jackpot}</span>
                <span style={{fontSize:'11px',color:'#999'}}>🕐 {g.draw}</span>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'11px',color:'#999'}}>Precio</div>
              <div style={{fontSize:'13px',fontWeight:'700',color:ac}}>{g.price.toLocaleString()} XAF</div>
            </div>
          </button>
        ))}
        {lsel&&(
          <div style={{background:'#fff',margin:'8px 0 0',padding:'16px'}}>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#111',marginBottom:'4px'}}>{lsel.icon} {lsel.name}</div>
            <div style={{fontSize:'11px',color:'#999',marginBottom:'10px'}}>Elige {lsel.pc} números del 1 al {lsel.mn}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'5px',marginBottom:'10px'}}>
              {Array.from({length:Math.min(lsel.mn,49)},(_,i)=>i+1).map(n=>{
                const picked=lnums.includes(n);
                return <button key={n} onClick={()=>{if(picked)setLnums(p=>p.filter(x=>x!==n));else if(lnums.length<lsel.pc)setLnums(p=>[...p,n]);}}
                  style={{aspectRatio:'1',borderRadius:'50%',border:`2px solid ${picked?ac:'#e0e0e0'}`,background:picked?ac:'#fafafa',color:picked?'#fff':'#555',fontSize:'11px',fontWeight:'700',cursor:'pointer'}}>{n}</button>;
              })}
            </div>
            <div style={{fontSize:'11px',color:'#999',marginBottom:'10px'}}>Seleccionados ({lnums.length}/{lsel.pc}): {[...lnums].sort((a,b)=>a-b).join(' · ')||'—'}</div>
            <button onClick={playLottery} disabled={lnums.length<lsel.pc}
              style={{width:'100%',padding:'13px',background:lnums.length>=lsel.pc?ac:'#ccc',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:lnums.length>=lsel.pc?'pointer':'not-allowed'}}>
              🎟️ Comprar boleto · {lsel.price.toLocaleString()} XAF
            </button>
            {lres&&(<div style={{marginTop:'10px',background:lres.win?'#e8f5e9':'#fce4ec',border:`1px solid ${lres.win?'#a5d6a7':'#f48fb1'}`,borderRadius:'10px',padding:'14px',textAlign:'center'}}>
              <div style={{fontSize:'28px',marginBottom:'6px'}}>{lres.win?'🎉':'😔'}</div>
              <div style={{fontSize:'15px',fontWeight:'700',color:lres.win?'#2e7d32':'#c62828'}}>{lres.win?`¡Premio! ${lres.prize.toLocaleString()} XAF`:'Sin premio esta vez'}</div>
              <button onClick={()=>setLres(null)} style={{marginTop:'6px',background:'none',border:'none',color:'#999',fontSize:'12px',cursor:'pointer'}}>Jugar de nuevo</button>
            </div>)}
          </div>
        )}
      </div>
      <OpenWebBtn/>
    </div>
  );
};