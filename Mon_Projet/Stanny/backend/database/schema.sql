-- Schema pour STATCOM SERVICES
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    bio TEXT,
    phone VARCHAR(50),
    location VARCHAR(255),
    language VARCHAR(50) DEFAULT 'fr',
    dark_mode BOOLEAN DEFAULT FALSE,
    newsletter BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure newer user fields exist on already-created databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'fr';
ALTER TABLE users ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    phone_secondary VARCHAR(50),
    fax VARCHAR(50),
    website VARCHAR(255),
    social VARCHAR(255),
    address TEXT,
    status VARCHAR(50) DEFAULT 'Actif',
    industry VARCHAR(100),
    position VARCHAR(100),
    type VARCHAR(50),
    source VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client_id INTEGER REFERENCES clients(id),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subprojects (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    subproject_id INTEGER REFERENCES subprojects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Courant Alternatif' ou 'Courant Électrique'
    rubriques JSONB, -- Stocke les rubriques sélectionnées
    start_date DATE,
    end_date DATE,
    employees JSONB, -- Liste des IDs des employés
    description TEXT,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS caisse (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'entrée' or 'sortie'
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL, -- 'EUR' or 'XAF'
    category VARCHAR(100),
    motif TEXT,
    date DATE DEFAULT CURRENT_DATE,
    project_id INTEGER REFERENCES projects(id),
    subproject_id INTEGER REFERENCES subprojects(id),
    beneficiary_id INTEGER REFERENCES employees(id),
    beneficiary_name VARCHAR(255),
    payment_method VARCHAR(50),
    reference VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Validé',
    employees JSONB, -- Pour les sorties (s'il y a plusieurs bénéficiaires)
    decharge_data JSONB, -- Données de la décharge associée
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'devis', 'facture', 'fiche_fin_travaux'
    client_id INTEGER REFERENCES clients(id),
    subproject_id INTEGER REFERENCES subprojects(id),
    number VARCHAR(50) UNIQUE, -- ex: N°021/IT0323
    object TEXT,
    items JSONB, -- Array of objects: { designation, qty, pu, total }
    tva DECIMAL(5, 2) DEFAULT 0,
    centime_additionnel DECIMAL(5, 2) DEFAULT 0,
    remise DECIMAL(5, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2),
    total_in_words VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'XAF',
    start_date DATE,
    end_date DATE,
    date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'converted', 'paid'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure newer document fields exist on already-created databases
ALTER TABLE documents ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS responsible_tech VARCHAR(255);

CREATE TABLE IF NOT EXISTS fiche_fin_travaux (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    subproject_id INTEGER REFERENCES subprojects(id),
    actions JSONB, -- Array of objects: { action, observation }
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    key VARCHAR(255) NOT NULL,
    value TEXT,
    UNIQUE(user_id, key)
);

-- Colonnes manquantes pour projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'En cours';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'Moyenne';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assignees JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Contrainte unique manquante pour subprojects (nécessaire pour ON CONFLICT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subprojects_project_id_name_key'
    ) THEN
        ALTER TABLE subprojects ADD CONSTRAINT subprojects_project_id_name_key UNIQUE (project_id, name);
    END IF;
END $$;

-- Colonnes manquantes pour tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;