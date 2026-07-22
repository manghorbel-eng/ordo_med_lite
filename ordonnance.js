let session;
let medications = [];

async function init() {
    session = await checkAuth();
    await loadSettings();
    updatePreview();
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
        
        document.getElementById('set-date-y').value = settings.date_position_y;
        document.getElementById('set-patient-y').value = settings.patient_position_y;
        document.getElementById('set-apci-y').value = settings.apci_position_y;
        document.getElementById('set-meds-y').value = settings.medications_position_y;
    }
}

document.getElementById('save-settings-btn').addEventListener('click', async () => {
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
        });
        
    if (!error) alert('Réglages enregistrés !');
});

// Update Preview
function updatePreview() {
    const dateDiv = document.getElementById('preview-date');
    const patientDiv = document.getElementById('preview-patient');
    const apciDiv = document.getElementById('preview-apci');
    const medsDiv = document.getElementById('preview-meds');

    dateDiv.style.top = `${settings.date_position_y}cm`;
    patientDiv.style.top = `${settings.patient_position_y}cm`;
    apciDiv.style.top = `${settings.apci_position_y}cm`;
    medsDiv.style.top = `${settings.medications_position_y}cm`;

    dateDiv.textContent = `Le ${new Date().toLocaleDateString('fr-FR')}`;
    patientDiv.textContent = document.getElementById('patient-name').value;
    
    const apci = document.getElementById('code-apci').value;
    apciDiv.textContent = apci ? `Code APCI: ${apci}` : '';

    medsDiv.innerHTML = medications.map(m => `
        <div style="margin-bottom: 0.5cm;">
            <strong>${m.name}</strong><br>
            <span style="font-size: 0.9em;">${m.posologie}</span>
        </div>
    `).join('');
}

['patient-name', 'code-apci'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
});

// Add Medication
document.getElementById('add-med-btn').addEventListener('click', () => {
    const name = document.getElementById('med-name').value;
    const poso = document.getElementById('med-posologie').value;
    if (!name) return;

    medications.push({ name, posologie: poso });
    
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `${name} <small class="text-muted">${poso}</small>`;
    document.getElementById('med-list').appendChild(li);

    document.getElementById('med-name').value = '';
    document.getElementById('med-posologie').value = '';
    
    updatePreview();
});

// Save and Print
document.getElementById('save-print-btn').addEventListener('click', async () => {
    const patientName = document.getElementById('patient-name').value;
    if (!patientName) return alert('Nom du patient requis.');

    // 1. Create/Find Patient (Simplified)
    const { data: patientData } = await supabase
        .from('patients')
        .insert({ user_id: session.user.id, patient_name: patientName })
        .select()
        .single();

    // 2. Create Ordonnance
    const { data: ordoData } = await supabase
        .from('ordonnances')
        .insert({
            user_id: session.user.id,
            patient_id: patientData.id,
            code_apci: document.getElementById('code-apci').value
        })
        .select()
        .single();

    // 3. Insert Items
    if (medications.length > 0) {
        const itemsToInsert = medications.map(m => ({
            ordonnance_id: ordoData.id,
            medicament_name: m.name,
            posologie: m.posologie
        }));
        await supabase.from('ordonnance_items').insert(itemsToInsert);
    }

    // Print
    window.print();
});

init();
