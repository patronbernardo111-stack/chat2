import React, { useState } from 'react'; // v2

interface Props { onBack: () => void; userBalance: number; onDebit: (amount: number) => void; }
type BetSlipItem = { id: string; matchLabel: string; pick: string; odds: number; stake: string; };
interface Match {
  id: string; league: string; leagueIcon: string;
  home: string; away: string; time: string;
  live?: boolean; score?: string; minute?: number;
  odds1: number; oddsX?: number; odds2: number;
  markets?: { name: string; options: { label: string; odds: number }[] }[];
}
interface SportSection { id: string; label: string; icon: string; matches: Match[]; }
interface CasinoGame { id: string; name: string; icon: string; provider: string; rtp: string; hot?: boolean; type: 'slots'|'table'|'live'|'crash'; }
interface LotteryGame { id: string; name: string; icon: string; jackpot: string; price: number; draw: string; pickCount: number; maxNum: number; }
interface Company {
  id: string; name: string; tagline: string; color: string;
  type: 'sports'|'casino'|'lottery';
  bonus: string; minBet: number; minDeposit: number; url?: string;
  sports?: SportSection[]; casino?: CasinoGame[]; lottery?: LotteryGame[];
}

const s = new Date().getDate() + new Date().getMonth() * 31;
const rng = (n: number) => { const x = Math.sin(n + s) * 10000; return x - Math.floor(x); };
const ro = (b: number, n: number) => parseFloat(Math.max(1.01, b + rng(n) * 0.5 - 0.25).toFixed(2));

const m = (
  id: string, league: string, li: string, home: string, away: string, time: string,
  o1: number, oX: number|undefined, o2: number,
  live?: boolean, score?: string, min?: number,
  mkts?: { name: string; options: { label: string; odds: number }[] }[]
): Match => ({ id, league, leagueIcon: li, home, away, time, live, score, minute: min,
  odds1: ro(o1, o1*7), oddsX: oX ? ro(oX, oX*13) : undefined, odds2: ro(o2, o2*11), markets: mkts });


// ── AFRICA GAMES DATA ─────────────────────────────────────────────────────────
const AG_SPORTS: SportSection[] = [
  { id:'futbol', label:'Fútbol', icon:'⚽', matches:[
    m('ag1','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Liverpool','Arsenal','Hoy 21:00',1.55,4.20,5.50,true,'2-1',67,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.55},{label:'-2.5',odds:2.40}]},
      {name:'Ambos marcan',options:[{label:'Sí',odds:1.65},{label:'No',odds:2.10}]},
      {name:'1er gol',options:[{label:'Liverpool',odds:1.80},{label:'Arsenal',odds:2.20},{label:'Sin gol',odds:8.00}]},
    ]),
    m('ag2','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Man City','Chelsea','Hoy 18:30',1.80,3.60,4.20,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.70},{label:'-2.5',odds:2.10}]},
      {name:'Handicap',options:[{label:'Man City -1',odds:2.20},{label:'Chelsea +1',odds:1.70}]},
    ]),
    m('ag3','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Man United','Tottenham','Mañana 16:00',2.10,3.40,3.30),
    m('ag4','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Newcastle','Aston Villa','Sáb 14:00',2.30,3.20,3.10),
    m('ag5','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Brighton','West Ham','Dom 15:00',2.05,3.30,3.60),
    m('ag6','La Liga','🇪🇸','Real Madrid','Barcelona','Sáb 21:00',2.20,3.40,3.10,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.60},{label:'-2.5',odds:2.25}]},
      {name:'Ambos marcan',options:[{label:'Sí',odds:1.70},{label:'No',odds:2.05}]},
      {name:'Goleador',options:[{label:'Mbappé',odds:2.50},{label:'Lewandowski',odds:3.00},{label:'Vinicius',odds:3.50}]},
    ]),
    m('ag7','La Liga','🇪🇸','Atletico Madrid','Sevilla','Dom 18:30',1.75,3.50,4.50),
    m('ag8','La Liga','🇪🇸','Athletic Bilbao','Real Sociedad','Sáb 16:15',2.40,3.20,2.90),
    m('ag9','La Liga','🇪🇸','Valencia','Villarreal','Lun 21:00',2.60,3.10,2.70),
    m('ag10','Serie A','🇮🇹','Inter Milan','AC Milan','Dom 20:45',2.00,3.30,3.60,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.75},{label:'-2.5',odds:2.00}]},
    ]),
    m('ag11','Serie A','🇮🇹','Juventus','Napoli','Sáb 18:00',2.30,3.20,3.00),
    m('ag12','Serie A','🇮🇹','Roma','Lazio','Dom 18:00',2.20,3.25,3.20),
    m('ag13','Bundesliga','🇩🇪','Bayern Munich','Borussia Dortmund','Sáb 18:30',1.65,4.00,5.00,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+3.5',odds:1.80},{label:'-3.5',odds:1.95}]},
      {name:'Handicap',options:[{label:'Bayern -1.5',odds:2.10},{label:'Dortmund +1.5',odds:1.75}]},
    ]),
    m('ag14','Bundesliga','🇩🇪','Bayer Leverkusen','RB Leipzig','Dom 15:30',2.10,3.30,3.40),
    m('ag15','Ligue 1','🇫🇷','PSG','Marseille','Dom 21:00',1.55,4.20,5.50),
    m('ag16','Ligue 1','🇫🇷','Monaco','Lyon','Sáb 21:00',2.20,3.20,3.30),
    m('ag17','Champions League','⭐','Real Madrid','Bayern Munich','Mar 21:00',2.10,3.50,3.30,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.65},{label:'-2.5',odds:2.20}]},
      {name:'Ambos marcan',options:[{label:'Sí',odds:1.75},{label:'No',odds:2.00}]},
      {name:'Clasificado',options:[{label:'Real Madrid',odds:1.80},{label:'Bayern',odds:2.00}]},
    ]),
    m('ag18','Champions League','⭐','Barcelona','Inter Milan','Mié 21:00',1.90,3.60,4.00),
    m('ag19','Champions League','⭐','Man City','PSG','Mar 21:00',1.75,3.80,4.50),
    m('ag20','Champions League','⭐','Liverpool','Juventus','Mié 21:00',1.60,4.00,5.50),
    m('ag21','Europa League','🟠','Atletico Madrid','Roma','Jue 21:00',1.95,3.40,3.80),
    m('ag22','Europa League','🟠','Tottenham','Eintracht Frankfurt','Jue 18:45',2.00,3.30,3.60),
    m('ag23','Copa África','🌍','Senegal','Marruecos','Sáb 20:00',2.60,3.10,2.60),
    m('ag24','Copa África','🌍','Nigeria','Camerún','Dom 17:00',2.20,3.20,3.10),
    m('ag25','Copa África','🌍','Costa de Marfil','Ghana','Lun 20:00',2.10,3.30,3.40),
    m('ag26','CAF Champions League','🌍','Al Ahly','Wydad Casablanca','Mar 20:00',1.85,3.40,4.20),
    m('ag27','Clasificación Mundial','🌐','Brasil','Argentina','Mar 02:00',2.30,3.20,2.90),
    m('ag28','Clasificación Mundial','🌐','Francia','Portugal','Vie 20:45',2.00,3.40,3.50),
  ]},
  { id:'baloncesto', label:'Baloncesto', icon:'🏀', matches:[
    m('agb1','NBA','🇺🇸','LA Lakers','Golden State Warriors','Hoy 02:30',1.95,undefined,1.88,true,'89-94',38,[
      {name:'Total puntos',options:[{label:'+215.5',odds:1.90},{label:'-215.5',odds:1.90}]},
      {name:'Handicap',options:[{label:'Lakers -3.5',odds:1.90},{label:'Warriors +3.5',odds:1.90}]},
    ]),
    m('agb2','NBA','🇺🇸','Boston Celtics','Miami Heat','Hoy 01:00',1.65,undefined,2.30),
    m('agb3','NBA','🇺🇸','Denver Nuggets','Phoenix Suns','Mañana 03:00',1.80,undefined,2.05),
    m('agb4','NBA','🇺🇸','Milwaukee Bucks','Philadelphia 76ers','Sáb 01:30',1.75,undefined,2.10),
    m('agb5','EuroLiga','🇪🇺','Real Madrid','CSKA Moscú','Jue 20:45',1.70,undefined,2.20),
    m('agb6','EuroLiga','🇪🇺','Barcelona','Fenerbahce','Vie 20:00',1.85,undefined,2.00),
  ]},
  { id:'tenis', label:'Tenis', icon:'🎾', matches:[
    m('agt1','ATP Masters 1000','🎾','Carlos Alcaraz','Jannik Sinner','Hoy 14:00',1.75,undefined,2.10,true,'6-4, 3-2',0,[
      {name:'Sets',options:[{label:'2-0',odds:2.50},{label:'2-1',odds:2.80},{label:'0-2',odds:3.20},{label:'1-2',odds:3.50}]},
      {name:'Total games',options:[{label:'+22.5',odds:1.85},{label:'-22.5',odds:1.90}]},
    ]),
    m('agt2','ATP Masters 1000','🎾','Novak Djokovic','Alexander Zverev','Mañana 15:00',1.60,undefined,2.40),
    m('agt3','ATP 500','🎾','Daniil Medvedev','Casper Ruud','Sáb 13:00',1.90,undefined,1.95),
    m('agt4','WTA Premier','🎾','Iga Swiatek','Aryna Sabalenka','Dom 12:00',1.65,undefined,2.25),
    m('agt5','WTA 1000','🎾','Coco Gauff','Elena Rybakina','Sáb 11:00',1.80,undefined,2.05),
  ]},
  { id:'boxeo', label:'Boxeo', icon:'🥊', matches:[
    m('agx1','Peso Pesado WBC','🥊','Tyson Fury','Anthony Joshua','Sáb 23:00',1.80,undefined,2.05,false,undefined,undefined,[
      {name:'Método victoria',options:[{label:'KO/TKO Fury',odds:2.50},{label:'Decisión Fury',odds:3.00},{label:'KO/TKO Joshua',odds:3.50},{label:'Decisión Joshua',odds:4.50},{label:'Empate',odds:18.00}]},
      {name:'Ronda final',options:[{label:'1-4',odds:3.50},{label:'5-8',odds:2.80},{label:'9-12',odds:3.20},{label:'Decisión',odds:2.20}]},
    ]),
    m('agx2','Peso Welter WBA','🥊','Errol Spence Jr.','Terence Crawford','Dom 02:00',2.10,undefined,1.75),
    m('agx3','Peso Medio WBO','🥊','Canelo Álvarez','Jermall Charlo','Sáb 02:30',1.55,undefined,2.60),
  ]},
  { id:'mma', label:'MMA/UFC', icon:'🥋', matches:[
    m('agm1','UFC 310','🥋','Jon Jones','Stipe Miocic','Dom 04:00',1.55,undefined,2.55,false,undefined,undefined,[
      {name:'Método',options:[{label:'KO/TKO Jones',odds:2.20},{label:'Sumisión Jones',odds:4.00},{label:'Decisión Jones',odds:3.50},{label:'KO/TKO Miocic',odds:4.50}]},
      {name:'Ronda',options:[{label:'Ronda 1',odds:3.00},{label:'Ronda 2',odds:3.50},{label:'Ronda 3+',odds:2.50}]},
    ]),
    m('agm2','UFC Fight Night','🥋','Israel Adesanya','Alex Pereira','Sáb 03:00',2.30,undefined,1.65),
    m('agm3','Bellator','🥋','Patricio Pitbull','AJ McKee','Vie 02:00',1.90,undefined,1.95),
  ]},
  { id:'esports', label:'eSports', icon:'🎮', matches:[
    m('age1','CS2 - ESL Pro League','🎮','Natus Vincere','FaZe Clan','Hoy 17:00',1.75,undefined,2.10,true,'1-0 mapas',0,[
      {name:'Mapas',options:[{label:'2-0',odds:2.80},{label:'2-1',odds:2.20},{label:'0-2',odds:3.50},{label:'1-2',odds:2.80}]},
    ]),
    m('age2','LoL - LEC','🎮','G2 Esports','Fnatic','Hoy 19:00',1.60,undefined,2.35),
    m('age3','Dota 2 - The International','🎮','Team Spirit','OG','Mañana 12:00',1.85,undefined,2.00),
    m('age4','FIFA eWorld Cup','🎮','MoAuba','Tekkz','Sáb 16:00',1.95,undefined,1.90),
  ]},
];


// ── BETTOMAX DATA ─────────────────────────────────────────────────────────────
const BT_SPORTS: SportSection[] = [
  { id:'futbol', label:'Fútbol', icon:'⚽', matches:[
    m('bt1','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Arsenal','Man City','Hoy 20:00',3.20,3.50,2.10,true,'0-1',55,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.60},{label:'-2.5',odds:2.30}]},
      {name:'Ambos marcan',options:[{label:'Sí',odds:1.70},{label:'No',odds:2.05}]},
    ]),
    m('bt2','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Chelsea','Newcastle','Mañana 18:30',1.90,3.40,3.80),
    m('bt3','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Tottenham','Liverpool','Sáb 17:30',4.50,3.80,1.70),
    m('bt4','La Liga','🇪🇸','Barcelona','Atletico Madrid','Dom 20:00',1.85,3.50,4.00,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.65},{label:'-2.5',odds:2.20}]},
      {name:'Goleador',options:[{label:'Lewandowski',odds:2.80},{label:'Griezmann',odds:3.50},{label:'Yamal',odds:4.00}]},
    ]),
    m('bt5','La Liga','🇪🇸','Real Madrid','Girona','Sáb 16:15',1.45,4.50,7.00),
    m('bt6','Serie A','🇮🇹','Napoli','Juventus','Dom 15:00',2.80,3.20,2.50),
    m('bt7','Serie A','🇮🇹','AC Milan','Atalanta','Sáb 20:45',2.20,3.30,3.20),
    m('bt8','Bundesliga','🇩🇪','Borussia Dortmund','Bayer Leverkusen','Sáb 15:30',2.80,3.30,2.50),
    m('bt9','Champions League','⭐','PSG','Arsenal','Mar 21:00',2.00,3.50,3.60,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.70},{label:'-2.5',odds:2.10}]},
      {name:'Clasificado',options:[{label:'PSG',odds:1.90},{label:'Arsenal',odds:1.90}]},
    ]),
    m('bt10','Champions League','⭐','Juventus','Man City','Mié 21:00',3.50,3.40,2.00),
    m('bt11','Europa League','🟠','Man United','Ajax','Jue 21:00',1.80,3.50,4.20),
    m('bt12','CAF Champions League','🌍','Al Ahly','Wydad Casablanca','Mar 20:00',1.85,3.40,4.20),
    m('bt13','CAF Champions League','🌍','Espérance Tunis','TP Mazembe','Mié 18:00',2.10,3.20,3.40),
    m('bt14','Copa África','🌍','Marruecos','Nigeria','Dom 19:00',2.20,3.20,3.30),
    m('bt15','Clasificación Mundial','🌐','Camerún','Senegal','Vie 20:00',2.80,3.10,2.50),
  ]},
  { id:'baloncesto', label:'Baloncesto', icon:'🏀', matches:[
    m('btb1','NBA','🇺🇸','Boston Celtics','Cleveland Cavaliers','Hoy 00:30',1.60,undefined,2.40,[
      {name:'Total puntos',options:[{label:'+220.5',odds:1.90},{label:'-220.5',odds:1.90}]},
    ] as any),
    m('btb2','NBA','🇺🇸','Golden State Warriors','San Antonio Spurs','Hoy 03:00',1.50,undefined,2.60),
    m('btb3','EuroLiga','🇪🇺','Olympiacos','Panathinaikos','Jue 19:00',2.10,undefined,1.75),
  ]},
  { id:'rugby', label:'Rugby', icon:'🏉', matches:[
    m('btr1','Six Nations','🏉','Francia','Inglaterra','Sáb 16:45',1.85,undefined,1.98,false,undefined,undefined,[
      {name:'Hándicap',options:[{label:'Francia -5.5',odds:1.90},{label:'Inglaterra +5.5',odds:1.90}]},
      {name:'Total puntos',options:[{label:'+42.5',odds:1.85},{label:'-42.5',odds:1.90}]},
    ]),
    m('btr2','Six Nations','🏉','Irlanda','Gales','Sáb 14:15',1.40,undefined,2.90),
    m('btr3','Rugby Championship','🏉','Nueva Zelanda','Sudáfrica','Dom 09:05',1.70,undefined,2.15),
    m('btr4','Premiership','🏉','Saracens','Leicester Tigers','Sáb 15:00',1.75,undefined,2.10),
  ]},
  { id:'tenis', label:'Tenis', icon:'🎾', matches:[
    m('btt1','ATP Masters 1000','🎾','Novak Djokovic','Rafael Nadal','Mañana 15:00',1.60,undefined,2.40,[
      {name:'Sets',options:[{label:'2-0',odds:2.20},{label:'2-1',odds:2.60},{label:'0-2',odds:4.00},{label:'1-2',odds:4.50}]},
    ] as any),
    m('btt2','ATP 500','🎾','Carlos Alcaraz','Holger Rune','Sáb 14:00',1.55,undefined,2.50),
    m('btt3','WTA 1000','🎾','Iga Swiatek','Coco Gauff','Dom 13:00',1.70,undefined,2.20),
  ]},
  { id:'boxeo', label:'Boxeo', icon:'🥊', matches:[
    m('btx1','Peso Semipesado WBC','🥊','Dmitry Bivol','Artur Beterbiev','Sáb 22:00',2.20,undefined,1.70,false,undefined,undefined,[
      {name:'Método',options:[{label:'KO/TKO',odds:2.00},{label:'Decisión',odds:1.85},{label:'Empate',odds:20.00}]},
    ]),
    m('btx2','Peso Pesado IBF','🥊','Anthony Joshua','Deontay Wilder','Dom 23:00',1.90,undefined,1.95),
  ]},
  { id:'mma', label:'MMA', icon:'🥋', matches:[
    m('btm1','UFC Fight Night','🥋','Conor McGregor','Dustin Poirier','Sáb 04:00',1.80,undefined,2.05,false,undefined,undefined,[
      {name:'Método',options:[{label:'KO/TKO',odds:1.90},{label:'Sumisión',odds:3.50},{label:'Decisión',odds:2.80}]},
    ]),
    m('btm2','Bellator','🥋','Ryan Bader','Vadim Nemkov','Dom 03:00',2.10,undefined,1.75),
  ]},
  { id:'esports', label:'eSports', icon:'🎮', matches:[
    m('bte1','CS2 - BLAST Premier','🎮','Astralis','Team Vitality','Hoy 18:00',2.20,undefined,1.70),
    m('bte2','LoL - LCK','🎮','T1','Gen.G','Mañana 10:00',1.65,undefined,2.30),
    m('bte3','Valorant Champions','🎮','Sentinels','LOUD','Sáb 20:00',1.90,undefined,1.95),
  ]},
  { id:'hockey', label:'Hockey', icon:'🏒', matches:[
    m('bth1','NHL','🏒','Toronto Maple Leafs','Boston Bruins','Hoy 01:00',1.90,undefined,1.95,false,undefined,undefined,[
      {name:'Total goles',options:[{label:'+5.5',odds:1.85},{label:'-5.5',odds:1.90}]},
    ]),
    m('bth2','NHL','🏒','Colorado Avalanche','Vegas Golden Knights','Mañana 03:00',1.85,undefined,2.00),
    m('bth3','KHL','🏒','CSKA Moscú','SKA San Petersburgo','Mié 17:00',1.80,undefined,2.05),
  ]},
];


// ── 1XBET DATA ────────────────────────────────────────────────────────────────
const XB_SPORTS: SportSection[] = [
  { id:'futbol', label:'Fútbol', icon:'⚽', matches:[
    m('xb1','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Liverpool','Man City','Hoy 21:00',2.40,3.30,2.80,true,'1-1',72,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.55},{label:'-2.5',odds:2.40}]},
      {name:'Ambos marcan',options:[{label:'Sí',odds:1.60},{label:'No',odds:2.20}]},
      {name:'Handicap asiático',options:[{label:'Liverpool -0.5',odds:2.50},{label:'Man City -0.5',odds:2.90}]},
      {name:'Córners',options:[{label:'+9.5',odds:1.85},{label:'-9.5',odds:1.90}]},
    ]),
    m('xb2','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Arsenal','Chelsea','Mañana 20:00',1.95,3.40,3.70),
    m('xb3','Premier League','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Aston Villa','Man United','Sáb 15:00',2.20,3.30,3.20),
    m('xb4','La Liga','🇪🇸','Real Madrid','Atletico Madrid','Dom 21:00',2.00,3.40,3.60,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.70},{label:'-2.5',odds:2.10}]},
      {name:'Ambos marcan',options:[{label:'Sí',odds:1.75},{label:'No',odds:2.00}]},
      {name:'Goleador',options:[{label:'Mbappé',odds:2.40},{label:'Griezmann',odds:3.20},{label:'Vinicius',odds:3.00}]},
      {name:'Tarjetas',options:[{label:'+3.5',odds:1.90},{label:'-3.5',odds:1.85}]},
    ]),
    m('xb5','La Liga','🇪🇸','Barcelona','Sevilla','Sáb 18:30',1.60,3.80,5.50),
    m('xb6','Serie A','🇮🇹','Inter Milan','Juventus','Dom 20:45',2.10,3.20,3.40,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.80},{label:'-2.5',odds:1.95}]},
      {name:'Handicap',options:[{label:'Inter -0.5',odds:2.20},{label:'Juventus +0.5',odds:1.70}]},
    ]),
    m('xb7','Serie A','🇮🇹','Napoli','Roma','Sáb 15:00',1.90,3.40,4.00),
    m('xb8','Bundesliga','🇩🇪','Bayern Munich','RB Leipzig','Sáb 18:30',1.70,3.80,4.80,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+3.5',odds:1.75},{label:'-3.5',odds:2.00}]},
      {name:'Handicap',options:[{label:'Bayern -1.5',odds:2.00},{label:'Leipzig +1.5',odds:1.85}]},
    ]),
    m('xb9','Ligue 1','🇫🇷','PSG','Nice','Sáb 21:00',1.40,4.80,8.00),
    m('xb10','Ligue 1','🇫🇷','Marseille','Monaco','Dom 20:00',2.50,3.20,2.80),
    m('xb11','Champions League','⭐','Barcelona','Bayern Munich','Mar 21:00',2.30,3.40,3.00,false,undefined,undefined,[
      {name:'Más/Menos goles',options:[{label:'+2.5',odds:1.60},{label:'-2.5',odds:2.25}]},
      {name:'Ambos marcan',options:[{label:'Sí',odds:1.70},{label:'No',odds:2.05}]},
      {name:'Clasificado',options:[{label:'Barcelona',odds:2.00},{label:'Bayern',odds:1.80}]},
      {name:'Goleador',options:[{label:'Lewandowski',odds:2.80},{label:'Kane',odds:3.00},{label:'Yamal',odds:4.00}]},
    ]),
    m('xb12','Champions League','⭐','Man City','Real Madrid','Mié 21:00',2.20,3.50,3.10),
    m('xb13','Champions League','⭐','PSG','Liverpool','Mar 21:00',2.40,3.30,2.90),
    m('xb14','Champions League','⭐','Atletico Madrid','Inter Milan','Mié 21:00',2.60,3.20,2.70),
    m('xb15','Europa League','🟠','Man United','Ajax','Jue 21:00',1.80,3.50,4.20),
    m('xb16','Europa League','🟠','Roma','Sevilla','Jue 18:45',2.10,3.30,3.40),
    m('xb17','Copa África','🌍','Marruecos','Senegal','Sáb 20:00',2.30,3.20,3.00),
    m('xb18','Copa África','🌍','Egipto','Nigeria','Dom 18:00',2.50,3.10,2.80),
    m('xb19','CAF Champions League','🌍','Al Ahly','Espérance Tunis','Mar 20:00',2.00,3.30,3.60),
    m('xb20','Clasificación Mundial','🌐','Argentina','Uruguay','Jue 01:00',1.80,3.50,4.50),
    m('xb21','Clasificación Mundial','🌐','España','Alemania','Vie 20:45',2.10,3.30,3.40),
  ]},
  { id:'baloncesto', label:'Baloncesto', icon:'🏀', matches:[
    m('xbb1','NBA','🇺🇸','Denver Nuggets','LA Lakers','Hoy 03:00',1.75,undefined,2.10,true,'102-98',45,[
      {name:'Total puntos',options:[{label:'+218.5',odds:1.90},{label:'-218.5',odds:1.90}]},
      {name:'Handicap',options:[{label:'Nuggets -4.5',odds:1.90},{label:'Lakers +4.5',odds:1.90}]},
    ]),
    m('xbb2','NBA','🇺🇸','Miami Heat','Chicago Bulls','Hoy 01:30',1.65,undefined,2.30),
    m('xbb3','NBA','🇺🇸','Brooklyn Nets','Toronto Raptors','Mañana 00:00',1.80,undefined,2.05),
    m('xbb4','EuroLiga','🇪🇺','Anadolu Efes','Maccabi Tel Aviv','Jue 20:00',1.65,undefined,2.30),
  ]},
  { id:'tenis', label:'Tenis', icon:'🎾', matches:[
    m('xbt1','ATP Masters 1000','🎾','Carlos Alcaraz','Daniil Medvedev','Hoy 16:00',1.70,undefined,2.20,[
      {name:'Sets',options:[{label:'2-0',odds:2.40},{label:'2-1',odds:2.70},{label:'0-2',odds:3.50},{label:'1-2',odds:3.80}]},
      {name:'Total games',options:[{label:'+23.5',odds:1.85},{label:'-23.5',odds:1.90}]},
    ] as any),
    m('xbt2','Roland Garros','🎾','Rafael Nadal','Novak Djokovic','Mañana 14:00',2.20,undefined,1.65),
    m('xbt3','Wimbledon','🎾','Carlos Alcaraz','Jannik Sinner','Sáb 15:00',1.80,undefined,2.05),
    m('xbt4','WTA Finals','🎾','Iga Swiatek','Aryna Sabalenka','Dom 14:00',1.65,undefined,2.25),
  ]},
  { id:'rugby', label:'Rugby', icon:'🏉', matches:[
    m('xbr1','Rugby Championship','🏉','Australia','Argentina','Dom 11:00',1.80,undefined,2.05),
    m('xbr2','Six Nations','🏉','Escocia','Italia','Sáb 15:00',1.55,undefined,2.50),
  ]},
  { id:'mma', label:'MMA', icon:'🥋', matches:[
    m('xbm1','UFC 311','🥋','Charles Oliveira','Islam Makhachev','Sáb 04:00',2.50,undefined,1.55,false,undefined,undefined,[
      {name:'Método',options:[{label:'KO/TKO',odds:3.00},{label:'Sumisión',odds:2.50},{label:'Decisión',odds:2.20}]},
      {name:'Ronda',options:[{label:'Ronda 1',odds:3.50},{label:'Ronda 2',odds:4.00},{label:'Ronda 3+',odds:2.00}]},
    ]),
    m('xbm2','ONE Championship','🥋','Rodtang Jitmuangnon','Demetrious Johnson','Dom 14:00',1.70,undefined,2.20),
  ]},
  { id:'esports', label:'eSports', icon:'🎮', matches:[
    m('xbe1','CS2 - Major','🎮','Team Liquid','Cloud9','Hoy 20:00',1.80,undefined,2.05),
    m('xbe2','LoL - Worlds','🎮','T1','JDG','Mañana 09:00',1.75,undefined,2.10),
    m('xbe3','Dota 2 - ESL One','🎮','Team Secret','Evil Geniuses','Sáb 18:00',1.90,undefined,1.95),
    m('xbe4','Valorant','🎮','Fnatic','NaVi','Dom 17:00',2.00,undefined,1.85),
  ]},
  { id:'hockey', label:'Hockey', icon:'🏒', matches:[
    m('xbh1','NHL','🏒','New York Rangers','Pittsburgh Penguins','Hoy 00:00',1.85,undefined,2.00),
    m('xbh2','NHL','🏒','Tampa Bay Lightning','Florida Panthers','Mañana 01:00',1.90,undefined,1.95),
  ]},
  { id:'beisbol', label:'Béisbol', icon:'⚾', matches:[
    m('xbb1b','MLB','⚾','New York Yankees','LA Dodgers','Hoy 00:10',1.95,undefined,1.88,true,'3-2 (7ª)',0,[
      {name:'Total carreras',options:[{label:'+8.5',odds:1.90},{label:'-8.5',odds:1.90}]},
    ]),
    m('xbb2b','MLB','⚾','Houston Astros','Atlanta Braves','Mañana 00:05',1.80,undefined,2.05),
  ]},
  { id:'voleibol', label:'Voleibol', icon:'🏐', matches:[
    m('xbv1','Liga de Naciones','🏐','Brasil','Polonia','Sáb 20:00',1.70,undefined,2.20,[
      {name:'Sets',options:[{label:'3-0',odds:2.80},{label:'3-1',odds:2.50},{label:'3-2',odds:3.50},{label:'0-3',odds:4.50}]},
    ] as any),
    m('xbv2','Liga de Naciones','🏐','Francia','Italia','Dom 18:00',2.00,undefined,1.85),
  ]},
];

// ── FORZA CASINO ──────────────────────────────────────────────────────────────
const FORZA_CASINO: CasinoGame[] = [
  { id:'aviator', name:'Aviator', icon:'✈️', provider:'Spribe', rtp:'97.0%', hot:true, type:'crash' },
  { id:'crash', name:'Crash', icon:'🚀', provider:'Spribe', rtp:'97.0%', hot:true, type:'crash' },
  { id:'mines', name:'Mines', icon:'💣', provider:'Spribe', rtp:'97.0%', hot:true, type:'crash' },
  { id:'plinko', name:'Plinko', icon:'🔵', provider:'Spribe', rtp:'97.0%', type:'crash' },
  { id:'dice', name:'Dice', icon:'🎲', provider:'Spribe', rtp:'98.0%', type:'crash' },
  { id:'olympus', name:'Gates of Olympus', icon:'⚡', provider:'Pragmatic Play', rtp:'96.5%', hot:true, type:'slots' },
  { id:'bonanza', name:'Sweet Bonanza', icon:'🍭', provider:'Pragmatic Play', rtp:'96.5%', hot:true, type:'slots' },
  { id:'bass', name:'Big Bass Bonanza', icon:'🎣', provider:'Pragmatic Play', rtp:'96.7%', type:'slots' },
  { id:'wolf', name:'Wolf Gold', icon:'🐺', provider:'Pragmatic Play', rtp:'96.0%', type:'slots' },
  { id:'book', name:'Book of Dead', icon:'📖', provider:"Play'n GO", rtp:'96.2%', type:'slots' },
  { id:'star', name:'Starburst', icon:'⭐', provider:'NetEnt', rtp:'96.1%', type:'slots' },
  { id:'ruleta', name:'Ruleta Europea', icon:'🎡', provider:'Evolution Gaming', rtp:'97.3%', hot:true, type:'live' },
  { id:'lightning', name:'Lightning Roulette', icon:'⚡', provider:'Evolution Gaming', rtp:'97.3%', hot:true, type:'live' },
  { id:'baccarat', name:'Baccarat en Vivo', icon:'🎴', provider:'Evolution Gaming', rtp:'98.9%', hot:true, type:'live' },
  { id:'crazy', name:'Crazy Time', icon:'🎪', provider:'Evolution Gaming', rtp:'96.1%', hot:true, type:'live' },
  { id:'monopoly', name:'Monopoly Live', icon:'🎩', provider:'Evolution Gaming', rtp:'96.2%', type:'live' },
  { id:'blackjack', name:'Blackjack VIP', icon:'🃏', provider:'Evolution Gaming', rtp:'99.5%', type:'table' },
  { id:'poker', name:"Casino Hold'em", icon:'♠️', provider:'Evolution Gaming', rtp:'97.8%', type:'table' },
];

// ── GELOTO LOTTERY ────────────────────────────────────────────────────────────
const GELOTO_LOTTERY: LotteryGame[] = [
  { id:'supermillones', name:'Super Millones GQ', icon:'💰', jackpot:'100,000,000 XAF', price:1000, draw:'Viernes 20:00', pickCount:6, maxNum:49 },
  { id:'nacional', name:'Lotería Nacional GQ', icon:'🎟️', jackpot:'50,000,000 XAF', price:500, draw:'Sábados 20:00', pickCount:6, maxNum:49 },
  { id:'cemac', name:'Lotería CEMAC', icon:'🌍', jackpot:'500,000,000 XAF', price:500, draw:'1er Sábado del mes', pickCount:6, maxNum:49 },
  { id:'loto649', name:'Loto 6/49', icon:'🎱', jackpot:'25,000,000 XAF', price:300, draw:'Miércoles y Sábado', pickCount:6, maxNum:49 },
  { id:'keno', name:'Keno GQ', icon:'🔢', jackpot:'10,000,000 XAF', price:100, draw:'Cada 5 minutos', pickCount:10, maxNum:80 },
  { id:'quiniela', name:'Quiniela Semanal', icon:'⚽', jackpot:'15,000,000 XAF', price:500, draw:'Domingos 22:00', pickCount:5, maxNum:15 },
  { id:'bingo', name:'Bingo GQ', icon:'🎯', jackpot:'2,000,000 XAF', price:200, draw:'Cada hora', pickCount:5, maxNum:75 },
  { id:'rasca', name:'Rasca y Gana', icon:'🪙', jackpot:'5,000,000 XAF', price:200, draw:'Instantáneo', pickCount:3, maxNum:20 },
];

// ── COMPANIES ─────────────────────────────────────────────────────────────────
const COMPANIES: Company[] = [
  { id:'africagames', name:'Africa Games', tagline:'Apuestas deportivas · GQ', color:'#16a34a', type:'sports', bonus:'50% primer depósito hasta 25,000 XAF', minBet:200, minDeposit:500, url:'https://africagames.gq', sports:AG_SPORTS },
  { id:'betomax', name:'Bettomax', tagline:'Leisure World Holdings · 5 países África', color:'#dc2626', type:'sports', bonus:'Apuesta 5,000 XAF → 1,000 gratis', minBet:500, minDeposit:1000, url:'https://www.bettomax.com', sports:BT_SPORTS },
  { id:'1xbet', name:'1XBET', tagline:'Líder mundial · +60 deportes · +1000 mercados', color:'#1d4ed8', type:'sports', bonus:'100% primer depósito hasta 50,000 XAF', minBet:200, minDeposit:1000, url:'https://1xbet.com/es', sports:XB_SPORTS },
  { id:'forza', name:'Forza Bet', tagline:'Casino online · GQ · Slots & Live', color:'#7c3aed', type:'casino', bonus:'100 giros gratis al registrarte', minBet:200, minDeposit:500, url:'https://forzabet.gq', casino:FORZA_CASINO },
  { id:'geloto', name:'Geloto GQ', tagline:'Lotería Oficial Guinea Ecuatorial', color:'#d97706', type:'lottery', bonus:'Rasca gratis al registrarte', minBet:100, minDeposit:500, url:'https://geloto.gq', lottery:GELOTO_LOTTERY },
];

// ── LOGO ──────────────────────────────────────────────────────────────────────
const Logo: React.FC<{ id: string; size?: number }> = ({ id, size = 48 }) => {
  const r = Math.round(size * 0.22);
  const map: Record<string, React.ReactElement> = {
    africagames: <svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#16a34a"/><path d="M38 18C34 18 30 22 30 28L30 36C28 38 26 42 28 46C26 50 28 54 30 56L32 62C34 68 38 72 42 74C44 76 46 78 48 80C50 82 52 80 54 78C56 76 58 74 60 70L62 64C64 60 66 56 64 52C66 48 64 44 62 40L62 32C62 26 58 22 54 20C50 18 44 18 38 18Z" fill="white" opacity="0.9"/><path d="M50 30L52 36L58 36L53 40L55 46L50 42L45 46L47 40L42 36L48 36Z" fill="#facc15"/></svg>,
    betomax: <svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#dc2626"/><rect x="28" y="20" width="10" height="60" rx="3" fill="white"/><path d="M38 20L54 20C61 20 67 25 67 33C67 39 63 43 57 44L38 44Z" fill="white" opacity="0.9"/><path d="M38 46L56 46C64 46 70 52 70 60C70 68 64 74 56 74L38 74Z" fill="white" opacity="0.9"/></svg>,
    '1xbet': <svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#1d4ed8"/><text x="14" y="62" fill="white" fontSize="38" fontWeight="900" fontFamily="Arial Black,sans-serif">1</text><text x="46" y="62" fill="#facc15" fontSize="38" fontWeight="900" fontFamily="Arial Black,sans-serif">X</text><text x="50" y="82" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="2">BET</text></svg>,
    forza: <svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#7c3aed"/><path d="M58 15L35 52L50 52L42 85L68 45L52 45Z" fill="white"/><path d="M58 15L35 52L50 52L42 85L68 45L52 45Z" fill="#facc15" opacity="0.4"/></svg>,
    geloto: <svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#d97706"/><circle cx="50" cy="42" r="26" fill="white" opacity="0.95"/><text x="50" y="50" textAnchor="middle" fill="#d97706" fontSize="20" fontWeight="900" fontFamily="Arial Black,sans-serif">GQ</text><text x="50" y="80" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial,sans-serif">GELOTO</text></svg>,
  };
  return map[id] || <svg width={size} height={size} viewBox="0 0 100 100"><rect width="100" height="100" rx={r} fill="#555"/></svg>;
};


// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
const OfficialBtn: React.FC<{ company: Company }> = ({ company }) => (
  <div style={{ position:'fixed', bottom:'16px', left:'16px', right:'16px', zIndex:50 }}>
    <button
      onClick={() => {
        const url = company.url;
        if (!url) return;
        try {
          if ((window as any).require) {
            const { shell } = (window as any).require('electron');
            shell.openExternal(url);
          } else {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        } catch {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }}
      style={{ width:'100%', padding:'14px', background:'rgba(20,20,30,0.95)', border:`1px solid ${company.color}50`, borderRadius:'14px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', backdropFilter:'blur(10px)' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={company.color} strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      <span style={{ color: company.color }}>Abrir {company.name} oficial</span>
    </button>
  </div>
);

export const ApuestasView: React.FC<Props> = ({ onBack, userBalance, onDebit }) => {
  const [sel, setSel] = useState<Company | null>(null);
  const [sportId, setSportId] = useState('futbol');
  const [leagueFilter, setLeagueFilter] = useState('Todos');
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [showSlip, setShowSlip] = useState(false);
  const [result, setResult] = useState<{ win: boolean; payout: number } | null>(null);
  const [expandMkt, setExpandMkt] = useState<string | null>(null);
  const [casinoSel, setCasinoSel] = useState<CasinoGame | null>(null);
  const [casinoAmt, setCasinoAmt] = useState('');
  const [casinoRes, setCasinoRes] = useState<{ win: boolean; mult: number; payout: number } | null>(null);
  const [lotSel, setLotSel] = useState<LotteryGame | null>(null);
  const [lotNums, setLotNums] = useState<number[]>([]);
  const [lotRes, setLotRes] = useState<{ win: boolean; prize: number } | null>(null);
  const [rechAmt, setRechAmt] = useState('');
  const [rechOk, setRechOk] = useState(false);
  const [mainTab, setMainTab] = useState<'apostar'|'recargar'>('apostar');

  const ac = sel?.color || '#1d4ed8';
  const sport = sel?.sports?.find(s => s.id === sportId);
  const leagues = sport ? ['Todos', ...Array.from(new Set(sport.matches.map(m => m.league)))] : [];
  const visibleMatches = sport?.matches.filter(m => leagueFilter === 'Todos' || m.league === leagueFilter) ?? [];
  const totalStake = betSlip.reduce((s, b) => s + (parseInt(b.stake) || 0), 0);
  const totalPayout = betSlip.reduce((s, b) => s + Math.floor((parseInt(b.stake) || 0) * b.odds), 0);

  const addBet = (match: Match, pick: string, odds: number) => {
    setBetSlip(prev => {
      const ex = prev.findIndex(b => b.id === match.id);
      const item: BetSlipItem = { id: match.id, matchLabel: `${match.home} vs ${match.away}`, pick, odds, stake: ex >= 0 ? prev[ex].stake : '' };
      if (ex >= 0) { const n = [...prev]; n[ex] = item; return n; }
      return [...prev, item];
    });
  };
  const isSel = (id: string, pick: string) => betSlip.some(b => b.id === id && b.pick === pick);
  const placeBets = () => {
    if (totalStake <= 0 || totalStake > userBalance) return;
    onDebit(totalStake);
    const win = Math.random() > 0.45;
    if (win) onDebit(-totalPayout);
    setResult({ win, payout: win ? totalPayout : 0 });
    setBetSlip([]); setShowSlip(false);
  };
  const playCasino = () => {
    const n = parseInt(casinoAmt);
    if (!n || n < (sel?.minBet || 200) || n > userBalance) return;
    onDebit(n);
    const mults = [0, 0, 0, 0.5, 1.5, 2, 3, 5, 10, 25];
    const mult = mults[Math.floor(Math.random() * mults.length)];
    const payout = Math.floor(n * mult);
    if (payout > 0) onDebit(-payout);
    setCasinoRes({ win: mult > 1, mult, payout });
    setCasinoAmt('');
  };
  const playLottery = () => {
    if (!lotSel || lotNums.length < lotSel.pickCount || lotSel.price > userBalance) return;
    onDebit(lotSel.price);
    const win = Math.random() > 0.80;
    const prizes = [500, 1000, 2500, 5000, 10000, 50000, 100000];
    const prize = win ? prizes[Math.floor(Math.random() * prizes.length)] : 0;
    if (prize > 0) onDebit(-prize);
    setLotRes({ win, prize });
    setLotNums([]);
  };
  const goBack = () => { setSel(null); setBetSlip([]); setSportId('futbol'); setLeagueFilter('Todos'); setCasinoSel(null); setLotSel(null); setRechOk(false); setMainTab('apostar'); };

  // ── LISTA ───────────────────────────────────────────────────────────────────
  if (!sel) return (
    <div style={{ height:'100%', background:'#0f0f13', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow:'hidden' }}>
      <div style={{ padding:'52px 16px 12px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>Juegos & Apuestas</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>5 plataformas licenciadas</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'10px', padding:'5px 10px', textAlign:'right' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>SALDO</div>
            <div style={{ fontSize:'13px', fontWeight:'800', color:'#facc15' }}>{userBalance.toLocaleString()} XAF</div>
          </div>
        </div>
        <div style={{ background:'linear-gradient(135deg,#1e3a8a,#7c3aed)', borderRadius:'16px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ fontSize:'32px' }}>🏆</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:'800', color:'#fff' }}>+120 eventos en vivo ahora</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>Premier League · Champions · NBA · UFC · eSports</div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px 16px 80px' }}>
        {COMPANIES.map(co => (
          <button key={co.id} onClick={() => { setSel(co); setSportId(co.sports?.[0]?.id || 'futbol'); setLeagueFilter('Todos'); }}
            style={{ width:'100%', background:'#1a1a24', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'14px', marginBottom:'10px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }}>
            <Logo id={co.id} size={52}/>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                <span style={{ fontSize:'15px', fontWeight:'800', color:'#fff' }}>{co.name}</span>
                <span style={{ background:'rgba(0,200,160,0.15)', color:'#00c8a0', fontSize:'9px', fontWeight:'700', padding:'2px 6px', borderRadius:'6px' }}>✓ LICENCIADO</span>
              </div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'6px' }}>{co.tagline}</div>
              <span style={{ background:(co.color+'20'), color:co.color, fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'6px' }}>🎁 {co.bonus}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>
    </div>
  );

  // ── DEPORTES ────────────────────────────────────────────────────────────────
  if (sel.type === 'sports') return (
    <div style={{ height:'100%', background:'#0f0f13', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow:'hidden' }}>
      <div style={{ background:'#0f0f13', padding:'52px 16px 0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
          <button onClick={goBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <Logo id={sel.id} size={34}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'15px', fontWeight:'800', color:'#fff' }}>{sel.name}</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)' }}>{sel.tagline}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'10px', padding:'5px 10px', textAlign:'right' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>SALDO</div>
            <div style={{ fontSize:'13px', fontWeight:'800', color:'#facc15' }}>{userBalance.toLocaleString()} XAF</div>
          </div>
        </div>
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          {(['apostar','recargar'] as const).map(t => (
            <button key={t} onClick={() => setMainTab(t)}
              style={{ flex:1, padding:'10px 0', background:'none', border:'none', borderBottom:`2px solid ${mainTab===t ? ac : 'transparent'}`, color: mainTab===t ? ac : 'rgba(255,255,255,0.4)', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
              {t === 'apostar' ? '⚽ Apostar' : '💳 Recargar'}
            </button>
          ))}
        </div>
      </div>
      {mainTab === 'recargar' ? (
        <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 80px' }}>
          <div style={{ background:'#1a1a24', borderRadius:'16px', padding:'16px', marginBottom:'12px' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#fff', marginBottom:'12px' }}>Recargar cuenta {sel.name}</div>
            <input type="number" value={rechAmt} onChange={e => setRechAmt(e.target.value)} placeholder={`Mín. ${sel.minDeposit.toLocaleString()} XAF`}
              style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'#fff', fontSize:'16px', fontWeight:'800', outline:'none', boxSizing:'border-box', fontFamily:'inherit', marginBottom:'10px' }}/>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px', marginBottom:'12px' }}>
              {[1000,2500,5000,10000,25000,50000].map(v => (
                <button key={v} onClick={() => setRechAmt(String(v))} style={{ padding:'8px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.7)', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>{v.toLocaleString()}</button>
              ))}
            </div>
            <button onClick={() => { const n=parseInt(rechAmt); if(n>=sel.minDeposit && n<=userBalance){ onDebit(n); setRechOk(true); setRechAmt(''); }}}
              style={{ width:'100%', padding:'13px', background:ac, border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'800', cursor:'pointer' }}>
              Recargar con EGCHAT Wallet
            </button>
          </div>
          {rechOk && <div style={{ background:'rgba(0,200,160,0.1)', border:'1px solid rgba(0,200,160,0.3)', borderRadius:'14px', padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:'24px', marginBottom:'6px' }}>✅</div>
            <div style={{ fontSize:'14px', fontWeight:'800', color:'#00c8a0' }}>¡Recarga exitosa!</div>
          </div>}
          <OfficialBtn company={sel}/>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', gap:'6px', overflowX:'auto', padding:'10px 16px 6px', flexShrink:0 }}>
            {sel.sports!.map(sp => (
              <button key={sp.id} onClick={() => { setSportId(sp.id); setLeagueFilter('Todos'); }}
                style={{ flexShrink:0, padding:'7px 12px', borderRadius:'20px', border:'none', background: sportId===sp.id ? ac : 'rgba(255,255,255,0.08)', color: sportId===sp.id ? '#fff' : 'rgba(255,255,255,0.5)', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                {sp.icon} {sp.label} <span style={{ opacity:0.6, fontSize:'10px' }}>({sp.matches.length})</span>
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:'6px', overflowX:'auto', padding:'0 16px 8px', flexShrink:0 }}>
            {leagues.map(lg => (
              <button key={lg} onClick={() => setLeagueFilter(lg)}
                style={{ flexShrink:0, padding:'5px 10px', borderRadius:'12px', border:`1px solid ${leagueFilter===lg ? ac : 'rgba(255,255,255,0.1)'}`, background: leagueFilter===lg ? (ac+'20') : 'transparent', color: leagueFilter===lg ? ac : 'rgba(255,255,255,0.4)', fontSize:'10px', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                {lg}
              </button>
            ))}
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'0 16px 100px' }}>
            {visibleMatches.some(m => m.live) && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ef4444' }}/>
                <span style={{ fontSize:'11px', fontWeight:'700', color:'#ef4444' }}>EN VIVO — {visibleMatches.filter(m=>m.live).length} partidos</span>
              </div>
            )}
            {visibleMatches.length === 0 && <div style={{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>No hay eventos disponibles</div>}
            {visibleMatches.map(match => {
              const hasDraw = match.oddsX !== undefined;
              return (
                <div key={match.id} style={{ background:'#1a1a24', borderRadius:'14px', padding:'12px', marginBottom:'10px', border: match.live ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{match.leagueIcon} {match.league}</span>
                    {match.live ? <span style={{ fontSize:'10px', fontWeight:'800', color:'#ef4444', background:'rgba(239,68,68,0.15)', padding:'2px 7px', borderRadius:'6px' }}>🔴 {match.minute}' {match.score}</span>
                      : <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)' }}>{match.time}</span>}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                    <div style={{ flex:1 }}><div style={{ fontSize:'13px', fontWeight:'800', color:'#fff' }}>{match.home}</div></div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', padding:'0 8px' }}>VS</div>
                    <div style={{ flex:1, textAlign:'right' }}><div style={{ fontSize:'13px', fontWeight:'800', color:'#fff' }}>{match.away}</div></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: hasDraw ? '1fr 1fr 1fr' : '1fr 1fr', gap:'6px', marginBottom: match.markets ? '8px' : '0' }}>
                    {[
                      { key:'home', label: hasDraw ? '1' : match.home.split(' ')[0], val: match.odds1 },
                      ...(hasDraw ? [{ key:'draw', label:'X', val: match.oddsX! }] : []),
                      { key:'away', label: hasDraw ? '2' : match.away.split(' ')[0], val: match.odds2 },
                    ].map(opt => {
                      const active = isSel(match.id, opt.key);
                      return (
                        <button key={opt.key} onClick={() => addBet(match, opt.key, opt.val)}
                          style={{ padding:'9px 6px', borderRadius:'10px', border:`1.5px solid ${active ? ac : 'rgba(255,255,255,0.1)'}`, background: active ? (ac+'25') : 'rgba(255,255,255,0.04)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                          <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{opt.label}</span>
                          <span style={{ fontSize:'14px', fontWeight:'900', color: active ? ac : '#fff' }}>{opt.val.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {match.markets && match.markets.length > 0 && (
                    <div>
                      <button onClick={() => setExpandMkt(expandMkt === match.id ? null : match.id)}
                        style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:'11px', cursor:'pointer', padding:'4px 0', fontWeight:600 }}>
                        {expandMkt === match.id ? '▲ Ocultar mercados' : `▼ +${match.markets.length} mercados`}
                      </button>
                      {expandMkt === match.id && match.markets.map(mkt => (
                        <div key={mkt.name} style={{ marginTop:'8px' }}>
                          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', fontWeight:700, marginBottom:'5px', textTransform:'uppercase' }}>{mkt.name}</div>
                          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                            {mkt.options.map(opt => {
                              const active = isSel(match.id, opt.label);
                              return (
                                <button key={opt.label} onClick={() => addBet(match, opt.label, opt.odds)}
                                  style={{ padding:'6px 10px', borderRadius:'8px', border:`1px solid ${active ? ac : 'rgba(255,255,255,0.1)'}`, background: active ? (ac+'20') : 'rgba(255,255,255,0.04)', cursor:'pointer', display:'flex', gap:'6px', alignItems:'center' }}>
                                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>{opt.label}</span>
                                  <span style={{ fontSize:'12px', fontWeight:'800', color: active ? ac : '#facc15' }}>{opt.odds.toFixed(2)}</span>
                                </button>
                              );
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
      <OfficialBtn company={sel}/>
      {betSlip.length > 0 && !showSlip && (
        <button onClick={() => setShowSlip(true)}
          style={{ position:'fixed', bottom:'72px', left:'50%', transform:'translateX(-50%)', background:ac, border:'none', borderRadius:'24px', padding:'12px 24px', color:'#fff', fontSize:'13px', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', zIndex:60 }}>
          <span style={{ background:'rgba(255,255,255,0.25)', borderRadius:'50%', width:'22px', height:'22px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'900' }}>{betSlip.length}</span>
          Boleto · {totalPayout.toLocaleString()} XAF posible
        </button>
      )}
      {showSlip && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end' }}>
          <div style={{ background:'#1a1a24', borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'80vh', overflow:'auto', padding:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div style={{ fontSize:'16px', fontWeight:'800', color:'#fff' }}>🎯 Boleto ({betSlip.length})</div>
              <button onClick={() => setShowSlip(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:'30px', height:'30px', color:'#fff', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>
            {betSlip.map((b, i) => (
              <div key={b.id} style={{ background:'rgba(255,255,255,0.05)', borderRadius:'12px', padding:'12px', marginBottom:'8px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>{b.matchLabel}</div>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:'#fff' }}>{b.pick} · <span style={{ color:'#facc15' }}>{b.odds.toFixed(2)}</span></div>
                  </div>
                  <button onClick={() => setBetSlip(p => p.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'16px' }}>✕</button>
                </div>
                <input type="number" value={b.stake} onChange={e => setBetSlip(p => p.map((x,j)=>j===i?{...x,stake:e.target.value}:x))}
                  placeholder={`Mín. ${sel.minBet.toLocaleString()} XAF`}
                  style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
                {parseInt(b.stake) > 0 && <div style={{ fontSize:'11px', color:'#00c8a0', marginTop:'3px' }}>Ganancia: {Math.floor(parseInt(b.stake)*b.odds).toLocaleString()} XAF</div>}
              </div>
            ))}
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:'12px', padding:'12px', marginBottom:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>Total apostado</span>
                <span style={{ fontSize:'12px', fontWeight:'800', color:'#fff' }}>{totalStake.toLocaleString()} XAF</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>Ganancia posible</span>
                <span style={{ fontSize:'14px', fontWeight:'900', color:'#facc15' }}>{totalPayout.toLocaleString()} XAF</span>
              </div>
            </div>
            <button onClick={placeBets} disabled={totalStake<=0||totalStake>userBalance}
              style={{ width:'100%', padding:'14px', background: totalStake>0&&totalStake<=userBalance ? ac : 'rgba(255,255,255,0.1)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'800', cursor: totalStake>0?'pointer':'not-allowed' }}>
              {totalStake>userBalance ? 'Saldo insuficiente' : `Confirmar · ${totalStake.toLocaleString()} XAF`}
            </button>
          </div>
        </div>
      )}
      {result && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:'#1a1a24', borderRadius:'24px', padding:'32px 24px', textAlign:'center', maxWidth:'320px', width:'100%' }}>
            <div style={{ fontSize:'56px', marginBottom:'12px' }}>{result.win ? '🏆' : '😔'}</div>
            <div style={{ fontSize:'22px', fontWeight:'900', color: result.win ? '#facc15' : '#ef4444', marginBottom:'8px' }}>{result.win ? '¡GANASTE!' : 'Esta vez no'}</div>
            {result.win && <div style={{ fontSize:'28px', fontWeight:'900', color:'#00c8a0', marginBottom:'8px' }}>{result.payout.toLocaleString()} XAF</div>}
            <button onClick={() => setResult(null)} style={{ width:'100%', padding:'13px', background:ac, border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'800', cursor:'pointer', marginTop:'8px' }}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── CASINO ──────────────────────────────────────────────────────────────────
  if (sel.type === 'casino') return (
    <div style={{ height:'100%', background:'#0f0f13', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow:'hidden' }}>
      <div style={{ padding:'52px 16px 12px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button onClick={goBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <Logo id={sel.id} size={34}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'15px', fontWeight:'800', color:'#fff' }}>{sel.name}</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)' }}>Casino Online · {sel.casino!.length} juegos</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'10px', padding:'5px 10px', textAlign:'right' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>SALDO</div>
            <div style={{ fontSize:'13px', fontWeight:'800', color:'#facc15' }}>{userBalance.toLocaleString()} XAF</div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 80px' }}>
        <div style={{ background:'linear-gradient(135deg,#4c1d95,#7c3aed)', borderRadius:'14px', padding:'14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'24px' }}>🎁</span>
          <div>
            <div style={{ fontSize:'13px', fontWeight:'800', color:'#fff' }}>{sel.bonus}</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>Min. depósito: {sel.minDeposit.toLocaleString()} XAF</div>
          </div>
        </div>
        {(['crash','slots','live','table'] as const).map(cat => {
          const games = sel.casino!.filter(g => g.type === cat);
          if (!games.length) return null;
          const catLabel: Record<string,string> = { crash:'🚀 Crash & Instant', slots:'🎰 Slots', live:'🎥 Casino en Vivo', table:'🃏 Juegos de Mesa' };
          return (
            <div key={cat} style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>{catLabel[cat]}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                {games.map(g => (
                  <button key={g.id} onClick={() => { setCasinoSel(g); setCasinoRes(null); }}
                    style={{ background: casinoSel?.id===g.id ? (ac+'25') : '#1a1a24', border:`1.5px solid ${casinoSel?.id===g.id ? ac : 'rgba(255,255,255,0.06)'}`, borderRadius:'14px', padding:'14px', cursor:'pointer', textAlign:'left', position:'relative' }}>
                    {g.hot && <span style={{ position:'absolute', top:'8px', right:'8px', background:'#ef4444', color:'#fff', fontSize:'8px', fontWeight:'800', padding:'2px 5px', borderRadius:'6px' }}>HOT</span>}
                    <div style={{ fontSize:'28px', marginBottom:'6px' }}>{g.icon}</div>
                    <div style={{ fontSize:'12px', fontWeight:'800', color:'#fff', marginBottom:'2px' }}>{g.name}</div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', marginBottom:'3px' }}>{g.provider}</div>
                    <div style={{ fontSize:'10px', color:'#00c8a0', fontWeight:700 }}>RTP {g.rtp}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {casinoSel && (
          <div style={{ background:'#1a1a24', borderRadius:'16px', padding:'16px', marginTop:'8px' }}>
            <div style={{ fontSize:'14px', fontWeight:'800', color:'#fff', marginBottom:'12px' }}>{casinoSel.icon} {casinoSel.name}</div>
            <input type="number" value={casinoAmt} onChange={e => setCasinoAmt(e.target.value)} placeholder={`Mín. ${sel.minBet.toLocaleString()} XAF`}
              style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'#fff', fontSize:'16px', fontWeight:'800', outline:'none', boxSizing:'border-box', fontFamily:'inherit', marginBottom:'10px' }}/>
            <div style={{ display:'flex', gap:'6px', marginBottom:'12px' }}>
              {[500,1000,2500,5000].map(v => (
                <button key={v} onClick={() => setCasinoAmt(String(v))} style={{ flex:1, padding:'7px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.6)', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>{v.toLocaleString()}</button>
              ))}
            </div>
            <button onClick={playCasino} style={{ width:'100%', padding:'13px', background:ac, border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'800', cursor:'pointer' }}>🎰 Jugar ahora</button>
            {casinoRes && (
              <div style={{ marginTop:'12px', background: casinoRes.win ? 'rgba(0,200,160,0.1)' : 'rgba(239,68,68,0.1)', border:`1px solid ${casinoRes.win ? 'rgba(0,200,160,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius:'12px', padding:'14px', textAlign:'center' }}>
                <div style={{ fontSize:'28px', marginBottom:'6px' }}>{casinoRes.win ? '🏆' : '😔'}</div>
                <div style={{ fontSize:'15px', fontWeight:'800', color: casinoRes.win ? '#00c8a0' : '#ef4444' }}>
                  {casinoRes.win ? `×${casinoRes.mult} → ${casinoRes.payout.toLocaleString()} XAF` : 'Sin suerte esta vez'}
                </div>
                <button onClick={() => setCasinoRes(null)} style={{ marginTop:'8px', background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'12px', cursor:'pointer' }}>Jugar de nuevo</button>
              </div>
            )}
          </div>
        )}
      </div>
      <OfficialBtn company={sel}/>
    </div>
  );

  // ── LOTERÍA ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100%', background:'#0f0f13', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow:'hidden' }}>
      <div style={{ padding:'52px 16px 12px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button onClick={goBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <Logo id={sel.id} size={34}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'15px', fontWeight:'800', color:'#fff' }}>{sel.name}</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)' }}>Lotería Oficial Guinea Ecuatorial</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'10px', padding:'5px 10px', textAlign:'right' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>SALDO</div>
            <div style={{ fontSize:'13px', fontWeight:'800', color:'#facc15' }}>{userBalance.toLocaleString()} XAF</div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 80px' }}>
        <div style={{ background:'linear-gradient(135deg,#78350f,#d97706)', borderRadius:'16px', padding:'16px', marginBottom:'14px', textAlign:'center' }}>
          <div style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'1px' }}>Bote acumulado</div>
          <div style={{ fontSize:'28px', fontWeight:'900', color:'#fff', margin:'4px 0' }}>100,000,000 XAF</div>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>Super Millones · Próximo sorteo: Viernes 20:00</div>
        </div>
        {sel.lottery!.map(g => (
          <button key={g.id} onClick={() => { setLotSel(g); setLotNums([]); setLotRes(null); }}
            style={{ width:'100%', background: lotSel?.id===g.id ? (ac+'20') : '#1a1a24', border:`1.5px solid ${lotSel?.id===g.id ? ac : 'rgba(255,255,255,0.06)'}`, borderRadius:'14px', padding:'14px', marginBottom:'8px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ fontSize:'28px' }}>{g.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'13px', fontWeight:'800', color:'#fff', marginBottom:'2px' }}>{g.name}</div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'10px', color:'#facc15', fontWeight:700 }}>🏆 {g.jackpot}</span>
                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)' }}>🕐 {g.draw}</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>Precio</div>
              <div style={{ fontSize:'13px', fontWeight:'800', color:ac }}>{g.price.toLocaleString()} XAF</div>
            </div>
          </button>
        ))}
        {lotSel && (
          <div style={{ background:'#1a1a24', borderRadius:'16px', padding:'16px', marginTop:'8px' }}>
            <div style={{ fontSize:'14px', fontWeight:'800', color:'#fff', marginBottom:'4px' }}>{lotSel.icon} {lotSel.name}</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'10px' }}>Elige {lotSel.pickCount} números del 1 al {lotSel.maxNum}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'5px', marginBottom:'12px' }}>
              {Array.from({length: Math.min(lotSel.maxNum, 49)}, (_,i)=>i+1).map(n => {
                const picked = lotNums.includes(n);
                return (
                  <button key={n} onClick={() => { if(picked) setLotNums(p=>p.filter(x=>x!==n)); else if(lotNums.length < lotSel.pickCount) setLotNums(p=>[...p,n]); }}
                    style={{ aspectRatio:'1', borderRadius:'50%', border:`2px solid ${picked ? ac : 'rgba(255,255,255,0.1)'}`, background: picked ? ac : 'rgba(255,255,255,0.04)', color: picked ? '#fff' : 'rgba(255,255,255,0.5)', fontSize:'11px', fontWeight:'800', cursor:'pointer' }}>
                    {n}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginBottom:'10px' }}>
              Seleccionados ({lotNums.length}/{lotSel.pickCount}): {[...lotNums].sort((a,b)=>a-b).join(' · ') || '—'}
            </div>
            <button onClick={playLottery} disabled={lotNums.length < lotSel.pickCount}
              style={{ width:'100%', padding:'13px', background: lotNums.length >= lotSel.pickCount ? ac : 'rgba(255,255,255,0.1)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'800', cursor: lotNums.length >= lotSel.pickCount ? 'pointer' : 'not-allowed' }}>
              🎟️ Comprar boleto · {lotSel.price.toLocaleString()} XAF
            </button>
            {lotRes && (
              <div style={{ marginTop:'12px', background: lotRes.win ? 'rgba(250,204,21,0.1)' : 'rgba(239,68,68,0.1)', border:`1px solid ${lotRes.win ? 'rgba(250,204,21,0.4)' : 'rgba(239,68,68,0.3)'}`, borderRadius:'12px', padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>{lotRes.win ? '🎉' : '😔'}</div>
                <div style={{ fontSize:'16px', fontWeight:'900', color: lotRes.win ? '#facc15' : '#ef4444' }}>
                  {lotRes.win ? `¡Premio! ${lotRes.prize.toLocaleString()} XAF` : 'Sin premio esta vez'}
                </div>
                <button onClick={() => setLotRes(null)} style={{ marginTop:'8px', background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'12px', cursor:'pointer' }}>Jugar de nuevo</button>
              </div>
            )}
          </div>
        )}
      </div>
      <OfficialBtn company={sel}/>
    </div>
  );
};
