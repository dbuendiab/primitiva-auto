// Bookmarklet: Verificación detallada de Euromillones
// Ejecutar en la página del resguardo de apuesta de juegos.loteriasyapuestas.es
//
// Para usarlo como bookmarklet: crear un marcador en el navegador
// y pegar como URL la versión minificada del final de este archivo.

(function () {

  // --- 1. Leer apuestas del input oculto ---
  const input = document.querySelector('input[name="combinacion"]');
  if (!input) { alert('No se encontró el boleto en esta página.'); return; }

  // Formato: ".1=30,40,45,49,50:3,10.2=18,22,27,42,49:7,8..."
  // Los números y estrellas se separan con ":"
  const apuestas = input.value.split('.').filter(s => s.includes('=')).map(s => {
    const [idx, resto] = s.split('=');
    const [nums, estrellas] = resto.split(':');
    return {
      idx: parseInt(idx),
      numeros: nums.split(',').map(Number),
      estrellas: estrellas.split(',').map(Number)
    };
  });

  // --- 2. Leer sorteos del carrusel ---
  const sorteos = [];
  document.querySelectorAll('.item-resumen').forEach(item => {
    const fecha = item.querySelector('.fechaSorteo').textContent.trim();
    const numeros = [...item.querySelectorAll('.resultadoNumeros li')]
      .map(li => parseInt(li.textContent.trim()));
    const e1 = parseInt(item.querySelector('#resultadoEstrella1').textContent.trim());
    const e2 = parseInt(item.querySelector('#resultadoEstrella2').textContent.trim());
    sorteos.push({ fecha, numeros, estrellas: [e1, e2] });
  });

  if (sorteos.length === 0) {
    alert('No se encontraron resultados de sorteos. ¿Se han celebrado ya?');
    return;
  }

  // --- 3. Categorías de premio de Euromillones (13 categorías) ---
  function categoria(acN, acE) {
    if (acN === 5 && acE === 2) return '1ª (5N+2E) 🏆';
    if (acN === 5 && acE === 1) return '2ª (5N+1E) 🥇';
    if (acN === 5 && acE === 0) return '3ª (5N) 🥈';
    if (acN === 4 && acE === 2) return '4ª (4N+2E) 🥉';
    if (acN === 4 && acE === 1) return '5ª (4N+1E) ✓';
    if (acN === 3 && acE === 2) return '6ª (3N+2E) ✓';
    if (acN === 4 && acE === 0) return '7ª (4N) ✓';
    if (acN === 2 && acE === 2) return '8ª (2N+2E) ✓';
    if (acN === 3 && acE === 1) return '9ª (3N+1E) ✓';
    if (acN === 3 && acE === 0) return '10ª (3N) ✓';
    if (acN === 1 && acE === 2) return '11ª (1N+2E) ✓';
    if (acN === 2 && acE === 1) return '12ª (2N+1E) ✓';
    if (acN === 2 && acE === 0) return '13ª (2N) ✓';
    return null;
  }

  // --- 4. Renderizar números y estrellas con estilo según acierto ---
  function renderNumeros(numeros, ganadoresSet) {
    return numeros.map(n => {
      const s = String(n).padStart(2, '0');
      return ganadoresSet.has(n)
        ? `<span style="color:#FFD700;font-weight:bold;text-decoration:underline;">${s}</span>`
        : `<span style="color:#666;">${s}</span>`;
    }).join(' ');
  }

  function renderEstrellas(estrellas, ganadoresSet) {
    return estrellas.map(e => {
      const s = String(e).padStart(2, '0');
      return ganadoresSet.has(e)
        ? `<span style="color:#FF9900;font-weight:bold;text-decoration:underline;">★${s}</span>`
        : `<span style="color:#555;">★${s}</span>`;
    }).join(' ');
  }

  // --- 5. Construir overlay ---
  let totalPremios = 0;

  let html = `
    <div id="euro-overlay" style="
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.88);z-index:99999;overflow-y:auto;
      padding:24px;box-sizing:border-box;font-family:monospace;color:#eee;">
      <div style="max-width:720px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="color:#FFD700;margin:0;">⭐ Verificación Euromillones</h2>
          <button onclick="document.getElementById('euro-overlay').remove()"
            style="background:#555;color:white;border:none;padding:6px 14px;cursor:pointer;font-size:16px;border-radius:4px;">
            ✕ Cerrar
          </button>
        </div>
        <p style="color:#aaa;">${apuestas.length} apuesta(s) | ${sorteos.length} sorteo(s)</p>
        <p style="color:#aaa;font-size:0.85em;">
          Leyenda:
          <span style="color:#FFD700;font-weight:bold;text-decoration:underline;">número acertado</span> ·
          <span style="color:#FF9900;font-weight:bold;text-decoration:underline;">★estrella acertada</span> ·
          <span style="color:#666;">no acertado</span>
        </p>`;

  sorteos.forEach(s => {
    const gNums = new Set(s.numeros);
    const gEsts = new Set(s.estrellas);

    html += `
      <div style="border-top:1px solid #444;margin-top:16px;padding-top:12px;">
        <h3 style="color:#90EE90;margin:0 0 6px 0;">${s.fecha}</h3>
        <p style="margin:0 0 8px 0;">
          Ganadores: <b>${s.numeros.map(n => String(n).padStart(2,'0')).join(' - ')}</b>
          &nbsp;|&nbsp; Estrellas: <b>★${s.estrellas.map(e => String(e).padStart(2,'0')).join(' ★')}</b>
        </p>`;

    apuestas.forEach(a => {
      const acN = a.numeros.filter(n => gNums.has(n)).length;
      const acE = a.estrellas.filter(e => gEsts.has(e)).length;
      const cat = categoria(acN, acE);
      if (cat) totalPremios++;

      const col = cat ? '#FFD700' : (acN >= 2 || acE >= 1) ? '#ADD8E6' : '#666';

      html += `<p style="margin:3px 0;color:${col};">
        Ap.${String(a.idx).padStart(2,' ')}: ${renderNumeros(a.numeros, gNums)}
        + ${renderEstrellas(a.estrellas, gEsts)}
        <span style="color:#aaa;"> → ${acN}N+${acE}E</span>`;
      if (cat) html += ` <b style="color:#FFD700;">→ ${cat}</b>`;
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

  const anterior = document.getElementById('euro-overlay');
  if (anterior) anterior.remove();

  document.body.insertAdjacentHTML('beforeend', html);

})();


// =============================================================
// VERSIÓN BOOKMARKLET (pegar como URL del marcador):
// =============================================================
//
// javascript:(function(){var input=document.querySelector('input[name="combinacion"]');if(!input){alert('No se encontró el boleto.');return;}var apuestas=input.value.split('.').filter(function(s){return s.indexOf('=')>-1;}).map(function(s){var p=s.split('=');var r=p[1].split(':');return{idx:parseInt(p[0]),numeros:r[0].split(',').map(Number),estrellas:r[1].split(',').map(Number)};});var sorteos=[];document.querySelectorAll('.item-resumen').forEach(function(item){var fecha=item.querySelector('.fechaSorteo').textContent.trim();var nums=Array.from(item.querySelectorAll('.resultadoNumeros li')).map(function(li){return parseInt(li.textContent.trim());});var e1=parseInt(item.querySelector('#resultadoEstrella1').textContent.trim());var e2=parseInt(item.querySelector('#resultadoEstrella2').textContent.trim());sorteos.push({fecha:fecha,numeros:nums,estrellas:[e1,e2]});});if(sorteos.length===0){alert('No se encontraron resultados.');return;}function cat(acN,acE){if(acN===5&&acE===2)return'1ª(5N+2E) 🏆';if(acN===5&&acE===1)return'2ª(5N+1E) 🥇';if(acN===5&&acE===0)return'3ª(5N) 🥈';if(acN===4&&acE===2)return'4ª(4N+2E) 🥉';if(acN===4&&acE===1)return'5ª(4N+1E) ✓';if(acN===3&&acE===2)return'6ª(3N+2E) ✓';if(acN===4&&acE===0)return'7ª(4N) ✓';if(acN===2&&acE===2)return'8ª(2N+2E) ✓';if(acN===3&&acE===1)return'9ª(3N+1E) ✓';if(acN===3&&acE===0)return'10ª(3N) ✓';if(acN===1&&acE===2)return'11ª(1N+2E) ✓';if(acN===2&&acE===1)return'12ª(2N+1E) ✓';if(acN===2&&acE===0)return'13ª(2N) ✓';return null;}function rN(nums,gSet){return nums.map(function(n){var s=String(n).padStart(2,'0');return gSet.has(n)?'<span style="color:#FFD700;font-weight:bold;text-decoration:underline;">'+s+'</span>':'<span style="color:#666;">'+s+'</span>';}).join(' ');}function rE(ests,gSet){return ests.map(function(e){var s=String(e).padStart(2,'0');return gSet.has(e)?'<span style="color:#FF9900;font-weight:bold;text-decoration:underline;">★'+s+'</span>':'<span style="color:#555;">★'+s+'</span>';}).join(' ');}var tp=0;var html='<div id="eov" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);z-index:99999;overflow-y:auto;padding:20px;box-sizing:border-box;font-family:monospace;color:#eee;"><div style="max-width:700px;margin:0 auto;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h2 style="color:#FFD700;margin:0;">⭐ Verificación Euromillones</h2><button onclick="document.getElementById(\'eov\').remove()" style="background:#555;color:#fff;border:none;padding:6px 12px;cursor:pointer;border-radius:4px;">✕</button></div><p style="color:#aaa;">'+apuestas.length+' apuesta(s) | Leyenda: <span style="color:#FFD700;font-weight:bold;text-decoration:underline;">número acertado</span> · <span style="color:#FF9900;font-weight:bold;text-decoration:underline;">★estrella acertada</span></p>';sorteos.forEach(function(s){var gN=new Set(s.numeros);var gE=new Set(s.estrellas);html+='<div style="border-top:1px solid #444;margin-top:12px;padding-top:8px;"><h3 style="color:#90EE90;margin:0 0 4px 0;">'+s.fecha+'</h3><p style="margin:0 0 6px 0;">Ganadores: <b>'+s.numeros.map(function(n){return String(n).padStart(2,'0');}).join(' - ')+'</b> | Estrellas: <b>★'+s.estrellas.map(function(e){return String(e).padStart(2,'0');}).join(' ★')+'</b></p>';apuestas.forEach(function(a){var acN=a.numeros.filter(function(n){return gN.has(n);}).length;var acE=a.estrellas.filter(function(e){return gE.has(e);}).length;var k=cat(acN,acE);if(k)tp++;var col=k?'#FFD700':(acN>=2||acE>=1)?'#ADD8E6':'#666';html+='<p style="margin:2px 0;color:'+col+';">Ap.'+String(a.idx).padStart(2,' ')+': '+rN(a.numeros,gN)+' + '+rE(a.estrellas,gE)+'<span style="color:#aaa;"> → '+acN+'N+'+acE+'E</span>'+(k?' <b style="color:#FFD700;">→ '+k+'</b>':'')+'</p>';});html+='</div>';});html+='<div style="border-top:2px solid #FFD700;margin-top:16px;padding-top:10px;"><b style="color:#FFD700;">Total premios: '+tp+'</b></div></div></div>';var old=document.getElementById('eov');if(old)old.remove();document.body.insertAdjacentHTML('beforeend',html);})();
