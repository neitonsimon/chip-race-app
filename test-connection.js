
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvipogwhdpszyfcoveic.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aXBvZ3doZHBzenlmY292ZWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTE5MjEsImV4cCI6MjA4Njk2NzkyMX0.WUcnFyCIJ3APDV_bg44y7R13m31aU_0OKfAqNvcR_nc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('events').select('*').limit(1);

        if (error) {
            console.error('Connection failed:', error.message);
        } else {
            console.log('Connection successful! Query executed.');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

test();
