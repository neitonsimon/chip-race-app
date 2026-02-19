
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvipogwhdpszyfcoveic.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aXBvZ3doZHBzenlmY292ZWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTE5MjEsImV4cCI6MjA4Njk2NzkyMX0.WUcnFyCIJ3APDV_bg44y7R13m31aU_0OKfAqNvcR_nc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    const timestamp = Date.now();
    const email = `test.user.${timestamp}@example.com`;
    const password = 'testpassword123';
    const name = `Test User ${timestamp}`;

    console.log(`1. Attempting to Sign Up: ${email}`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                avatar_url: 'https://via.placeholder.com/150'
            }
        }
    });

    if (signUpError) {
        console.error('❌ Sign Up Failed:', signUpError.message);
        return;
    }

    const userId = signUpData.user?.id;
    console.log('✅ Sign Up Successful. User ID:', userId);

    if (!userId) {
        console.error('❌ No user ID returned.');
        return;
    }

    // Initial wait for trigger
    console.log('2. Waiting for Database Trigger (2 seconds)...');
    await new Promise(r => setTimeout(r, 2000));

    console.log('3. Verifying Profile Creation in DB...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('❌ Profile check failed:', profileError.message);
    } else if (profile) {
        console.log('✅ Profile found in database!');
        console.log('   - Name:', profile.name);
        console.log('   - Role:', profile.role);

        if (profile.name === name) {
            console.log('✅ Name matches metadata.');
        } else {
            console.error('❌ Name mismatch. Expected:', name, 'Got:', profile.name);
        }
    } else {
        console.error('❌ Profile not found (Trigger might have failed).');
    }

    // Attempt login
    console.log('4. Attempting Login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('❌ Login Failed:', loginError.message);
    } else {
        console.log('✅ Login Successful. Session established.');
    }
}

testAuth();
