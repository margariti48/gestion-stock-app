let products = [];
let colorModel;
const colorLabels = ["noir", "blanc", "rouge", "bleu", "vert", "jaune", "orange", "rose", "gris", "marron", "violet", "beige", "turquoise", "doré", "argent", "autre"]; // adapte selon ton modèle

async function loadColorModel() {
  try {
    colorModel = await tf.loadLayersModel('model/model.json');
    console.log('✅ Modèle couleur chargé');
  } catch (err) {
    console.error('❌ Erreur chargement modèle couleur:', err);
  }
}
loadColorModel();

function getColorLabel(index) {
  return colorLabels[index] || "inconnu";
}

function showManualForm() {
  document.getElementById("form-container").innerHTML = `
    <h3>Ajout Manuel</h3>
    <input type="text" id="product-name" placeholder="Nom du produit" />
    <input type="text" id="product-size" placeholder="Taille" />
    <input type="text" id="product-color" placeholder="Couleur" />
    <select id="product-gender">
      <option value="">Sexe</option>
      <option value="Homme">Homme</option>
      <option value="Femme">Femme</option>
      <option value="Unisex">Unisex</option>
    </select>
    <input type="number" id="product-quantity" placeholder="QTE" min="1" value="1" />
    <button onclick="addProduct('manuel')">Ajouter</button>
  `;
}

function showScanForm() {
  document.getElementById("form-container").innerHTML = `
    <h3>Ajout avec Scan (simulation)</h3>
    <input type="text" id="product-name" placeholder="Nom du produit" />
    <select id="product-gender">
      <option value="">Sexe</option>
      <option value="Homme">Homme</option>
      <option value="Femme">Femme</option>
      <option value="Unisex">Unisex</option>
    </select>
    <button onclick="addProduct('scan')">Ajouter</button>
  `;
}

function showPhotoForm() {
  document.getElementById("form-container").innerHTML = `
    <h3>Ajout par Photo</h3>
    <button onclick="showSinglePhotoForm()">Ajouter une seule photo</button>
    <button onclick="showMultiPhotoForm()">Ajouter plusieurs photos</button>
  `;
}

// Formulaire pour une seule photo
function showSinglePhotoForm() {
  document.getElementById("form-container").innerHTML = `
    <h3>Ajout par Photo (une seule)</h3>
    <input type="file" id="photo-input" accept="image/*" capture="environment" onchange="previewPhoto(event)" />
    <div id="photo-preview-container" style="margin:10px 0;"></div>
    <input type="text" id="product-name" placeholder="Nom détecté (par image)" />
    <input type="text" id="product-size" placeholder="Taille (optionnelle)" />
    <input type="text" id="product-color" placeholder="Couleur (optionnelle)" />
    <select id="product-gender">
      <option value="">Sexe</option>
      <option value="Homme">Homme</option>
      <option value="Femme">Femme</option>
      <option value="Unisex">Unisex</option>
    </select>
    <button onclick="addProductPhoto()">Ajouter</button>
  `;
}

// Affiche la prévisualisation de la photo sélectionnée
function previewPhoto(event) {
  const container = document.getElementById('photo-preview-container');
  container.innerHTML = '';
  const file = event.target.files && event.target.files[0];
        if (file) { 
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '200px';
      img.style.maxHeight = '200px';
      img.style.display = 'block';
      img.style.margin = '0 auto 10px auto';
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

function addProductPhoto() {
  const photoInput = document.getElementById("photo-input");
  const nameInput = document.getElementById("product-name");
  const sizeInput = document.getElementById("product-size");
  const colorInput = document.getElementById("product-color");
  const gender = document.getElementById("product-gender")?.value || "";
  let name = nameInput?.value || "";
  let size = sizeInput?.value || "";
  let color = colorInput?.value || "";
  let quantity = 1;

  if (!gender) {
    alert("Merci de remplir les champs obligatoires (sexe).");
    return;
  }

  if (photoInput.files && photoInput.files[0]) {
    let waitMsg = document.createElement('div');
    waitMsg.id = 'wait-message';
    waitMsg.style = 'color:blue;font-weight:bold;margin:10px 0;';
    waitMsg.innerText = 'Analyse de la photo en cours...';
    document.getElementById('form-container').appendChild(waitMsg);

    const file = photoInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      let img = document.createElement('img');
      img.src = e.target.result;
      img.id = 'photo-preview';
      img.style.display = 'none';
      document.body.appendChild(img);
      img.onload = async function() {
        let colorOk = false, sizeOk = false;
        // 1. Détection couleur par modèle IA
        if (colorModel) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 64, 64);
            const imageData = ctx.getImageData(0, 0, 64, 64);
            const input = tf.browser.fromPixels(imageData).expandDims(0).toFloat().div(255);
            const prediction = colorModel.predict(input);
            const colorIndex = prediction.argMax(-1).dataSync()[0];
            color = getColorLabel(colorIndex);
            if (colorInput) {
              colorInput.value = color;
              colorInput.style.background = '';
            }
            colorOk = true;
          } catch (err) {
            colorOk = false;
            if (colorInput) colorInput.value = '';
            waitMsg.innerText = 'Erreur détection couleur (modèle IA).';
            waitMsg.style.color = 'red';
            alert('Erreur IA: ' + err); // Ajoute cette ligne
            console.warn('Erreur détection couleur IA:', err);
          }
        } else {
          colorOk = false;
          if (colorInput) colorInput.value = '';
          waitMsg.innerText = 'Modèle couleur non chargé.';
          waitMsg.style.color = 'red';
        }
        // 2. Détection taille par OCR (Tesseract.js)
        if (typeof Tesseract !== 'undefined') {
          try {
            const result = await Tesseract.recognize(img, 'eng', { logger: m => console.log(m) });
            const text = result.data.text;
            const tailleTrouvee = (text.match(/\b([XSML]{1,3}|\d{2,3})\b/gi) || [""])[0];
            if (tailleTrouvee) {
              size = tailleTrouvee;
              if (sizeInput) sizeInput.value = size;
              sizeOk = true;
            } else {
              sizeOk = false;
              if (sizeInput) sizeInput.value = '';
            }
          } catch (err) {
            sizeOk = false;
            if (sizeInput) sizeInput.value = '';
            waitMsg.innerText = 'Erreur OCR (taille).';
            waitMsg.style.color = 'red';
            console.warn('Erreur OCR:', err);
          }
        } else {
          sizeOk = false;
          waitMsg.innerText = 'Tesseract.js non chargé.';
          waitMsg.style.color = 'red';
        }
        // Affiche le résultat ou un message d'erreur
        if (colorOk && sizeOk) {
          waitMsg.innerText = 'Couleur et taille détectées automatiquement !';
          waitMsg.style.color = 'green';
        } else if (colorOk) {
          waitMsg.innerText = 'Couleur détectée, taille non détectée.';
          waitMsg.style.color = 'orange';
        } else if (sizeOk) {
          waitMsg.innerText = 'Taille détectée, couleur non détectée.';
          waitMsg.style.color = 'orange';
        } else {
          waitMsg.innerText = 'Aucune détection automatique. Remplis manuellement.';
          waitMsg.style.color = 'red';
        }
        // 3. Ignore toute détection/saisie taille et couleur, force vides
        if (sizeInput) sizeInput.value = "";
        if (colorInput) colorInput.value = "";
        name = nameInput?.value || "";
        // Taille et couleur toujours vides
        const id = Date.now() + Math.floor(Math.random() * 1000000);
        const newProduct = { id, name, size: "", color: "", gender, quantity: 1 };
        if (!name) {
          alert("Merci de remplir le nom du produit.");
          document.body.removeChild(img);
          waitMsg.remove();
          return;
        }
        products.push(newProduct);
        renderProductList();
        document.getElementById("form-container").innerHTML = `
          <h3>Ajout par Photo (une seule)</h3>
          <input type="file" id="photo-input" accept="image/*" capture="environment" onchange="previewPhoto(event)" />
          <div id="photo-preview-container" style="margin:10px 0;"></div>
          <input type="text" id="product-name" placeholder="Nom détecté (par image)" value="${name}" />
          <input type="text" id="product-size" placeholder="Taille (optionnelle)" value="" />
          <input type="text" id="product-color" placeholder="Couleur (optionnelle)" value="" />
          <select id="product-gender">
            <option value="">Sexe</option>
            <option value="Homme" ${gender === "Homme" ? "selected" : ""}>Homme</option>
            <option value="Femme" ${gender === "Femme" ? "selected" : ""}>Femme</option>
            <option value="Unisex" ${gender === "Unisex" ? "selected" : ""}>Unisex</option>
          </select>
          <button onclick="addProductPhoto()">Ajouter</button>
        `;
        alert("Produit ajouté avec photo !");
        document.body.removeChild(img);
        waitMsg.remove();
      };
    };
    reader.readAsDataURL(file);
  } else {
    alert("Prends une photo du produit avant d'ajouter.");
  }
// ...existing code...



function startVoiceInput() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "fr-FR";

  recognition.onresult = (event) => {
    const voiceText = event.results[0][0].transcript.toLowerCase();

    // Extraction simple par mots-clés
    let name = "";
    let color = "";
    let size = "";
    let gender = "";
    let quantity = 1;


    // Exemple de phrase : "chemise rouge taille M homme quantité 5"
    const genderList = ["homme", "femme", "unisex"];
    const sizeMatch = voiceText.match(/taille\s*([a-zA-Z0-9]+)/);
    const quantityMatch = voiceText.match(/quantité\s*(\d+)/);

    // Détection couleur : prend le mot juste avant "taille", "homme", "femme", "unisex", "quantité" ou à la fin
    // Ex : "chemise orange taille M homme quantité 5" => "orange"
    let colorMatch = voiceText.match(/([a-zA-Zéèêàùûôîç]+)/g);
    if (colorMatch) {
      // On retire les mots connus (taille, homme, femme, unisex, quantité, chiffres, etc.)
      const exclude = ["taille", "homme", "femme", "unisex", "quantité", "de", "du", "la", "le", "un", "une", "et", "pour", "avec", "en", "sur", "dans", "au", "aux", "des", "les", "d", "l", "qte", "quantite"];
      const filtered = colorMatch.filter(w => !exclude.includes(w.toLowerCase()) && !/^[0-9]+$/.test(w));
      // On enlève le nom du produit si déjà trouvé
      if (sizeMatch) filtered.splice(filtered.indexOf(sizeMatch[1]), 1);
      if (quantityMatch) filtered.splice(filtered.indexOf(quantityMatch[1]), 1);
      for (const g of genderList) {
        const idx = filtered.indexOf(g);
        if (idx !== -1) filtered.splice(idx, 1);
      }
      // On prend le dernier mot restant comme couleur probable
      if (filtered.length > 0) color = filtered[filtered.length - 1];
    }

    // Cherche le sexe
    for (const g of genderList) {
      if (voiceText.includes(g)) {
        gender = g.charAt(0).toUpperCase() + g.slice(1);
        break;
      }
    }

    // Cherche la taille
    if (sizeMatch) size = sizeMatch[1];

    // Cherche la quantité
    if (quantityMatch) quantity = parseInt(quantityMatch[1]);

    // Nom = tout ce qui reste (très simplifié)
    name = voiceText
      .replace(/taille\s*[a-zA-Z0-9]+/, "")
      .replace(/quantité\s*\d+/, "")
      .replace(new RegExp(color, "i"), "")
      .replace(new RegExp(gender, "i"), "")
      .trim();

    document.getElementById("form-container").innerHTML = `
      <h3>Ajout Vocal</h3>
      <div>
        <label>Nom du produit :</label>
        <input type="text" id="product-name" value="${name}" />
        <button onclick="voiceEditField('product-name')">🎤</button>
      </div>
      <div>
        <label>Couleur :</label>
        <input type="text" id="product-color" value="${color}" />
        <button onclick="voiceEditField('product-color')">🎤</button>
      </div>
      <div>
        <label>Taille :</label>
        <input type="text" id="product-size" value="${size}" />
        <button onclick="voiceEditField('product-size')">🎤</button>
      </div>
      <div>
        <label>Sexe :</label>
        <select id="product-gender">
          <option value="">Sexe</option>
          <option value="Homme" ${gender === "Homme" ? "selected" : ""}>Homme</option>
          <option value="Femme" ${gender === "Femme" ? "selected" : ""}>Femme</option>
          <option value="Unisex" ${gender === "Unisex" ? "selected" : ""}>Unisex</option>
        </select>
        <button onclick="voiceEditField('product-gender')">🎤</button>
      </div>
      <div>
        <label>QTE :</label>
        <input type="number" id="product-quantity" min="1" value="${quantity}" />
        <button onclick="voiceEditField('product-quantity')">🎤</button>
      </div>
      <button onclick="addProduct('vocal')">Ajouter (vocal)</button>
    `;
  };

  recognition.start();
}

// Fonction pour modifier un champ par commande vocale
function voiceEditField(fieldId) {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "fr-FR";
  recognition.onresult = (event) => {
    const value = event.results[0][0].transcript;
    const field = document.getElementById(fieldId);
    if (field.tagName === "SELECT") {
      // Pour le select, essaye de sélectionner la bonne option
      for (let option of field.options) {
        if (option.text.toLowerCase() === value.toLowerCase()) {
          field.value = option.value;
          break;
        }
      }
    } else {
      field.value = value;
    }
  };
  recognition.start();
}

function addProduct(mode) {
  const name = document.getElementById("product-name")?.value || "";
  const size = document.getElementById("product-size")?.value || "-";
  const color = document.getElementById("product-color")?.value || "";
  const gender = document.getElementById("product-gender")?.value || "";
  let quantity = 1;

  if (mode === "manuel") {
    quantity = parseInt(document.getElementById("product-quantity")?.value) || 1;
    if (!name || !gender || !color || quantity < 1) {
      alert("Merci de remplir les champs obligatoires.");
      return;
    }
  } else {
    if (!name || !gender) {
      alert("Merci de remplir les champs obligatoires.");
      return;
    }
  }

  // Crée chaque unité comme un produit distinct avec son propre SKU
  for (let i = 0; i < quantity; i++) {
    const id = Date.now() + Math.floor(Math.random() * 1000000); // SKU unique
    const newProduct = { id, name, size, color, gender, quantity: 1 };
    products.push(newProduct);
  }
  renderProductList();
  document.getElementById("form-container").innerHTML = "";
}

function renderProductList() {
  const grouped = {};
  for (const p of products) {
    if (!grouped[p.name]) grouped[p.name] = [];
    grouped[p.name].push(p);
  }

  const container = document.getElementById("product-list");
  container.innerHTML = "";

  for (const name in grouped) {
    const total = grouped[name].length;
    const first = grouped[name][0];
    const detailsHTML = grouped[name].map(item => `
      <div class="product-item">
        <h3>${item.name} (${item.color})</h3>
        <small>
          Taille : ${item.size} | Sexe : ${item.gender} | 
          Quantité : ${item.quantity}
          <button onclick="incrementProduct(${item.id})">+</button>
          <button onclick="decrementProduct(${item.id})">-</button>
        </small>
        <small>SKU / Code barre : <b>${item.id}</b></small>
        <div class="action-buttons">
          <button onclick="deleteProduct(${item.id})">Supprimer</button>
          <button onclick="editProduct(${item.id})">Modifier</button>
          <button onclick="showSellOptions(${item.id})">Vendre</button>
        </div>
      </div>
    `).join("");

    container.innerHTML += `
      <div class="product-item">
        <h3 onclick="toggleDetails('${name}')">${name} (Total : ${total})</h3>
        <div id="details-${name}" style="display:none;">${detailsHTML}</div>
      </div>
    `;
  }
}

function toggleDetails(name) {
  const div = document.getElementById(`details-${name}`);
  div.style.display = div.style.display === "none" ? "block" : "none";
}

function deleteProduct(id) {
  if (confirm("Supprimer cet article du stock ?")) {
    products = products.filter(p => p.id !== id);
    renderProductList();
  }
}

function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  document.getElementById("form-container").innerHTML = `
    <h3>Modifier le produit</h3>
    <input type="text" id="edit-name" value="${product.name}" placeholder="Nom du produit" />
    <input type="text" id="edit-size" value="${product.size}" placeholder="Taille" />
    <input type="text" id="edit-color" value="${product.color}" placeholder="Couleur" />
    <select id="edit-gender">
      <option value="">Sexe</option>
      <option value="Homme" ${product.gender === "Homme" ? "selected" : ""}>Homme</option>
      <option value="Femme" ${product.gender === "Femme" ? "selected" : ""}>Femme</option>
      <option value="Unisex" ${product.gender === "Unisex" ? "selected" : ""}>Unisex</option>
    </select>
    <button onclick="saveProduct(${id})">Enregistrer</button>
    <button onclick="cancelEdit()">Annuler</button>
    <p><small>SKU (non modifiable) : ${product.id}</small></p>
  `;
}

function saveProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  product.name = document.getElementById("edit-name").value;
  product.size = document.getElementById("edit-size").value;
  product.color = document.getElementById("edit-color").value;
  product.gender = document.getElementById("edit-gender").value;

  renderProductList();
  document.getElementById("form-container").innerHTML = "";
}

function cancelEdit() {
  document.getElementById("form-container").innerHTML = "";
}

// 2. Fonction pour afficher les options de vente
function showSellOptions(id) {
  document.getElementById("form-container").innerHTML = `
    <h3>Choisissez la méthode de vente</h3>
    <button onclick="sellByScan(${id})">Scan code barre / SKU</button>
    <button onclick="sellByManual(${id})">Numérisation (saisie nom)</button>
    <button onclick="sellByPhoto(${id})">Prise de photo (simulation)</button>
    <button onclick="cancelEdit()">Annuler</button>
  `;
}

// 3. Scan code barre / SKU
function sellByScan(id) {
  document.getElementById("form-container").innerHTML = `
    <h3>Scan code barre / SKU</h3>
    <input type="text" id="scan-sku" placeholder="Scanner ou saisir le code SKU" />
    <button onclick="confirmSellScan(${id})">Valider</button>
    <button onclick="cancelEdit()">Annuler</button>
  `;
}

function confirmSellScan(id) {
  const product = products.find(p => p.id === id);
  const scanSku = document.getElementById("scan-sku").value.trim();
  if (!product || scanSku !== String(product.id)) {
    alert("Code SKU incorrect.");
    return;
  }
  if (confirm(`Confirmer la vente/destockage de "${product.name}" ?`)) {
    processSell(id);
  }
}

// 4. Numérisation (saisie nom)
function sellByManual(id) {
  document.getElementById("form-container").innerHTML = `
    <h3>Numérisation (saisie nom)</h3>
    <input type="text" id="scan-name" placeholder="Saisir le nom du produit" />
    <button onclick="confirmSellManual(${id})">Valider</button>
    <button onclick="cancelEdit()">Annuler</button>
  `;
}

function confirmSellManual(id) {
  const product = products.find(p => p.id === id);
  const scanName = document.getElementById("scan-name").value.trim();
  if (!product || scanName !== product.name) {
    alert("Nom du produit incorrect.");
    return;
  }
  if (confirm(`Confirmer la vente/destockage de "${product.name}" ?`)) {
    processSell(id);
  }
}

// 5. Prise de photo (simulation)
function sellByPhoto(id) {
  document.getElementById("form-container").innerHTML = `
    <h3>Prise de photo (simulation)</h3>
    <input type="text" id="photo-name" placeholder="Nom détecté par photo" />
    <button onclick="confirmSellPhoto(${id})">Valider</button>
    <button onclick="cancelEdit()">Annuler</button>
  `;
}

function confirmSellPhoto(id) {
  const product = products.find(p => p.id === id);
  const photoName = document.getElementById("photo-name").value.trim();
  if (!product || photoName !== product.name) {
    alert("Produit non reconnu par la photo.");
    return;
  }
  if (confirm(`Confirmer la vente/destockage de "${product.name}" ?`)) {
    processSell(id);
  }
}

// 6. Fonction commune pour décrémenter la quantité ou supprimer
function processSell(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  if (product.quantity > 1) {
    product.quantity -= 1;
  } else {
    products = products.filter(p => p.id !== id);
  }
  renderProductList();
  document.getElementById("form-container").innerHTML = "";
  alert("Produit vendu/destocké avec succès !");
}

function showMultiPhotoForm() {
  document.getElementById("form-container").innerHTML = `
    <h3>Ajout par plusieurs photos</h3>
    <input type="text" id="multi-name" placeholder="Nom du produit" />
    <select id="multi-gender">
      <option value="">Sexe</option>
      <option value="Homme">Homme</option>
      <option value="Femme">Femme</option>
      <option value="Unisex">Unisex</option>
    </select>
    <button onclick="startMultiPhoto()">Commencer la prise de photos</button>
    <div id="multi-photo-list"></div>
  `;
  window.multiPhotoProducts = [];
}

function startMultiPhoto() {
  const name = document.getElementById("multi-name").value;
  const gender = document.getElementById("multi-gender").value;
  if (!name || !gender) {
    alert("Nom et sexe obligatoires !");
    return;
  }
  window.multiPhotoName = name;
  window.multiPhotoGender = gender;
  document.getElementById("form-container").innerHTML = `
    <h3>Prendre plusieurs photos pour "${name}" (${gender})</h3>
    <button onclick="addPhotoProduct()">Ajouter une photo (simulation)</button>
    <button onclick="finishMultiPhoto()">Terminer et afficher le total</button>
    <div id="multi-photo-list"></div>
  `;
  window.multiPhotoProducts = [];
  updateMultiPhotoList();
}

function addPhotoProduct() {
  // Simule la détection couleur et taille pour chaque photo
  const color = prompt("Couleur détectée (simulation) :");
  const size = prompt("Taille détectée (simulation) :");
  if (!color || !size) {
    alert("Couleur et taille obligatoires.");
    return;
  }
  window.multiPhotoProducts.push({
    name: window.multiPhotoName,
    gender: window.multiPhotoGender,
    color,
    size
  });
  updateMultiPhotoList();
}

function updateMultiPhotoList() {
  const list = window.multiPhotoProducts || [];
  let html = "<ul>";
  for (const p of list) {
    html += `<li>${p.name} | ${p.gender} | ${p.color} | ${p.size}</li>`;
  }
  html += "</ul>";
  document.getElementById("multi-photo-list").innerHTML = html;
}

function finishMultiPhoto() {
  // Regroupe par couleur et taille
  const list = window.multiPhotoProducts || [];
  const colorTotals = {};
  const sizeTotals = {};
  for (const p of list) {
    colorTotals[p.color] = (colorTotals[p.color] || 0) + 1;
    sizeTotals[p.size] = (sizeTotals[p.size] || 0) + 1;
  }
  let html = "<h4>Total par couleur :</h4><ul>";
  for (const color in colorTotals) {
    html += `<li>${color} : ${colorTotals[color]}</li>`;
  }
  html += "</ul><h4>Total par taille :</h4><ul>";
  for (const size in sizeTotals) {
    html += `<li>${size} : ${sizeTotals[size]}</li>`;
  }
  html += "</ul>";
  document.getElementById("multi-photo-list").innerHTML += html;
}

function incrementProduct(id) {
  const product = products.find(p => p.id === id);
  if (product) {
    product.quantity += 1;
    renderProductList();
  }
}

function decrementProduct(id) {
  const product = products.find(p => p.id === id);
  if (product) {
    if (product.quantity > 1) {
      product.quantity -= 1;
    } else {
      products = products.filter(p => p.id !== id);
    }
    renderProductList();
  }
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('✅ Service Worker enregistré'))
        .catch(error => console.error('❌ Erreur d’enregistrement du Service Worker:', error));
}
// Closing brace added to complete the script
}