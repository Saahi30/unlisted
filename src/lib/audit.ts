import { supabase } from './supabase';

export interface AuditEntry {
    entityType: 'order' | 'lead' | 'demat_request' | 'ticket';
    entityId: string;
    action: 'status_change' | 'assignment' | 'escalation' | 'note_added' | 'commission_approved' | 'file_uploaded';
    oldValue?: string;
    newValue?: string;
    performedBy?: string;
    performedByName?: string;
    performedByRole?: string;
    metadata?: Record<string, any>;
}

export async function logAudit(entry: AuditEntry) {
    await supabase.from('audit_log').insert([{
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        action: entry.action,
        old_value: entry.oldValue || null,
        new_value: entry.newValue || null,
        performed_by: entry.performedBy || null,
        performed_by_name: entry.performedByName || null,
        performed_by_role: entry.performedByRole || null,
        metadata: entry.metadata || {}
    }]);
}
