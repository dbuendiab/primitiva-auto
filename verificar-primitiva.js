// Bookmarklet: Verificación detallada de La Primitiva
// Ejecutar en la página del resguardo de apuesta de juegos.loteriasyapuestas.es
//
// Para usarlo como bookmarklet: crear un marcador en el navegador
// y pegar como URL la versión minificada del final de este archivo.

(function () {

  // --- 1. Leer apuestas del input oculto ---
  const input = document.querySelector('input[name="combinacion"]');
  if (!input) { alert('No se encontró el boleto en esta página.'); return; }

  // Formato: ".1=7,13,14,20,27,30.2=7,10,...;8"
  const [combPart, reintegroPart] = input.value.split(';');
  const reintegroTicket = parseInt(reintegroPart);

  const apuestas = combPart.split('.').filter(s => s.includes('=')).map(s => {
    const [idx, nums] = s.split('=');
    return { idx: parseInt(idx), numeros: nums.split(',').map(Number) };
  });

  // --- 2. Leer sorteos del carrusel ---
  const sorteos = [];
  document.querySelectorAll('.item-resumen').forEach(item => {
    const fecha = item.querySelector('.fechaSorteo').textContent.trim();
    const numeros = [...item.querySelectorAll('.resultadoNumeros li')]
      .map(li => parseInt(li.textContent.trim()));
    const comp = parseInt(item.querySelector('#resultadoComplementario').textContent.trim());
    const rein = parseInt(item.querySelector('#resultadoReintegro').textContent.trim());
    sorteos.push({ fecha, numeros, comp, rein });
  });

  if (sorteos.length === 0) {
    alert('No se encontraron resultados de sorteos. ¿Se han celebrado ya?');
    return;
  }

  // --- 3. Determinar categoría de premio ---
  function categoria(aciertos, tieneComp, tieneReintegro) {
    if (aciertos === 6 && tieneReintegro) return 'ESPECIAL (6+R) 🏆';
    if (aciertos === 6)                   return '1ª (6 aciertos) 🏆';
    if (aciertos === 5 && tieneComp)      return '2ª (5+C) 🥇';
    if (aciertos === 5)                   return '3ª (5 aciertos) 🥈';
    if (aciertos === 4)                   return '4ª (4 aciertos) 🥉';
    if (aciertos === 3)                   return '5ª (3 aciertos) ✓';
    return null;
  }

  // --- 4. Renderizar cada número con su estilo según si acierta o no ---
  function renderNumeros(numeros, ganadoresSet, compNum) {
    return numeros.map(n => {
      const esGanador = ganadoresSet.has(n);
      const esComp = n === compNum;
      const num = String(n).padStart(2, '0');
      if (esGanador) {
        return `<span style="color:#FFD700;font-weight:bold;text-decoration:underline;">${num}</span>`;
      } else if (esComp) {
        return `<span style="color:#FF9900;font-style:italic;text-decoration:underline;">${num}</span>`;
      } else {
        return `<span style="color:#666;">${num}</span>`;
      }
    }).join(' ');
  }

  // --- 5. Construir overlay con resultados ---
  let html = `
    <div id="primitiva-overlay" style="
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.88);z-index:99999;overflow-y:auto;
      padding:24px;box-sizing:border-box;font-family:monospace;color:#eee;">
      <div style="max-width:720px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="color:#FFD700;margin:0;">🎱 Verificación La Primitiva</h2>
          <button onclick="document.getElementById('primitiva-overlay').remove()"
            style="background:#555;color:white;border:none;padding:6px 14px;cursor:pointer;font-size:16px;border-radius:4px;">
            ✕ Cerrar
          </button>
        </div>
        <p style="color:#aaa;">
          Reintegro del boleto: <strong style="color:white;">${reintegroTicket}</strong>
          &nbsp;|&nbsp; ${apuestas.length} apuestas &nbsp;|&nbsp; ${sorteos.length} sorteo(s)
        </p>
        <p style="color:#aaa;font-size:0.85em;">
          Leyenda: <span style="color:#FFD700;font-weight:bold;text-decoration:underline;">número acertado</span>
          &nbsp;·&nbsp; <span style="color:#FF9900;font-style:italic;text-decoration:underline;">complementario</span>
          &nbsp;·&nbsp; <span style="color:#666;">no acertado</span>
        </p>`;

  let totalPremios = 0;

  sorteos.forEach(s => {
    const ganadoresSet = new Set(s.numeros);
    const reintegroMatch = reintegroTicket === s.rein;
    if (reintegroMatch) totalPremios++;

    html += `
      <div style="border-top:1px solid #444;margin-top:16px;padding-top:12px;">
        <h3 style="color:#90EE90;margin:0 0 6px 0;">${s.fecha}</h3>
        <p style="margin:0 0 8px 0;">
          Combinación: <strong>${s.numeros.map(n => String(n).padStart(2,'0')).join(' - ')}</strong>
          &nbsp; C:<strong>${String(s.comp).padStart(2,'0')}</strong>
          &nbsp; R:<strong>${s.rein}</strong>
        </p>`;

    if (reintegroMatch) {
      html += `<p style="color:#FFD700;margin:0 0 6px 0;">★ REINTEGRO (boleto: ${reintegroTicket} = sorteo: ${s.rein})</p>`;
    }

    apuestas.forEach(a => {
      const acertados = a.numeros.filter(n => ganadoresSet.has(n));
      const tieneComp = a.numeros.includes(s.comp);
      const cat = categoria(acertados.length, tieneComp, reintegroMatch);

      if (cat) totalPremios++;

      const colorLinea = cat ? '#FFD700' : acertados.length >= 2 ? '#ADD8E6' : '#888';
      const numerosHtml = renderNumeros(a.numeros, ganadoresSet, s.comp);

      html += `<p style="margin:3px 0;color:${colorLinea};">
        Ap.${String(a.idx).padStart(2,' ')}: ${numerosHtml}
        <span style="color:#aaa;"> → ${acertados.length} ac.</span>`;
      if (tieneComp) html += ` <span style="color:#FF9900;">+C</span>`;
      if (cat) html += `&nbsp;&nbsp;<span style="color:#FFD700;font-weight:bold;">→ ${cat}</span>`;
      html += `</p>`;
    });

    html += `</div>`;
  });

  html += `
        <div style="border-top:2px solid #FFD700;margin-top:20px;padding-top:12px;">
          <strong style="color:#FFD700;">Total premios encontrados: ${totalPremios}</strong>
        </div>
      </div>
    </div>`;

  const anterior = document.getElementById('primitiva-overlay');
  if (anterior) anterior.remove();

  document.body.insertAdjacentHTML('beforeend', html);

})();


// =============================================================
// VERSIÓN BOOKMARKLET (pegar como URL del marcador):
// =============================================================
//
// javascript:(function(){var input=document.querySelector('input[name="combinacion"]');if(!input){alert('No se encontró el boleto.');return;}var parts=input.value.split(';');var rT=parseInt(parts[1]);var apuestas=parts[0].split('.').filter(function(s){return s.indexOf('=')>-1;}).map(function(s){var p=s.split('=');return{idx:parseInt(p[0]),numeros:p[1].split(',').map(Number)};});var sorteos=[];document.querySelectorAll('.item-resumen').forEach(function(item){var fecha=item.querySelector('.fechaSorteo').textContent.trim();var nums=Array.from(item.querySelectorAll('.resultadoNumeros li')).map(function(li){return parseInt(li.textContent.trim());});var comp=parseInt(item.querySelector('#resultadoComplementario').textContent.trim());var rein=parseInt(item.querySelector('#resultadoReintegro').textContent.trim());sorteos.push({fecha:fecha,numeros:nums,comp:comp,rein:rein});});if(sorteos.length===0){alert('No se encontraron resultados.');return;}function cat(ac,c,r){if(ac===6&&r)return'ESPECIAL 🏆';if(ac===6)return'1ª 🏆';if(ac===5&&c)return'2ª(5+C) 🥇';if(ac===5)return'3ª 🥈';if(ac===4)return'4ª 🥉';if(ac===3)return'5ª ✓';return null;}function rN(nums,gSet,cNum){return nums.map(function(n){var s=String(n).padStart(2,'0');if(gSet.has(n))return'<span style="color:#FFD700;font-weight:bold;text-decoration:underline;">'+s+'</span>';if(n===cNum)return'<span style="color:#FF9900;font-style:italic;text-decoration:underline;">'+s+'</span>';return'<span style="color:#666;">'+s+'</span>';}).join(' ');}var tp=0;var html='<div id="pov" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);z-index:99999;overflow-y:auto;padding:20px;box-sizing:border-box;font-family:monospace;color:#eee;"><div style="max-width:700px;margin:0 auto;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h2 style="color:#FFD700;margin:0;">🎱 Verificación Primitiva</h2><button onclick="document.getElementById(\'pov\').remove()" style="background:#555;color:#fff;border:none;padding:6px 12px;cursor:pointer;border-radius:4px;">✕</button></div><p style="color:#aaa;">Reintegro: <b style="color:#fff;">'+rT+'</b> | '+apuestas.length+' apuestas | Leyenda: <span style="color:#FFD700;font-weight:bold;text-decoration:underline;">acertado</span> · <span style="color:#FF9900;font-style:italic;text-decoration:underline;">complementario</span></p>';sorteos.forEach(function(s){var gSet=new Set(s.numeros);var rM=rT===s.rein;if(rM)tp++;html+='<div style="border-top:1px solid #444;margin-top:12px;padding-top:8px;"><h3 style="color:#90EE90;margin:0 0 4px 0;">'+s.fecha+'</h3><p style="margin:0 0 6px 0;">Ganadores: <b>'+s.numeros.map(function(n){return String(n).padStart(2,'0');}).join(' - ')+'</b> C:<b>'+String(s.comp).padStart(2,'0')+'</b> R:<b>'+s.rein+'</b></p>';if(rM)html+='<p style="color:#FFD700;margin:0 0 4px 0;">★ REINTEGRO</p>';apuestas.forEach(function(a){var ac=a.numeros.filter(function(n){return gSet.has(n);});var c=a.numeros.indexOf(s.comp)>-1;var k=cat(ac.length,c,rM);if(k)tp++;var col=k?'#FFD700':ac.length>=2?'#ADD8E6':'#888';html+='<p style="margin:2px 0;color:'+col+';">Ap.'+String(a.idx).padStart(2,' ')+': '+rN(a.numeros,gSet,s.comp)+'<span style="color:#aaa;"> → '+ac.length+' ac.</span>'+(c?' <span style="color:#FF9900;">+C</span>':'')+(k?' <b style="color:#FFD700;"> → '+k+'</b>':'')+'</p>';});html+='</div>';});html+='<div style="border-top:2px solid #FFD700;margin-top:16px;padding-top:10px;"><b style="color:#FFD700;">Total premios: '+tp+'</b></div></div></div>';var old=document.getElementById('pov');if(old)old.remove();document.body.insertAdjacentHTML('beforeend',html);})();
