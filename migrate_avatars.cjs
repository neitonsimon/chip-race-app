const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvipogwhdpszyfcoveic.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aXBvZ3doZHBzenlmY292ZWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTE5MjEsImV4cCI6MjA4Njk2NzkyMX0.WUcnFyCIJ3APDV_bg44y7R13m31aU_0OKfAqNvcR_nc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Fetching profiles with base64 avatars...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .like('avatar_url', 'data:image%');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Found ${profiles.length} profiles to migrate.`);

    for (const profile of profiles) {
        try {
            console.log(`Migrating avatar for profile ${profile.id}...`);
            const base64Data = profile.avatar_url;
            
            // Extract mime type and base64 string
            const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                console.error(`Invalid base64 data for profile ${profile.id}`);
                continue;
            }
            
            const type = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const fileExt = type.split('/')[1] || 'jpg';
            const fileName = `${profile.id}/avatar/${Date.now()}.${fileExt}`;

            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, buffer, { 
                    upsert: true,
                    contentType: type
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(data.path);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            console.log(`Successfully migrated avatar for profile ${profile.id} to ${publicUrl}`);
        } catch (err) {
            console.error(`Failed to migrate profile ${profile.id}:`, err);
        }
    }
    
    console.log('Fetching gallery images...');
    // Gallery is an array of strings in the DB
    const { data: galleryProfiles, error: gError } = await supabase
        .from('profiles')
        .select('id, gallery')
        .not('gallery', 'is', null);
        
    if (gError) {
        console.error('Error fetching galleries:', gError);
    } else {
        for (const profile of galleryProfiles) {
            if (!profile.gallery || !Array.isArray(profile.gallery)) continue;
            
            let updated = false;
            const newGallery = await Promise.all(profile.gallery.map(async (img) => {
                if (img && img.startsWith('data:image')) {
                    try {
                        console.log(`Migrating gallery image for profile ${profile.id}...`);
                        const matches = img.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                        if (!matches) return img;
                        
                        const type = matches[1];
                        const buffer = Buffer.from(matches[2], 'base64');
                        const fileExt = type.split('/')[1] || 'jpg';
                        const fileName = `${profile.id}/gallery/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                        const { data, error: uploadError } = await supabase.storage
                            .from('avatars')
                            .upload(fileName, buffer, { 
                                upsert: true,
                                contentType: type
                            });

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(data.path);
                            
                        updated = true;
                        return publicUrl;
                    } catch (err) {
                        console.error('Failed gallery upload:', err);
                        return img;
                    }
                }
                return img;
            }));
            
            if (updated) {
                await supabase.from('profiles').update({ gallery: newGallery }).eq('id', profile.id);
                console.log(`Updated gallery for profile ${profile.id}`);
            }
        }
    }
    
    console.log('Migration complete!');
}

migrate();
