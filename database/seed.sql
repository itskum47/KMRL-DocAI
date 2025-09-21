-- Seed data for KMRL Document Intelligence Platform

-- Insert sample users (these would normally be synced from Clerk)
INSERT INTO users (clerk_id, email, name, role, department) VALUES
('clerk_admin_001', 'admin@kmrl.com', 'System Administrator', 'admin', 'IT'),
('clerk_hr_001', 'hr.manager@kmrl.com', 'HR Manager', 'hr', 'HR'),
('clerk_eng_001', 'lead.engineer@kmrl.com', 'Lead Engineer', 'engineer', 'Engineering'),
('clerk_dir_001', 'director@kmrl.com', 'Operations Director', 'director', 'Operations'),
('clerk_staff_001', 'john.doe@kmrl.com', 'John Doe', 'staff', 'Engineering'),
('clerk_staff_002', 'jane.smith@kmrl.com', 'Jane Smith', 'staff', 'HR'),
('clerk_staff_003', 'mike.wilson@kmrl.com', 'Mike Wilson', 'staff', 'Finance');

-- Insert sample routing rules
INSERT INTO routing_rules (name, rule_json, priority, active) VALUES
('Invoice to Finance', '{"doc_type": "invoice", "target_department": "finance", "keywords": ["invoice", "payment", "billing"]}', 10, true),
('Maintenance to Engineering', '{"doc_type": "maintenance", "target_department": "engineering", "keywords": ["maintenance", "repair", "technical"]}', 10, true),
('HR Circular to HR', '{"doc_type": "circular", "target_department": "hr", "keywords": ["policy", "training", "safety", "employee"]}', 10, true),
('Safety Reports to HR', '{"keywords": ["safety", "incident", "accident"], "target_department": "hr"}', 8, true),
('Purchase Orders to Finance', '{"keywords": ["purchase", "po", "vendor"], "target_department": "finance"}', 8, true);

-- Insert sample documents
INSERT INTO documents (
    uploader_id, 
    file_s3_key, 
    file_name, 
    doc_type, 
    language, 
    status, 
    ocr_text, 
    summary_text, 
    summary_bilingual,
    metadata,
    department_suggested,
    department_assigned,
    processing_metadata
) VALUES
(
    (SELECT id FROM users WHERE email = 'john.doe@kmrl.com'),
    'documents/2024/01/maintenance-report-001.pdf',
    'Monthly Maintenance Report - January 2024.pdf',
    'maintenance',
    'english',
    'processed',
    'Monthly maintenance report for Train Unit 001. Routine inspection completed on 15th January 2024. All systems operational. Minor brake adjustment required by 30th January 2024.',
    'Monthly maintenance report for Train Unit 001 showing all systems operational with minor brake adjustment needed by January 30th.',
    '{"english": "Monthly maintenance report for Train Unit 001 showing all systems operational with minor brake adjustment needed by January 30th.", "malayalam": "ട്രെയിൻ യൂണിറ്റ് 001-നുള്ള മാസിക മെയിന്റനൻസ് റിപ്പോർട്ട്"}',
    '{"train_number": "001", "inspection_date": "2024-01-15", "next_maintenance": "2024-01-30", "status": "operational"}',
    'engineering',
    'engineering',
    '{"model_versions": {"ocr": "tesseract-5.0", "summarizer": "facebook/bart-large-cnn"}, "confidence_scores": {"ocr": 0.95, "department_classification": 0.92}}'
),
(
    (SELECT id FROM users WHERE email = 'hr.manager@kmrl.com'),
    'documents/2024/01/safety-circular-001.pdf',
    'Safety Training Circular - Q1 2024.pdf',
    'circular',
    'english',
    'processed',
    'All employees must complete mandatory safety training by March 31st, 2024. Training covers emergency procedures, workplace safety, and compliance requirements. Acknowledgment required.',
    'Mandatory safety training circular requiring all employees to complete training and acknowledge by March 31st, 2024.',
    '{"english": "Mandatory safety training circular requiring all employees to complete training and acknowledge by March 31st, 2024.", "malayalam": "എല്ലാ ജീവനക്കാരും മാർച്ച് 31, 2024-നകം സുരക്ഷാ പരിശീലനം പൂർത്തിയാക്കണം"}',
    '{"deadline": "2024-03-31", "type": "mandatory", "department": "all", "compliance_required": true}',
    'hr',
    'hr',
    '{"model_versions": {"ocr": "tesseract-5.0", "summarizer": "facebook/bart-large-cnn"}, "confidence_scores": {"ocr": 0.98, "department_classification": 0.95}}'
),
(
    (SELECT id FROM users WHERE email = 'jane.smith@kmrl.com'),
    'documents/2024/01/invoice-vendor-001.pdf',
    'Invoice - Electrical Components - INV-2024-001.pdf',
    'invoice',
    'english',
    'processed',
    'Invoice INV-2024-001 from ABC Electrical Supplies. Amount: ₹45,000. Purchase Order: PO-2024-001. Payment due by February 15th, 2024.',
    'Invoice for electrical components worth ₹45,000 with payment due February 15th, 2024.',
    '{"english": "Invoice for electrical components worth ₹45,000 with payment due February 15th, 2024.", "malayalam": "ഫെബ്രുവരി 15, 2024-നകം അടയ്ക്കേണ്ട ₹45,000 വിലയുള്ള ഇലക്ട്രിക്കൽ ഘടകങ്ങളുടെ ഇൻവോയ്സ്"}',
    '{"invoice_number": "INV-2024-001", "po_number": "PO-2024-001", "amount": "45000", "vendor": "ABC Electrical Supplies", "due_date": "2024-02-15"}',
    'finance',
    'finance',
    '{"model_versions": {"ocr": "tesseract-5.0", "summarizer": "facebook/bart-large-cnn"}, "confidence_scores": {"ocr": 0.97, "department_classification": 0.89}}'
);

-- Insert sample tasks
INSERT INTO tasks (
    document_id,
    title,
    description,
    assigned_to,
    assigned_department,
    due_date,
    status
) VALUES
(
    (SELECT id FROM documents WHERE file_name LIKE '%Maintenance Report%'),
    'Brake Adjustment Required',
    'Complete brake adjustment for Train Unit 001 as identified in monthly maintenance report.',
    (SELECT id FROM users WHERE email = 'john.doe@kmrl.com'),
    'engineering',
    '2024-01-30 23:59:59',
    'pending'
),
(
    (SELECT id FROM documents WHERE file_name LIKE '%Safety Training%'),
    'Safety Training Acknowledgment',
    'All employees must acknowledge completion of mandatory safety training by March 31st, 2024.',
    NULL,
    'hr',
    '2024-03-31 23:59:59',
    'pending'
),
(
    (SELECT id FROM documents WHERE file_name LIKE '%Invoice%'),
    'Process Payment',
    'Process payment for Invoice INV-2024-001 (₹45,000) due February 15th, 2024.',
    (SELECT id FROM users WHERE email = 'mike.wilson@kmrl.com'),
    'finance',
    '2024-02-15 23:59:59',
    'pending'
);

-- Insert sample audit logs
INSERT INTO audit_logs (actor_id, action_type, payload) VALUES
(
    (SELECT id FROM users WHERE email = 'admin@kmrl.com'),
    'user_role_changed',
    '{"user_id": "clerk_eng_001", "old_role": "staff", "new_role": "engineer", "timestamp": "2024-01-15T10:30:00Z"}'
),
(
    (SELECT id FROM users WHERE email = 'hr.manager@kmrl.com'),
    'document_uploaded',
    '{"document_id": "safety-circular-001", "file_name": "Safety Training Circular - Q1 2024.pdf", "timestamp": "2024-01-16T09:15:00Z"}'
),
(
    (SELECT id FROM users WHERE email = 'admin@kmrl.com'),
    'document_reprocessed',
    '{"document_id": "maintenance-report-001", "reason": "Updated AI model", "timestamp": "2024-01-17T14:20:00Z"}'
);