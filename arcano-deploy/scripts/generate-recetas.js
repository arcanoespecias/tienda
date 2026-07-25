#!/usr/bin/env node
/* Generate weekly recipes using Gemini API and save to Firebase RTDB */
const FIREBASE_URL = 'https://arcano-6788d-default-rtdb.firebaseio.com';
const FIREBASE_API_KEY = 'AIzaSyBvuJusx4_FvAdXhBl89VVlCicNb-yrdzo';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CATEGORIAS = ['Comida', 'Infusiones', 'Cocteleria'];

const PROMPTS = {
  Comida: 'Eres un experto en especias y cocina. Genera 1 receta de Comida que destaque el uso creativo de especias. La receta debe ser deliciosa pero accesible con ingredientes comunes. Incluye al menos 3 especias diferentes. Responde SOLO en formato JSON valido con esta estructura exacta y nada mas: {"titulo":"nombre","descripcion":"breve descripcion de 1-2 oraciones","ingredientes":["ingrediente 1","ingrediente 2"],"pasos":["paso 1","paso 2"],"tiempo":"ej: 30 minutos","porciones":4,"especias":["cüruma","comino"]}',
  Infusiones: 'Eres un experto en infusiones y especias. Genera 1 receta de Infusión usando especias, hierbas aromáticas o flores comestibles. La receta debe ser original y fácil de preparar. Responde SOLO en formato JSON valido con esta estructura exacta y nada mas: {"titulo":"nombre","descripcion":"breve descripción de 1-2 oraciones","ingredientes":["ingrediente 1","ingrediente 2"],"pasos":["paso 1","paso 2"],"tiempo":"ej: 5 minutos","porciones":2,"especias":["manzanilla","canela"]}',
  Cocteleria: 'Eres un experto en coctelería artesanal. Genera 1 receta de Coctelería que use especias, jarabes o ingredientes exóticos. La receta debe ser impresionante y original. Responde SOLO en formato JSON valido con esta estructura exacta y nada mas: {"titulo":"nombre","descripcion":"breve descripción de 1-2 oraciones","ingredientes":["ingrediente 1","ingrediente 2"],"pasos":["paso 1","paso 2"],"tiempo":"ej: 3 minutos","porciones":1,"especias":["pimienta","jengibre"]}'
};

async function callGemini(categoria) {
  var prompt = PROMPTS[categoria];
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY;
  var res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] },
      generationConfig: { temperature: 0.9, responseMimeType: 'application/json' }
    })
  });
  if (!res.ok) throw new Error('Gemini API error ' + res.status + ': ' + (await res.text()));
  var data = await res.json();
  var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text;
  try {
    var recipe = JSON.parse(text);
    recipe.categoria = categoria;
    recipe.fecha = new Date().toISOString().split('T')[0];
    return recipe;
  } catch (e) {
    console.error('Failed to parse recipe for ' + categoria + ':', text.substring(0, 200));
    return null;
  }
}

async function saveToFirebase(recipe) {
  var res = await fetch(FIREBASE_URL + '/arcano/db/recetas.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe)
  });
  if (!res.ok) throw new Error('Firebase error ' + res.status + ': ' + await res.text());
  return await res.json();
}

async function main() {
  if (!GEMINI_KEY) { console.error('ERROR: GEMINI_API_KEY not set'); process.exit(1); }
  console.log('=== Generando recetas semanales ===');
  var semana = new Date().toISOString().split('T')[0];
  for (var i = 0; i < CATEGORIAS.length; i++) {
    var cat = CATEGORIAS[i];
    console.log('Generando receta de ' + cat + '...');
    try {
      var recipe = await callGemini(cat);
      if (!recipe) { console.error('No se pudo generar receta para ' + cat); continue; }
      recipe.semana = semana;
      console.log('  Titulo: ' + recipe.titulo);
      console.log('  Tiempo: ' + recipe.tiempo);
      var result = await saveToFirebase(recipe);
      console.log('  Guardada como: ' + result.name);
    } catch (e) {
      console.error('Error en ' + cat + ':', e.message);
    }
  }
  console.log('=== Completado ===');
}
main();
