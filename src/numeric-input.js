/* Small arithmetic parser: expressions are never executed as JavaScript. */
const NumericInput=(()=>{
  function parse(input,unit=''){
    let s=String(input).trim();
    if(!s)throw Error('请输入数值或表达式。');
    if(s.length>180)throw Error('表达式太长，请简化后再输入。');
    if(/[0-9０-９.]\s+[0-9０-９.]/.test(s))throw Error('相邻数字之间请写明运算符，例如 2*3 或 2+3。');
    s=s.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248)).replace(/[（【]/g,'(').replace(/[）】]/g,')').replace(/[＋]/g,'+').replace(/[−－–]/g,'-').replace(/[×·＊]/g,'*').replace(/[÷／]/g,'/').replace(/根号下?/g,'sqrt').replace(/π/gi,'pi').replace(/√/g,'sqrt').replace(/²/g,'^2').replace(/³/g,'^3').replace(/\s+/g,'').toLowerCase();
    let factor=1;
    if(/(?:rad|弧度)$/.test(s)){if(unit!=='°')throw Error('这个参数不是角度，不能输入弧度。');s=s.replace(/(?:rad|弧度)$/,'');factor=180/Math.PI}
    else if(/(?:deg|°|度)$/.test(s)){if(unit!=='°')throw Error('这个参数不是角度，不能附加角度单位。');s=s.replace(/(?:deg|°|度)$/,'')}
    if(/infinity|∞|nan/.test(s))throw Error('请输入有限实数；无穷大不能用于长度或角度。');
    const tokens=[];let pos=0;
    while(pos<s.length){const m=/^(?:(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|sqrt|pi|[()+\-*/^])/.exec(s.slice(pos));if(!m)throw Error('无法识别此写法。可输入 1/3、√2、sqrt(2)、2√3 或 π。');tokens.push(m[0]);pos+=m[0].length}
    let i=0,depth=0;const peek=()=>tokens[i];
    const finite=n=>{if(!Number.isFinite(n))throw Error('结果不是有限实数，请检查除数、根号和指数。');return n};
    function atom(){if(++depth>48)throw Error('括号或根式嵌套过多。');let n,t=tokens[i++];if(t==='('){n=sum();if(tokens[i++]!==')')throw Error('括号不完整，请补上右括号。')}else if(t==='sqrt'){n=unary();if(n<0)throw Error('实数范围内，根号下不能是负数。');n=Math.sqrt(n)}else if(t==='pi')n=Math.PI;else if(t&&/^(?:\d|\.)/.test(t))n=Number(t);else throw Error('表达式不完整，请检查数字、括号和运算符。');depth--;return finite(n)}
    function power(){let n=atom();if(peek()==='^'){i++;n=finite(n**unary())}return n}
    function unary(){if(peek()==='+'){i++;return unary()}if(peek()==='-'){i++;return -unary()}return power()}
    function product(){let n=unary();while(i<tokens.length){const t=peek();if(t==='*'||t==='/'){i++;const rhs=unary();if(t==='/'&&rhs===0)throw Error('除数不能为0。');n=finite(t==='*'?n*rhs:n/rhs)}else if(t==='('||t==='sqrt'||t==='pi'){n=finite(n*unary())}else break}return n}
    function sum(){let n=product();while(peek()==='+'||peek()==='-'){const t=tokens[i++],rhs=product();n=finite(t==='+'?n+rhs:n-rhs)}return n}
    const value=finite(sum()*factor);if(i!==tokens.length)throw Error('表达式中有多余字符或缺少运算符。');return value;
  }
  const mounted=new WeakMap(),format=n=>String(Number(n.toPrecision(12)));
  function attach(range,{label,unit='',get,set}){
    if(mounted.has(range))return mounted.get(range);
    const min=Number(range.min),max=Number(range.max),originalStep=Number(range.step)||1;
    range.step='any';
    const box=document.createElement('div');box.className='numeric-entry';
    const row=document.createElement('div');row.className='numeric-entry-row';
    const field=document.createElement('input');field.type='text';field.id=range.id+'-expression';field.className='numeric-expression';field.autocomplete='off';field.spellcheck=false;field.maxLength=180;field.setAttribute('aria-label',label+'：输入数值或表达式');field.placeholder='例如 1/3、2√3、sqrt(2)';
    const button=document.createElement('button');button.type='button';button.className='numeric-apply';button.textContent='应用';
    const hint=document.createElement('p');hint.className='numeric-hint';hint.id=range.id+'-input-hint';hint.textContent=`范围 ${format(min)}～${format(max)}${unit}；支持分数、√、π、括号和四则运算。按回车或点“应用”。`+(unit==='°'?' 默认单位为度；弧度可写 π/6 rad。':'');
    const feedback=document.createElement('p');feedback.className='numeric-feedback';feedback.id=range.id+'-input-feedback';feedback.setAttribute('aria-live','polite');field.setAttribute('aria-describedby',hint.id+' '+feedback.id);
    row.append(field,button);box.append(row,hint,feedback);range.insertAdjacentElement('afterend',box);
    let lastValue;
    function sync(value){range.value=value;if(!Object.is(value,lastValue)){lastValue=value;field.value=format(value);field.removeAttribute('aria-invalid');feedback.textContent=''}}
    function apply(){try{const value=parse(field.value,unit);if(value<min||value>max)throw Error(`结果约为 ${format(value)}${unit}，请填写 ${format(min)}～${format(max)}${unit} 范围内的值。`);lastValue=value;set(value);range.value=value;field.removeAttribute('aria-invalid');feedback.textContent=`已应用，数值约为 ${format(value)}${unit}。`;}catch(e){field.setAttribute('aria-invalid','true');feedback.textContent=e.message}}
    button.addEventListener('click',apply);field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply()}});field.addEventListener('input',()=>{field.removeAttribute('aria-invalid');feedback.textContent='尚未应用，按回车或点“应用”。'});
    range.addEventListener('keydown',e=>{const direction={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[e.key];if(direction){e.preventDefault();set(Math.max(min,Math.min(max,get()+direction*originalStep)))}});
    const control={sync};mounted.set(range,control);sync(get());return control;
  }
  function sync(range,value){mounted.get(range)?.sync(value)}
  return {parse,attach,sync};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=NumericInput;
