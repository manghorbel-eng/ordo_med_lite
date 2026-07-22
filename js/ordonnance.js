import { supabase, checkAuth } from './app.js';

let session;

// Paramètres par défaut (position d'impression)
let settings = {
    date_position_y: 4.5,
    patient_position_y: 5.5,
    apci_position_y: 6.5,
    medications_position_y: 7.5
};

async function init() {
    session = await checkAuth();
    if (session) {
        await loadSettings();
        setDefaultDate();
        addMedRow(); // première ligne médicament vide
        updatePreview();
    }
}

// --- Date de l'ordonnance : aujourd'hui par défaut ---
function setDefaultDate() {
    const ordoDateInput = document.getElementById('ordo-date');
    if (ordoDateInput && !ordoDateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        ordoDateInput.value = `${yyyy}-${mm}-${dd}`;
    }
}

// --- Réglages d'impression ---
async function loadSettings() {
    const { data } = await supabase
        .from('ordonnance_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

    if (data) {
        settings.date_position_y = data.date_position_y;
        settings.patient_position_y = data.patient_position_y;
        settings.apci_position_y = data.apci_position_y;
        settings.medications_position_y = data.medications_position_y;

        document.getElementById('set-date-y').value = settings.date_position_y;
        document.getElementById('set-patient-y').value = settings.patient_position_y;
        document.getElementById('set-apci-y').value = settings.apci_position_y;
        document.getElementById('set-meds-y').value = settings.medications_position_y;
    }
}

const saveSettingsBtn = document.getElementById('save-settings-btn');
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
        settings.date_position_y = parseFloat(document.getElementById('set-date-y').value);
        settings.patient_position_y = parseFloat(document.getElementById('set-patient-y').value);
        settings.apci_position_y = parseFloat(document.getElementById('set-apci-y').value);
        settings.medications_position_y = parseFloat(document.getElementById('set-meds-y').value);

        updatePreview();

        const { error } = await supabase
            .from('ordonnance_settings')
            .upsert({
                user_id: session.user.id,
                ...settings,
                updated_at: new Date()
            }, { onConflict: 'user_id' });

        if (!error) alert('Réglages enregistrés !');
    });
}

// --- Lignes médicaments dynamiques ---
const medRowsContainer = document.getElementById('med-rows');
const medRowTemplate = document.getElementById('med-row-template');

function addMedRow() {
    const clone = medRowTemplate.content.cloneNode(true);
    const row = clone.querySelector('.med-row');

    const nameInput = row.querySelector('.med-name');
    const posoInput = row.querySelector('.med-posologie');
    const removeBtn = row.querySelector('.btn-remove-med');

    nameInput.addEventListener('input', () => {
        maybeAddNewRow(row);
        updatePreview();
    });
    posoInput.addEventListener('input', updatePreview);

    removeBtn.addEventListener('click', () => {
        const allRows = medRowsContainer.querySelectorAll('.med-row');
        if (allRows.length > 1) {
            row.remove();
        } else {
            // Dernière ligne : on la vide plutôt que de la supprimer
            nameInput.value = '';
            posoInput.value = '';
        }
        updatePreview();
    });

    medRowsContainer.appendChild(row);
}

// Ajoute une nouvelle ligne vide dès qu'on commence à taper dans la dernière ligne
function maybeAddNewRow(currentRow) {
    const allRows = medRowsContainer.querySelectorAll('.med-row');
    const isLastRow = currentRow === allRows[allRows.length - 1];
    const nameInput = currentRow.querySelector('.med-name');

    if (isLastRow && nameInput.value.trim() !== '') {
        addMedRow();
    }
}

function getMedications() {
    const rows = medRowsContainer.querySelectorAll('.med-row');
    const meds = [];
    rows.forEach(row => {
        const name = row.querySelector('.med-name').value.trim();
        const poso = row.querySelector('.med-posologie').value.trim();
        if (name) {
            meds.push({ name, posologie: poso });
        }
    });
    return meds;
}

// --- Aperçu ---
function updatePreview() {
    const dateDiv = document.getElementById('preview-date');
    const patientDiv = document.getElementById('preview-patient');
    const apciDiv = document.getElementById('preview-apci');
    const medsDiv = document.getElementById('preview-meds');

    if (!dateDiv) return;

    dateDiv.style.top = `${settings.date_position_y}cm`;
    patientDiv.style.top = `${settings.patient_position_y}cm`;
    apciDiv.style.top = `${settings.apci_position_y}cm`;
    medsDiv.style.top = `${settings.medications_position_y}cm`;

    const ordoDateInput = document.getElementById('ordo-date');
    if (ordoDateInput && ordoDateInput.value) {
        const [y, m, d] = ordoDateInput.value.split('-');
        dateDiv.textContent = `${d}/${m}/${y}`;
    } else {
        dateDiv.textContent = new Date().toLocaleDateString('fr-FR');
    }

    patientDiv.textContent = document.getElementById('patient-name').value;

    const apci = document.getElementById('code-apci').value;
    apciDiv.textContent = apci ? `Code APCI : ${apci}` : '';

    medsDiv.innerHTML = getMedications().map(m => `
        <div style="margin-bottom: 0.5cm; display:flex; gap:2em;">
            <strong>${m.name}</strong>
            <span style="font-size: 0.9em; font-weight:normal;">${m.posologie}</span>
        </div>
    `).join('');
}

['patient-name', 'code-apci', 'ordo-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
});

// --- Imprimer puis sauvegarder ---
const savePrintBtn = document.getElementById('save-print-btn');
if (savePrintBtn) {
    savePrintBtn.addEventListener('click', async () => {
        const patientName = document.getElementById('patient-name').value.trim();
        if (!patientName) return alert('Nom du patient requis.');

        updatePreview();

        // 1. Impression déclenchée en priorité (ne dépend jamais de la base de données)
        window.print();

        // 2. Sauvegarde en base de données ensuite, en arrière-plan
        try {
            await saveOrdonnance(patientName);
        } catch (err) {
            console.error('Erreur lors de la sauvegarde en base de données :', err);
        }
    });
}

async function saveOrdonnance(patientName) {
    const codeApci = document.getElementById('code-apci').value;
    const ordoDateInput = document.getElementById('ordo-date');
    const dateOrdonnance = ordoDateInput && ordoDateInput.value
        ? new Date(ordoDateInput.value)
        : new Date();
    const medications = getMedications();

    // 1. Chercher si le patient existe déjà
    let patientId;
    const { data: existingPatients, error: findError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('patient_name', patientName)
        .limit(1);

    if (findError) throw findError;

    if (existingPatients && existingPatients.length > 0) {
        patientId = existingPatients[0].id;
    } else {
        const { data: newPatient, error: insertPatientError } = await supabase
            .from('patients')
            .insert({ user_id: session.user.id, patient_name: patientName })
            .select()
            .single();
        if (insertPatientError) throw insertPatientError;
        patientId = newPatient.id;
    }

    // 2. Créer l'ordonnance
    const { data: ordoData, error: ordoError } = await supabase
        .from('ordonnances')
        .insert({
            user_id: session.user.id,
            patient_id: patientId,
            code_apci: codeApci,
            date_ordonnance: dateOrdonnance
        })
        .select()
        .single();
    if (ordoError) throw ordoError;

    // 3. Insérer les médicaments
    if (medications.length > 0) {
        const itemsToInsert = medications.map(m => ({
            ordonnance_id: ordoData.id,
            medicament_name: m.name,
            posologie: m.posologie
        }));
        const { error: itemsError } = await supabase.from('ordonnance_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
    }
}

init();
