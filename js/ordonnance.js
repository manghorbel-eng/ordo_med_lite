import { supabase, checkAuth } from './app.js';

let session;
let medications = [];

async function init() {
    session = await checkAuth();
    if (session) {
        await loadSettings();
        updatePreview();
    }
}

// Paramètres par défaut
let settings = {
    date_position_y: 4.5,
    patient_position_y: 5.5,
    apci_position_y: 6.5,
    medications_position_y: 7.5
};

async function loadSettings() {
    const { data, error } = await supabase
        .from('ordonnance_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
    if (data) {
        settings.date_position_y = data.date_position_y;
        settings.patient_position_y = data.patient_position_y;
        settings.apci_position_y = data.apci_position_y;
        settings.medications_position_y = data.medications_position_y;
        
        document.getElementById('date_position_y').value = settings.date_position_y;
        document.getElementById('patient_position_y').value = settings.patient_position_y;
        document.getElementById('apci_position_y').value = settings.apci_position_y;
        document.getElementById('medications_position_y').value = settings.medications_position_y;
    }
}

const settingsForm = document.getElementById('ordonnance-settings-form');
if (settingsForm) {
    saveSettingsBtn.addEventListener('click', async () => {
        settings.date_position_y = parseFloat(document.getElementById('date_position_y').value);
        settings.patient_position_y = parseFloat(document.getElementById('patient_position_y').value);
        settings.apci_position_y = parseFloat(document.getElementById('apci_position_y').value);
        settings.medications_position_y = parseFloat(document.getElementById('medications_position_y').value);
        
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

// Update Preview
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
    if(ordoDateInput && ordoDateInput.value) {
        const d = new Date(ordoDateInput.value);
        dateDiv.textContent = d.toLocaleDateString('fr-FR');
    } else {
        dateDiv.textContent = `${new Date().toLocaleDateString('fr-FR')}`;
    }

    patientDiv.textContent = document.getElementById('patient-name').value;
    
    
    const ordoDateInput = document.getElementById('ordo-date');
    if (ordoDateInput) ordoDateInput.addEventListener('input', updatePreview);
    
    const apci = document.getElementById('code-apci').value;

    apciDiv.textContent = apci ? `Code APCI : ${apci}` : '';

    medsDiv.innerHTML = medications.map(m => `
        <div style="margin-bottom: 0.5cm; display:flex; gap:2em;">
            <strong>${m.name}</strong>
            <span style="font-size: 0.9em; font-weight:normal;">${m.posologie}</span>
        </div>
    `).join('');
}

['patient-name', 'code-apci'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
});

// Add Medication
const addMedBtn = document.getElementById('add-med-btn');
if (addMedBtn) {
    addMedBtn.addEventListener('click', () => {
        const name = document.getElementById('med-name').value;
        const poso = document.getElementById('med-posologie').value;
        if (!name) return;

        medications.push({ name, posologie: poso });
        
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center py-2';
        li.innerHTML = `<div><strong>${name}</strong> <span class="text-muted ms-2">${poso}</span></div>`;
        document.getElementById('med-list').appendChild(li);

        document.getElementById('med-name').value = '';
        document.getElementById('med-posologie').value = '';
        
        updatePreview();
    });
}

// Save and Print
const savePrintBtn = document.getElementById('save-print-btn');
if (savePrintBtn) {
    savePrintBtn.addEventListener('click', async () => {
        const patientName = document.getElementById('patient-name').value;
        if (!patientName) return alert('Nom du patient requis.');

        // 1. Chercher si le patient existe (non supprimé)
        let patientId;
        const { data: existingPatients } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('patient_name', patientName)
            .eq('is_deleted', false)
            .limit(1);

        if (existingPatients && existingPatients.length > 0) {
            patientId = existingPatients[0].id;
        } else {
            // Sinon le créer
            const { data: newPatient } = await supabase
                .from('patients')
                .insert({ user_id: session.user.id, patient_name: patientName, is_deleted: false })
                .select()
                .single();
            patientId = newPatient.id;
        }

        // 2. Créer l'Ordonnance
        const { data: ordoData } = await supabase
            .from('ordonnances')
            .insert({
                user_id: session.user.id,
                patient_id: patientId,
                code_apci: document.getElementById('code-apci').value,
                is_deleted: false
            })
            .select()
            .single();

        // 3. Insérer les items
        if (medications.length > 0) {
            const itemsToInsert = medications.map(m => ({
                ordonnance_id: ordoData.id,
                medicament_name: m.name,
                posologie: m.posologie,
                is_deleted: false
            }));
            await supabase.from('ordonnance_items').insert(itemsToInsert);
        }

        // Lancer l'impression
        window.print();
    });
}

init();
