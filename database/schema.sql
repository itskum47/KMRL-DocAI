-- KMRL Document Intelligence Database Schema
-- Supabase/PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (synced with Clerk)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'hr', 'engineer', 'director', 'staff')),
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES users(id),
    file_s3_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    doc_type TEXT, -- invoice, maintenance, circular, minutes, vendor
    language TEXT DEFAULT 'english',
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'failed')),
    ocr_text TEXT,
    summary_text TEXT,
    summary_bilingual JSONB,
    metadata JSONB, -- invoice_number, PO_number, train_number, amount, deadline, etc
    department_suggested TEXT,
    department_assigned TEXT,
    processing_metadata JSONB, -- model versions, confidence scores, timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table (compliance & action items)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    assigned_department TEXT,
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'closed')),
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routing rules table
CREATE TABLE routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rule_json JSONB NOT NULL, -- rule definition or model reference
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_documents_uploader ON documents(uploader_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_department ON documents(department_assigned);
CREATE INDEX idx_documents_upload_date ON documents(upload_date);
CREATE INDEX idx_documents_doc_type ON documents(doc_type);

CREATE INDEX idx_tasks_document ON tasks(document_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_department ON tasks(assigned_department);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);

-- Full-text search indexes
CREATE INDEX idx_documents_search ON documents USING gin(to_tsvector('english', coalesce(summary_text, '') || ' ' || coalesce(ocr_text, '') || ' ' || coalesce(file_name, '')));
CREATE INDEX idx_documents_trigram ON documents USING gin(file_name gin_trgm_ops);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.clerk_id = auth.jwt() ->> 'sub' 
            AND u.role = 'admin'
        )
    );

-- Document access policies
CREATE POLICY "Users can view documents in their department" ON documents
    FOR SELECT USING (
        department_assigned IN (
            SELECT department FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
        OR uploader_id IN (
            SELECT id FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.clerk_id = auth.jwt() ->> 'sub' 
            AND u.role IN ('admin', 'director')
        )
    );

-- Users can upload documents
CREATE POLICY "Users can insert documents" ON documents
    FOR INSERT WITH CHECK (
        uploader_id IN (
            SELECT id FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Task access policies
CREATE POLICY "Users can view assigned tasks" ON tasks
    FOR SELECT USING (
        assigned_to IN (
            SELECT id FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
        OR assigned_department IN (
            SELECT department FROM users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.clerk_id = auth.jwt() ->> 'sub' 
            AND u.role IN ('admin', 'director')
        )
    );

-- Audit log policies (admin only)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.clerk_id = auth.jwt() ->> 'sub' 
            AND u.role = 'admin'
        )
    );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
    p_actor_id UUID,
    p_action_type TEXT,
    p_payload JSONB
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (actor_id, action_type, payload)
    VALUES (p_actor_id, p_action_type, p_payload)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;