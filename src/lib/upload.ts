import { supabase } from './supabase';

export async function uploadPaymentProof(file: File, orderId: string): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `orders/${orderId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Upload error:', error);
        return null;
    }

    // Return the path — we'll generate signed URLs when viewing
    return path;
}

export async function getProofUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(path, 3600); // 1 hour

    if (error) return null;
    return data.signedUrl;
}
