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
    if (!window.supabaseClient) return;
    const { data, error } = await window.supabaseClient
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

if (document.getElementById('save-settings-btn')) {
    document.getElementById('save-settings-btn').addEventListener('click', async () => {
        settings.date_position_y = parseFloat(document.getElementById('set-date-y').value);
        settings.patient_position_y = parseFloat(document.getElementById('set-patient-y').value);
        settings.apci_position_y = parseFloat(document.getElementById('set-apci-y').value);
        settings.medications_position_y = parseFloat(document.getElementById('set-meds-y').value);
        
        updatePreview();

        if (window.supabaseClient) {
            const { error } = await window.supabaseClient
                .from('ordonnance_settings')
                .upsert({
                    user_id: session.user.id,
                    ...settings,
                    updated_at: new Date()
                }, { onConflict: 'user_id' });
                
            if (!error) alert('Réglages enregistrés !');
        }
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

    dateDiv.textContent = `${new Date().toLocaleDateString('fr-FR')}`;
    patientDiv.textContent = document.getElementById('patient-name').value;
    
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
if (document.getElementById('add-med-btn')) {
    document.getElementById('add-med-btn').addEventListener('click', () => {
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
if (document.getElementById('save-print-btn')) {
    document.getElementById('save-print-btn').addEventListener('click', async () => {
        const patientName = document.getElementById('patient-name').value;
        if (!patientName) return alert('Nom du patient requis.');

        if (!window.supabaseClient) {
            window.print();
            return;
        }

        // 1. Chercher si le patient existe (non supprimé)
        let patientId;
        const { data: existingPatients } = await window.supabaseClient
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
            const { data: newPatient } = await window.supabaseClient
                .from('patients')
                .insert({ user_id: session.user.id, patient_name: patientName, is_deleted: false })
                .select()
                .single();
            patientId = newPatient.id;
        }

        // 2. Créer l'Ordonnance
        const { data: ordoData } = await window.supabaseClient
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
            await window.supabaseClient.from('ordonnance_items').insert(itemsToInsert);
        }

        // Lancer l'impression
        window.print();
    });
}

init();
