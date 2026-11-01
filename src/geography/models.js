// Educational models: geometric results are quantitative; other indices are explicitly illustrative.
export const rad = Math.PI / 180;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const farmParcels=[
 {name:'河谷平原',x:-3,z:2.1,altitude:50,slope:2},
 {name:'缓坡台地',x:-.1,z:2.1,altitude:280,slope:7},
 {name:'低山坡地',x:2.8,z:-.2,altitude:650,slope:18},
 {name:'高山坡地',x:3,z:-2.3,altitude:1000,slope:25},
 {name:'丘陵',x:-.2,z:-.4,altitude:450,slope:12},
 {name:'滨河平地',x:-3,z:-1.9,altitude:120,slope:3}
];
export function solar(s) {
  const phase = (s.day - 80) / 365 * Math.PI * 2;
  const declination = Math.asin(Math.sin(s.tilt * rad) * Math.sin(phase)) / rad;
  const lat = clamp(s.lat, -89.99, 89.99) * rad;
  const d = declination * rad;
  const x = -Math.tan(lat) * Math.tan(d);
  const daylight = x <= -1 ? 24 : x >= 1 ? 0 : 24 * Math.acos(x) / Math.PI;
  const altitude = 90 - Math.abs(s.lat - declination);
  return { declination, daylight, altitude, phase };
}
export function values(id, s) {
  if (['orbit','daylight','shadow'].includes(id)) {
    const p = solar(s);
    const shadow = p.altitude > .01 ? s.height / Math.tan(p.altitude * rad) : null;
    return { ...p, shadow, clearance: shadow === null ? null : s.gap - shadow };
  }
  if (id === 'breeze') {
    const delta = s.contrast * Math.sin((s.hour - 8) / 24 * Math.PI * 2);
    return { delta, land: 22 + delta * .8, sea: 22 - delta * .2, strength: Math.sqrt(Math.abs(delta)) * 1.5, direction: Math.abs(delta)<.05?'转换时段':delta>0?'海风：海 → 陆':'陆风：陆 → 海' };
  }
  if (id === 'front') {
    const cold = s.type === 0, passed = s.position > 0;
    const rain = cold ? s.position >= 0 && s.position < 2.5 : s.position > -3.5 && s.position <= 0;
    return { temp: cold ? (passed?9:24) : (passed?24:9), pressure: cold ? (passed?1018:1006) : (passed?1006:1018), rain: rain ? (cold?80:45)*s.moisture/100 : 0, passed, cold };
  }
  if (id === 'circulation') {
    const shift = s.season * 12, r = s.lat - shift;
    const a = Math.abs(r);
    let band = a < 7 ? '赤道低压带' : Math.abs(a-30)<7 ? '副热带高压带' : Math.abs(a-60)<7 ? '副极地低压带' : a>80 ? '极地高压带' : a<30 ? '信风带' : a<60 ? '西风带' : '极地东风带';
    return { shift, band, latitude: s.lat, cells: s.rotation ? 3 : 1 };
  }
  if (id === 'water') {
    const infiltration = s.rain * (.15 + .6 * (1-s.paving/100)) * (1 + s.green/200);
    const evap = s.rain * .08, infiltrated = Math.min(s.rain-evap, infiltration);
    const runoff = s.rain-evap-infiltrated;
    const detention = Math.min(runoff, s.green*.16);
    return { infiltration: infiltrated, evap, runoff, detention, outlet: runoff-detention, flood: Math.max(0,runoff-detention-20) };
  }
  if (id === 'river') {
    const energy = s.flow/50 * s.slope/3;
    const capacity = energy*60;
    const deposition = Math.max(0,s.sediment-capacity);
    return { energy, capacity, deposition, erosion: Math.max(0,capacity-s.sediment), state: s.sediment>capacity?'堆积占优势':s.sediment<capacity?'侵蚀潜势较大':'输沙接近平衡' };
  }
  if (id === 'farm') {
    const {altitude,slope} = farmParcels[s.parcel];
    const temp = s.temp - altitude*.006;
    const water = s.rain + s.irrigation*5;
    const opt = [[25,1100],[16,550],[20,1400]][s.crop];
    const heat = clamp(100-Math.abs(temp-opt[0])*7,0,100);
    const moisture = clamp(100-Math.abs(water-opt[1])/13,0,100);
    const terrain = s.crop===2 ? clamp(100-Math.abs(slope-12)*3,0,100) : clamp(100-slope*3,0,100);
    const score = Math.round(Math.min(heat,moisture,terrain));
    return { altitude, slope, temp, water, heat, moisture, terrain, score, limiting: ['热量','水分','地形'][[heat,moisture,terrain].indexOf(Math.min(heat,moisture,terrain))] };
  }
  if (id === 'basin') {
    const release = Math.min(s.release,s.inflow+40);
    const irrigation = release*s.allocation/100;
    const downstream = release-irrigation;
    const storage = s.inflow-release;
    return { release, irrigation, downstream, storage, ecology: downstream>=25?'达到示例生态底线':'低于示例生态底线', power:release*.8, shortage:Math.max(0,35-irrigation) };
  }
  return {};
}
export function metrics(id,s) {
  const v=values(id,s), n=(x,d=1)=>Number(x).toFixed(d);
  const m=(label,value,unit='')=>({label,value,unit});
  switch(id) {
    case 'breeze': return [m('陆地表层空气',n(v.land),'℃'),m('海面表层空气',n(v.sea),'℃'),m('近地面风向',v.direction)];
    case 'orbit': return [m('太阳直射纬度',n(v.declination),'°'),m('正午太阳高度',n(v.altitude),'°'),m('所选纬度昼长',n(v.daylight),'h')];
    case 'daylight':return [m('白昼',n(v.daylight),'h'),m('黑夜',n(24-v.daylight),'h'),m('日照状态',v.daylight===24?'极昼':v.daylight===0?'极夜':'昼夜交替')];
    case 'shadow':return [m('正午太阳高度',n(v.altitude),'°'),m('正午影长',v.shadow===null?'太阳未升起':n(v.shadow),'m'),m('后楼底部采光',v.shadow===null?'无直射光':v.clearance>=0?'无遮挡':'被前楼遮挡')];
    case 'front':return [m('测站气温',n(v.temp,0),'℃'),m('测站气压',n(v.pressure,0),'hPa'),m('降水强度指数',n(v.rain,0),'/100')];
    case 'circulation':return [m('环流理想模型',s.rotation?'三圈环流':'单圈环流'),m('气压带示意偏移',n(v.shift,0),'°'),m('所选纬度',s.rotation?v.band:'单圈环流示意')];
    case 'water':return [m('下渗量',n(v.infiltration),'mm'),m('地表产流',n(v.runoff),'mm'),m('超出排水能力',n(v.flood),'mm')];
    case 'river':return [m('相对输沙能力',n(v.capacity,0),'指数'),m('泥沙供应',n(s.sediment,0),'指数'),m('本河段趋势',v.state)];
    case 'farm':return [m('地块气温',n(v.temp),'℃'),m('适宜度',v.score,'/100'),m('当前限制因素',v.limiting)];
    case 'basin':return [m('库容变化',n(v.storage,0),'单位/时段'),m('农业取水',n(v.irrigation,0),'单位'),m('下游生态流量',n(v.downstream,0),'单位')];
  }
}
