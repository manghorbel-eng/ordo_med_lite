-- Supabase Free Plan DDL (Architecture PostgreSQL)

-- 1. Table Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table Ordonnances
CREATE TABLE ordonnances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    code_apci TEXT,
    date_ordonnance TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table Ordonnance_Items (Médicaments)
CREATE TABLE ordonnance_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ordonnance_id UUID REFERENCES ordonnances(id) ON DELETE CASCADE,
    medicament_name TEXT NOT NULL,
    posologie TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table Settings (Paramétrage de l'ordonnance)
CREATE TABLE ordonnance_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    margin_top NUMERIC DEFAULT 0,
    margin_right NUMERIC DEFAULT 1,
    margin_bottom NUMERIC DEFAULT 0,
    margin_left NUMERIC DEFAULT 1,
    date_position_y NUMERIC DEFAULT 4.5,
    patient_position_y NUMERIC DEFAULT 5.5,
    apci_position_y NUMERIC DEFAULT 6.5,
    medications_position_y NUMERIC DEFAULT 7.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Protection des données par utilisateur
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own patients" ON patients FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ordonnances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own ordonnances" ON ordonnances FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ordonnance_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage items of their ordonnances" ON ordonnance_items FOR ALL USING (
    EXISTS (SELECT 1 FROM ordonnances WHERE ordonnances.id = ordonnance_items.ordonnance_id AND ordonnances.user_id = auth.uid())
);

ALTER TABLE ordonnance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own settings" ON ordonnance_settings FOR ALL USING (auth.uid() = user_id);
