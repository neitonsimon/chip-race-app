import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { TournamentCategory } from '../../types';
import appConfig from '../../src/config/appConfig.json';

interface RoadmapMilestone {
    id?: string;
    version: string;
    title: string;
    date: string;
    status: 'completed' | 'current' | 'upcoming';
    topics: string[];
    display_order: number;
}

interface ContentDB {
    hero: {
        title_line1: string;
        title_line2_prefix: string;
        subtitle: string;
        btn_details: string;
    };
    details: {
        header_title: string;
        header_subtitle: string;
        concept_title: string;
        concept_desc: string;
        plus_title: string;
        plus_desc: string;
        ways_title: string;
    };
    faq: { question: string; answer: string }[];
}

interface Month {
    name: string;
    qualifiers: number | string;
    prize: string;
    status: 'active' | 'completed' | 'locked';
}

export const SettingsTab: React.FC = () => {
    // Roadmap State
    const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
    const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
    const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null);
    const [roadmapFormData, setRoadmapFormData] = useState<RoadmapMilestone>({
        version: '',
        title: '',
        date: '',
        status: 'upcoming',
        topics: [],
        display_order: 0
    });
    const [topicInput, setTopicInput] = useState('');

    // Content DB State
    const [content, setContent] = useState<ContentDB | null>(null);
    const [months, setMonths] = useState<Month[]>([]);
    const [categories, setCategories] = useState<TournamentCategory[]>([]);
    const [totalQualifiers, setTotalQualifiers] = useState<number | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isSavingContent, setIsSavingContent] = useState(false);

    // Daily Rewards State
    const [dailyRewards, setDailyRewards] = useState<any[]>([]);
    const [isLoadingRewards, setIsLoadingRewards] = useState(false);
    const [isSavingReward, setIsSavingReward] = useState(false);
    const [badgeTemplates, setBadgeTemplates] = useState<any[]>([]);
    const [editingReward, setEditingReward] = useState<any | null>(null);
    const [rewardForm, setRewardForm] = useState({
        day: 1,
        reward_type: 'xp',
        reward_value: '',
        reward_label: ''
    });

    // Nova Categoria Form State
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCatData, setNewCatData] = useState({ slug: '', title: '', icon: 'inventory_2', color: 'primary' as any });
    const [showIconPicker, setShowIconPicker] = useState<number | null>(null); // Index or -1 for New Cat

    const iconPool = [
        'inventory_2', 'category', 'stars', 'receipt_long', 'campaign', 'settings',
        'point_of_sale', 'add_shopping_cart', 'bar_chart', 'quiz', 'home',
        'calendar_month', 'person', 'diamond', 'wine_bar', 'restaurant',
        'local_bar', 'sports_esports', 'local_activity', 'confirmation_number',
        'emoji_events', 'groups', 'chat', 'info', 'account_balance_wallet',
        'credit_card', 'monetization_on', 'redeem', 'local_fire_department',
        'auto_awesome', 'military_tech', 'psychology', 'sports_poker'
    ];

    // Statistics State
    const [stats, setStats] = useState({
        totalUsers: 0,
        closedEvents: 0,
        uniqueRankedPlayers: 0,
        totalPrizeDistributed: 0,
        theChosenQualifiers: 0,
        totalChipz: 0,
        totalDebt: 0,
        verifiedUsers: 0
    });
    const [pageViews, setPageViews] = useState<{ view_name: string, count: number, isNew?: boolean }[]>([]);
    const [userClicks, setUserClicks] = useState<{ user_id: string, user_name: string, view_name: string, count: number }[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // Sponsorship State
    const [sponsorshipPlans, setSponsorshipPlans] = useState<any[]>([]);

    // VIP Plans State
    const [vipPlans, setVipPlans] = useState<any[]>(appConfig.vip.plans || []);

    // Sidebar active section
    const [activeSection, setActiveSection] = useState<'roadmap' | 'hero' | 'details' | 'faq' | 'months' | 'ecosystem' | 'daily-rewards' | 'defaults' | 'sponsorship' | 'vip'>('roadmap');

    useEffect(() => {
        fetchRoadmap();
        fetchContent();
        fetchDailyRewards();
        fetchBadgeTemplates();
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        setIsLoadingStats(true);
        try {
            const [{ count: usersCount }, { count: eventsCount }, { data: eventsData }, { count: chosenCount }, { data: profilesData }] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
                supabase.from('events').select('total_prize, details').eq('status', 'closed'),
                supabase.from('the_chosen_qualifiers').select('id', { count: 'exact', head: true }),
                supabase.from('profiles').select('id, balance_chipz, total_pending_debt, is_verified')
            ]);

            const sumPrizes = (eventsData || []).reduce((acc: number, e: any) => {
                const prize = Number(e.total_prize || 0) || Number(e.details?.prizePayoutBrl || 0);
                return acc + prize;
            }, 0);

            const activePlayers = (profilesData || []).filter(p => p.balance_chipz > 0 || p.total_pending_debt > 0).length;
            const verifiedCount = (profilesData || []).filter(p => p.is_verified === true).length;
            const totalChipzDb = (profilesData || []).reduce((s, p) => s + (Number(p.balance_chipz) || 0), 0);
            const totalDebtDb = (profilesData || []).reduce((s, p) => s + (Number(p.total_pending_debt) || 0), 0);

            setStats({
                totalUsers: usersCount || 0,
                closedEvents: eventsCount || 0,
                uniqueRankedPlayers: activePlayers || 0,
                totalPrizeDistributed: sumPrizes,
                theChosenQualifiers: chosenCount || 0,
                totalChipz: totalChipzDb,
                totalDebt: totalDebtDb,
                verifiedUsers: verifiedCount
            });

            // Fetch Page Views simplified from page_stats (Counter table)
            try {
                // Nova abordagem: Lê diretamente da tabela de contadores, muito mais leve.
                const { data: stats } = await supabase.from('page_stats').select('view_name, count').order('count', { ascending: false });

                if (stats && stats.length > 0) {
                    setPageViews(stats.map((s: any) => ({ ...s, isNew: true })));
                } else {
                    // Fallback para a tabela antiga se a nova ainda estiver vazia ou sendo migrada
                    const { data: oldViews } = await supabase.from('page_views').select('view_name').limit(2000);
                    if (oldViews) {
                        const counts: Record<string, number> = {};
                        oldViews.forEach((v: any) => { counts[v.view_name] = (counts[v.view_name] || 0) + 1; });
                        const sorted = Object.entries(counts)
                            .map(([name, count]) => ({ view_name: name, count, isNew: false }))
                            .sort((a, b) => b.count - a.count);
                        setPageViews(sorted);
                    }
                }
            } catch (vErr) {
                console.log("Lightweight analytics stats not available yet", vErr);
            }

            // Novo: Fetch User specific clicks (Verified Only)
            try {
                const { data: uClicks } = await supabase
                    .from('user_page_stats')
                    .select(`
                        count,
                        view_name,
                        profiles!user_page_stats_user_id_fkey (
                            id,
                            name,
                            is_verified
                        )
                    `)
                    .order('count', { ascending: false })
                    .limit(50);

                if (uClicks) {
                    const mapped = (uClicks as any[])
                        .filter(uc => uc.profiles?.is_verified)
                        .map(uc => ({
                            user_id: uc.profiles.id,
                            user_name: uc.profiles.name,
                            view_name: uc.view_name,
                            count: uc.count
                        }));
                    setUserClicks(mapped);
                }
            } catch (uErr) {
                console.log("Error fetching user clicks", uErr);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const fetchRoadmap = async () => {
        setIsLoadingRoadmap(true);
        try {
            const { data, error } = await supabase
                .from('roadmap_milestones')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setMilestones(data || []);
        } catch (err: any) {
            console.error('Error fetching roadmap:', err.message);
        } finally {
            setIsLoadingRoadmap(false);
        }
    };

    const fetchContent = async () => {
        setIsLoadingContent(true);
        try {
            const { data, error } = await supabase.from('content_db').select('*');
            if (error) throw error;

            const newContent: any = { hero: {}, details: {}, faq: [] };
            const { data: catData } = await supabase.from('ecosystem_categories').select('*').order('order', { ascending: true });
            if (catData) setCategories(catData);

            let loadedVipPlans: any[] = [];
            data?.forEach(item => {
                if (item.key === 'hero' || item.key === 'details' || item.key === 'faq') {
                    newContent[item.key] = item.value;
                } else if (item.key === 'months') {
                    setMonths(item.value);
                } else if (item.key === 'total_qualifiers') {
                    setTotalQualifiers(item.value);
                } else if (item.key === 'sponsorship_plans') {
                    setSponsorshipPlans(item.value);
                } else if (item.key === 'vip_plans') {
                    loadedVipPlans = Array.isArray(item.value) ? item.value : [];
                }
            });

            // Enhanced VIP fetch: Always try to merge products with appConfig defaults if content_db is missing or outdated
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('category', 'vip')
                .order('price', { ascending: true });

            if (productsData && productsData.length > 0) {
                const mappedFromProducts = productsData.map((product, index) => {
                    const lowerName = product.name.toLowerCase();
                    let type: 'quarterly' | 'annual' | 'master' | 'honorario' = 'quarterly';
                    if (lowerName.includes('master')) type = 'master';
                    else if (lowerName.includes('anual') || lowerName.includes('ano')) type = 'annual';
                    else if (lowerName.includes('trimestral')) type = 'quarterly';
                    else if (lowerName.includes('honorario') || lowerName.includes('honorário')) type = 'honorario';
                    else {
                        if (Number(product.price) === 0) type = 'honorario';
                        else if (index === 0) type = 'honorario';
                        else if (index === 1) type = 'quarterly';
                        else if (index === 2) type = 'annual';
                        else type = 'master';
                    }
                    const configTemplate = (appConfig.vip.plans as any[]).find(p => p.id === type) || appConfig.vip.plans[0];
                    return {
                        ...configTemplate,
                        id: type,
                        db_id: product.id,
                        title: product.name,
                        price: Number(product.price).toFixed(2).replace('.', ','),
                        rawPrice: Number(product.price),
                        period: product.price_unit || configTemplate.period,
                        features: product.description
                            ? product.description.split('\n').map((f: string) => f.replace(/^[•*-]\s*/, '').trim()).filter(Boolean)
                            : configTemplate.features
                    };
                });

                if (loadedVipPlans.length > 0) {
                    // Merge saved content_db with products (keep db_id and price in sync)
                    const merged = loadedVipPlans.map(savedPlan => {
                        const productMatch = mappedFromProducts.find(mp => mp.id === savedPlan.id || mp.db_id === savedPlan.db_id);
                        if (productMatch) {
                            return {
                                ...savedPlan,
                                db_id: productMatch.db_id,
                                price: productMatch.price,
                                rawPrice: productMatch.rawPrice,
                                // If features are empty in content_db, use product or config
                                features: (savedPlan.features && savedPlan.features.length > 0) ? savedPlan.features : productMatch.features
                            };
                        }
                        return savedPlan;
                    });

                    // Add any products that are in the database but NOT in content_db
                    const missingProducts = mappedFromProducts.filter(mp => !merged.find(m => m.db_id === mp.db_id || m.id === mp.id));
                    setVipPlans([...merged, ...missingProducts]);
                } else {
                    setVipPlans(mappedFromProducts);
                }
            } else {
                if (loadedVipPlans.length > 0) {
                    setVipPlans(loadedVipPlans);
                } else {
                    setVipPlans([...(appConfig.vip.plans as any[])]);
                }
            }

            setContent(newContent);
        } catch (err: any) {
            console.error('Error fetching content:', err.message);
        } finally {
            setIsLoadingContent(false);
        }
    };

    const handleSaveContent = async (key: string, value: any) => {
        setIsSavingContent(true);
        try {
            const { error } = await supabase
                .from('content_db')
                .upsert({ key, value }, { onConflict: 'key' });

            if (error) throw error;
            alert(`Configuração "${key.toUpperCase()}" salva com sucesso!`);
        } catch (err: any) {
            alert('Erro ao salvar conteúdo: ' + err.message);
        } finally {
            setIsSavingContent(false);
        }
    };

    const handleSyncVipPlans = async () => {
        setIsSavingContent(true);
        try {
            // 1. Save to content_db for UI/Features
            const { error: contentErr } = await supabase
                .from('content_db')
                .upsert({ key: 'vip_plans', value: vipPlans }, { onConflict: 'key' });

            if (contentErr) throw contentErr;

            // 2. Sync with Products table (Price, Name, Description)
            for (const plan of vipPlans) {
                const priceStr = plan.price.toString().replace(/\./g, '').replace(',', '.');
                const cleanPrice = parseFloat(priceStr);
                const featuresTxt = plan.features.join('\n');

                if (plan.db_id) {
                    await supabase.from('products').update({
                        name: plan.title,
                        price: cleanPrice,
                        price_unit: plan.period,
                        description: featuresTxt
                    }).eq('id', plan.db_id);
                } else {
                    const { data: newProd, error: insertErr } = await supabase.from('products').insert({
                        name: plan.title,
                        category: 'vip',
                        price: cleanPrice,
                        price_unit: plan.period,
                        description: featuresTxt,
                        active: true
                    }).select().single();
                    if (!insertErr && newProd) {
                        plan.db_id = newProd.id;
                    }
                }
            }

            // Re-save to content_db to update with the new db_ids
            await supabase
                .from('content_db')
                .upsert({ key: 'vip_plans', value: vipPlans }, { onConflict: 'key' });

            alert('✅ Planos VIP sincronizados e publicados com sucesso!');
        } catch (err: any) {
            alert('Erro ao sincronizar VIP: ' + err.message);
        } finally {
            setIsSavingContent(false);
        }
    };

    const fetchDailyRewards = async () => {
        setIsLoadingRewards(true);
        try {
            const { data, error } = await supabase.from('daily_rewards').select('*').order('day', { ascending: true });
            if (error) throw error;
            setDailyRewards(data || []);
        } catch (err: any) {
            console.error('Error fetching daily rewards:', err.message);
        } finally {
            setIsLoadingRewards(false);
        }
    };

    const fetchBadgeTemplates = async () => {
        try {
            const { data } = await supabase.from('badge_templates').select('*');
            if (data) setBadgeTemplates(data);
        } catch (err) { console.error(err); }
    };

    const handleSaveReward = async () => {
        if (!rewardForm.day || !rewardForm.reward_value) {
            alert('Dia e valor da recompensa são obrigatórios.');
            return;
        }
        setIsSavingReward(true);
        try {
            const payload = {
                day: parseInt(rewardForm.day.toString()),
                reward_type: rewardForm.reward_type,
                reward_value: rewardForm.reward_value.toString(),
                reward_label: rewardForm.reward_label || `Recompensa Dia ${rewardForm.day}`
            };

            const { error } = await supabase.from('daily_rewards').upsert(payload, { onConflict: 'day' });
            if (error) throw error;

            alert('✅ Recompensa salva com sucesso!');
            fetchDailyRewards();
            setEditingReward(null);
            setRewardForm({ day: dailyRewards.length + 1, reward_type: 'xp', reward_value: '', reward_label: '' });
        } catch (err: any) {
            alert('Erro ao salvar recompensa: ' + err.message);
        } finally {
            setIsSavingReward(false);
        }
    };

    const handleDeleteReward = async (day: number) => {
        if (!window.confirm(`Excluir recompensa do dia ${day}?`)) return;
        try {
            const { error } = await supabase.from('daily_rewards').delete().eq('day', day);
            if (error) throw error;
            fetchDailyRewards();
        } catch (err: any) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const handleEditRoadmap = (m: RoadmapMilestone) => {
        setEditingRoadmapId(m.id || null);
        setRoadmapFormData({ ...m });
    };

    const handleSaveRoadmap = async () => {
        setIsLoadingRoadmap(true);
        try {
            if (editingRoadmapId && editingRoadmapId !== 'new') {
                const { error } = await supabase
                    .from('roadmap_milestones')
                    .update({
                        version: roadmapFormData.version,
                        title: roadmapFormData.title,
                        date: roadmapFormData.date,
                        status: roadmapFormData.status,
                        topics: roadmapFormData.topics,
                        display_order: roadmapFormData.display_order
                    })
                    .eq('id', editingRoadmapId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('roadmap_milestones')
                    .insert([roadmapFormData]);
                if (error) throw error;
            }
            fetchRoadmap();
            setEditingRoadmapId(null);
            setRoadmapFormData({ version: '', title: '', date: '', status: 'upcoming', topics: [], display_order: 0 });
        } catch (err: any) {
            alert('Erro ao salvar milestone: ' + err.message);
        } finally {
            setIsLoadingRoadmap(false);
        }
    };

    const handleDeleteRoadmap = async (id: string) => {
        if (!window.confirm('Excluir este milestone do roadmap?')) return;
        setIsLoadingRoadmap(true);
        try {
            const { error } = await supabase.from('roadmap_milestones').delete().eq('id', id);
            if (error) throw error;
            fetchRoadmap();
        } catch (err: any) {
            alert('Erro ao excluir: ' + err.message);
        } finally {
            setIsLoadingRoadmap(false);
        }
    };

    const addTopic = () => {
        if (!topicInput.trim()) return;
        setRoadmapFormData(prev => ({ ...prev, topics: [...prev.topics, topicInput.trim()] }));
        setTopicInput('');
    };

    const removeTopic = (index: number) => {
        setRoadmapFormData(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== index) }));
    };

    const handleUpdateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
        if (!content) return;
        const newFaq = [...content.faq];
        newFaq[index] = { ...newFaq[index], [field]: value };
        setContent({ ...content, faq: newFaq });
    };

    const handleAddFAQ = () => {
        if (!content) return;
        setContent({ ...content, faq: [...content.faq, { question: '', answer: '' }] });
    };

    const handleRemoveFAQ = (index: number) => {
        if (!content) return;
        setContent({ ...content, faq: content.faq.filter((_, i) => i !== index) });
    };

    const handleUpdateMonth = (index: number, field: keyof Month, value: any) => {
        const newMonths = [...months];
        newMonths[index] = { ...newMonths[index], [field]: value };
        setMonths(newMonths);
    };

    const handleUpdateCategory = (index: number, field: keyof TournamentCategory, value: any) => {
        const newCats = [...categories];
        newCats[index] = { ...newCats[index], [field]: value };
        setCategories(newCats);
    };

    const handleSaveCategory = async (index: number) => {
        setIsSavingContent(true);
        try {
            const cat = categories[index];
            const { error } = await supabase.from('ecosystem_categories').upsert(cat, { onConflict: 'id' });
            if (error) throw error;
            alert('Categoria salva com sucesso!');
        } catch (err: any) {
            alert('Erro ao salvar categoria: ' + err.message);
        } finally {
            setIsSavingContent(false);
        }
    };

    const handleConfirmAddCategory = async () => {
        if (!newCatData.slug || !newCatData.title) return;

        const newCatId = newCatData.slug.toLowerCase().replace(/\s+/g, '_');

        // Check if slug already exists in current list to avoid immediate errors
        if (categories.some(c => c.id === newCatId)) {
            alert('Este Slug já está em uso.');
            return;
        }

        setIsSavingContent(true);
        try {
            const newCat: any = {
                id: newCatId,
                title: newCatData.title,
                description: 'Nova categoria do ecossistema...',
                icon: newCatData.icon,
                color: newCatData.color || 'primary',
                slots: 0,
                is_mystery: false,
                is_hidden: false,
                order: categories.length
            };

            const { error } = await supabase.from('ecosystem_categories').insert([newCat]);
            if (error) throw error;

            setCategories([...categories, newCat]);
            setNewCatData({ slug: '', title: '', icon: 'inventory_2' });
            alert('✅ Categoria criada com sucesso!');
        } catch (err: any) {
            alert('Erro ao criar categoria: ' + err.message);
        } finally {
            setIsSavingContent(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('Excluir esta categoria?')) return;
        setIsSavingContent(true);
        try {
            const { error } = await supabase.from('ecosystem_categories').delete().eq('id', id);
            if (error) throw error;
            setCategories(categories.filter(c => c.id !== id));
        } catch (err: any) {
            alert('Erro ao excluir categoria: ' + err.message);
        } finally {
            setIsSavingContent(false);
        }
    };

    const handleUpdateSponsorshipPlan = (index: number, field: string, value: any) => {
        const newPlans = [...sponsorshipPlans];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setSponsorshipPlans(newPlans);
    };

    const handleAddSponsorshipPlan = () => {
        const newPlan = {
            id: 'plan-' + Date.now(),
            name: 'Novo Plano de Patrocínio',
            subtitle: 'Subtítulo do Plano',
            physical_application: 'Local de Aplicação',
            structural_responsibilities: [],
            benefits: [],
            price: '0.00',
            is_sold_out: false,
            is_most_noble: false,
            color: 'primary',
            icon: 'emoji_events'
        };
        setSponsorshipPlans([...sponsorshipPlans, newPlan]);
    };

    const handleDeleteSponsorshipPlan = (index: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este plano de patrocínio?')) return;
        const newPlans = sponsorshipPlans.filter((_, i) => i !== index);
        setSponsorshipPlans(newPlans);
    };

    const handleUpdateVipPlan = (index: number, field: string, value: any) => {
        const newPlans = [...vipPlans];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setVipPlans(newPlans);
    };

    const handleAddVipPlan = () => {
        const newId = 'vip-' + Date.now();
        const newPlan = {
            id: newId,
            title: 'Novo Plano VIP',
            price: '100,00',
            period: 'MÊS',
            features: ['Benefício 1', 'Benefício 2'],
            color: 'border-primary',
            btnColor: 'bg-primary text-white'
        };
        setVipPlans([...vipPlans, newPlan]);
    };

    const handleDeleteVipPlan = (index: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este plano VIP?')) return;
        const newPlans = vipPlans.filter((_, i) => i !== index);
        setVipPlans(newPlans);
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-[600px] bg-black/20 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-white/5">
            {/* Sub-Sidebar / Mobile Menu */}
            <aside className="lg:w-64 bg-white/5 border-b lg:border-b-0 lg:border-r border-white/10 p-4 sm:p-6 flex flex-row lg:flex-col gap-2 shrink-0 overflow-x-auto lg:overflow-x-visible no-scrollbar">
                <div className="hidden lg:block mb-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 mb-4">Gestão de Conteúdo</h4>
                </div>

                <SidebarButton
                    active={activeSection === 'roadmap'}
                    onClick={() => setActiveSection('roadmap')}
                    icon="map"
                    label="Roadmap"
                />
                <SidebarButton
                    active={activeSection === 'hero'}
                    onClick={() => setActiveSection('hero')}
                    icon="home"
                    label="Hero"
                />
                <SidebarButton
                    active={activeSection === 'details'}
                    onClick={() => setActiveSection('details')}
                    icon="info"
                    label="The Chosen"
                />
                <SidebarButton active={activeSection === 'defaults'} onClick={() => setActiveSection('defaults')} icon="analytics" label="Estatísticas" />
                <div className="h-px w-full bg-white/5 my-2"></div>
                <SidebarButton active={activeSection === 'daily-rewards'} onClick={() => setActiveSection('daily-rewards')} icon="calendar_today" label="Login Diário" />
                <SidebarButton
                    active={activeSection === 'faq'}
                    onClick={() => setActiveSection('faq')}
                    icon="quiz"
                    label="FAQ"
                />
                <SidebarButton
                    active={activeSection === 'months'}
                    onClick={() => setActiveSection('months')}
                    icon="calendar_month"
                    label="Cronograma"
                />
                <SidebarButton
                    active={activeSection === 'ecosystem'}
                    onClick={() => setActiveSection('ecosystem')}
                    icon="category"
                    label="Ecossistema"
                />
                <SidebarButton
                    active={activeSection === 'sponsorship'}
                    onClick={() => setActiveSection('sponsorship')}
                    icon="handshake"
                    label="Patrocínio"
                />
                <SidebarButton
                    active={activeSection === 'vip'}
                    onClick={() => setActiveSection('vip')}
                    icon="diamond"
                    label="Planos VIP"
                />
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-4 lg:p-12 overflow-y-auto custom-scrollbar">
                {activeSection === 'roadmap' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <SectionHeader title="Timeline do Roadmap" subtitle="Evolução pública do ecossistema" />
                        <div className="flex justify-end mb-6">
                            {!editingRoadmapId && (
                                <button
                                    onClick={() => { setEditingRoadmapId('new'); setRoadmapFormData({ version: '', title: '', date: '', status: 'upcoming', topics: [], display_order: milestones.length + 1 }); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-neon-pink hover:bg-primary/80 transition-all font-display italic"
                                >
                                    <span className="material-icons-outlined text-sm">add</span>
                                    Novo Milestone
                                </button>
                            )}
                        </div>

                        {editingRoadmapId && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-8 border-l-4 border-l-primary">
                                <h4 className="text-xs sm:text-sm font-black text-primary uppercase mb-6 flex items-center gap-2">
                                    <span className="material-icons-outlined text-sm">{editingRoadmapId === 'new' ? 'add_circle' : 'edit'}</span>
                                    {editingRoadmapId === 'new' ? 'Novo Marco' : 'Editar Marco'}
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <FormGroup label="Versão (ex: V 1.1)">
                                        <input type="text" value={roadmapFormData.version} onChange={e => setRoadmapFormData({ ...roadmapFormData, version: e.target.value })} className="form-input" />
                                    </FormGroup>
                                    <FormGroup label="Título">
                                        <input type="text" value={roadmapFormData.title} onChange={e => setRoadmapFormData({ ...roadmapFormData, title: e.target.value })} className="form-input" />
                                    </FormGroup>
                                    <FormGroup label="Data/Previsão">
                                        <input type="text" value={roadmapFormData.date} onChange={e => setRoadmapFormData({ ...roadmapFormData, date: e.target.value })} className="form-input" />
                                    </FormGroup>
                                    <FormGroup label="Status">
                                        <select value={roadmapFormData.status} onChange={e => setRoadmapFormData({ ...roadmapFormData, status: e.target.value as any })} className="form-input appearance-none">
                                            <option value="completed">Concluído</option>
                                            <option value="current">Versão Atual</option>
                                            <option value="upcoming">Próximo</option>
                                        </select>
                                    </FormGroup>
                                </div>

                                <div className="mb-6 px-1 sm:px-2">
                                    <label className="text-[10px] text-gray-500 uppercase font-black block mb-2 tracking-widest">Tópicos / Novidades</label>
                                    <div className="flex gap-2 mb-3">
                                        <input type="text" value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTopic()} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-primary" placeholder="Adicione um ponto..." />
                                        <button onClick={addTopic} className="px-3 sm:px-4 bg-primary/20 text-primary border border-primary/20 rounded-xl hover:bg-primary/30 transition-colors"><span className="material-icons-outlined">add</span></button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {roadmapFormData.topics.map((t, i) => (
                                            <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-[10px] text-primary font-bold">
                                                {t}<button onClick={() => removeTopic(i)} className="hover:text-white transition-colors"><span className="material-icons-outlined text-[12px]">close</span></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/5">
                                    <button onClick={() => setEditingRoadmapId(null)} className="px-6 py-2.5 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors order-2 sm:order-1">Cancelar</button>
                                    <button onClick={handleSaveRoadmap} disabled={isLoadingRoadmap} className="px-8 py-2.5 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-neon-pink hover:bg-primary/80 disabled:opacity-50 transition-all font-display italic order-1 sm:order-2">
                                        {isLoadingRoadmap ? 'Salvando...' : 'Confirmar Milestone'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {milestones.length === 0 ? (
                                <EmptyState icon="map" text="Nenhum marco encontrado" />
                            ) : milestones.map(m => (
                                <RoadmapCard key={m.id} m={m} onEdit={() => handleEditRoadmap(m)} onDelete={() => handleDeleteRoadmap(m.id!)} />
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'hero' && content && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <SectionHeader title="Hero Principal" subtitle="Primeira impressão na Homepage" />
                        <div className="space-y-6 bg-white/5 border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormGroup label="Título Linha 1">
                                    <input type="text" value={content.hero.title_line1} onChange={e => setContent({ ...content, hero: { ...content.hero, title_line1: e.target.value } })} className="form-input font-bold" />
                                </FormGroup>
                                <FormGroup label="Sufixo Título 2">
                                    <input type="text" value={content.hero.title_line2_prefix} onChange={e => setContent({ ...content, hero: { ...content.hero, title_line2_prefix: e.target.value } })} className="form-input font-bold" />
                                </FormGroup>
                                <FormGroup label="Subtítulo / Chamada" fullWidth>
                                    <textarea rows={3} value={content.hero.subtitle} onChange={e => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })} className="form-input resize-none" />
                                </FormGroup>
                                <FormGroup label="Botão Ação">
                                    <input type="text" value={content.hero.btn_details} onChange={e => setContent({ ...content, hero: { ...content.hero, btn_details: e.target.value } })} className="form-input font-bold" />
                                </FormGroup>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex justify-end">
                                <button onClick={() => handleSaveContent('hero', content.hero)} disabled={isSavingContent} className="btn-save shadow-neon-pink w-full sm:w-auto">
                                    <span className="material-icons-outlined text-sm">cloud_upload</span>
                                    {isSavingContent ? 'Publicando...' : 'Publicar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'details' && content && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <SectionHeader title="Seção: The Chosen" subtitle="Dinâmica do evento final" />
                        <div className="space-y-6 sm:space-y-8">
                            <ContentBlock title="Cabeçalho" color="bg-primary">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <FormGroup label="Título Grande">
                                        <input type="text" value={content.details.header_title} onChange={e => setContent({ ...content, details: { ...content.details, header_title: e.target.value } })} className="form-input font-bold" />
                                    </FormGroup>
                                    <FormGroup label="Subtítulo">
                                        <input type="text" value={content.details.header_subtitle} onChange={e => setContent({ ...content, details: { ...content.details, header_subtitle: e.target.value } })} className="form-input" />
                                    </FormGroup>
                                </div>
                            </ContentBlock>

                            <ContentBlock title="O Conceito" color="bg-secondary">
                                <div className="space-y-4">
                                    <input type="text" value={content.details.concept_title} onChange={e => setContent({ ...content, details: { ...content.details, concept_title: e.target.value } })} className="form-input font-bold" />
                                    <textarea rows={4} value={content.details.concept_desc} onChange={e => setContent({ ...content, details: { ...content.details, concept_desc: e.target.value } })} className="form-input text-sm resize-none" />
                                </div>
                            </ContentBlock>

                            <ContentBlock title="Dinâmica Plus" color="bg-cyan-500">
                                <div className="space-y-4">
                                    <input type="text" value={content.details.plus_title} onChange={e => setContent({ ...content, details: { ...content.details, plus_title: e.target.value } })} className="form-input font-bold" />
                                    <textarea rows={4} value={content.details.plus_desc} onChange={e => setContent({ ...content, details: { ...content.details, plus_desc: e.target.value } })} className="form-input text-sm resize-none" />
                                </div>
                            </ContentBlock>

                            <div className="flex justify-center pb-10 pt-4">
                                <button onClick={() => handleSaveContent('details', content.details)} disabled={isSavingContent} className="btn-save-gradient w-full sm:w-auto">
                                    <span className="material-icons-outlined text-sm">save_alt</span>
                                    {isSavingContent ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'faq' && content && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <SectionHeader title="FAQ - Dúvidas" subtitle="Questões comuns dos jogadores" />
                        <div className="space-y-3 sm:space-y-4 mb-8">
                            {content.faq.map((item, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 relative group border-l-4 border-l-gray-600 focus-within:border-l-primary transition-all">
                                    <button onClick={() => handleRemoveFAQ(idx)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 p-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                        <span className="material-icons-outlined text-sm">delete</span>
                                    </button>
                                    <div className="space-y-3">
                                        <input type="text" placeholder="Pergunta" value={item.question} onChange={e => handleUpdateFAQ(idx, 'question', e.target.value)} className="w-full bg-transparent border-none text-white font-bold outline-none placeholder:text-gray-700 text-sm sm:text-base pr-8" />
                                        <textarea rows={2} placeholder="Resposta" value={item.answer} onChange={e => handleUpdateFAQ(idx, 'answer', e.target.value)} className="w-full bg-transparent border-none text-gray-400 text-xs sm:text-sm outline-none resize-none placeholder:text-gray-800" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center gap-4 sm:gap-6">
                            <button onClick={handleAddFAQ} className="w-full sm:w-auto px-6 py-3 border border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-white hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="material-icons-outlined text-sm">add_circle</span> Adicionar Pergunta
                            </button>
                            <button onClick={() => handleSaveContent('faq', content.faq)} disabled={isSavingContent} className="btn-save shadow-neon-blue w-full max-w-md">
                                <span className="material-icons-outlined text-sm">sync</span> {isSavingContent ? 'Atualizando...' : 'Atualizar FAQ'}
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'months' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <SectionHeader title="Cronograma" subtitle="Metas e garantidos mensais" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            {months.map((month, idx) => (
                                <div key={idx} className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${month.status === 'active' ? 'bg-primary/20 border-primary' : month.status === 'completed' ? 'bg-secondary/10 border-secondary/40' : 'bg-white/5 border-white/10 opacity-70'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] sm:text-xs font-black text-white">{month.name}</span>
                                        <select value={month.status} onChange={e => handleUpdateMonth(idx, 'status', e.target.value as any)} className="bg-black/50 border-none text-[8px] font-black uppercase px-2 py-1 rounded-full outline-none cursor-pointer">
                                            <option value="locked">Bloqueado</option>
                                            <option value="active">Ativo</option>
                                            <option value="completed">Atingido</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-black/20 p-2 rounded-xl">
                                            <label className="text-[7px] text-gray-500 uppercase font-black block mb-1">Garantido</label>
                                            <input type="text" value={month.prize} onChange={e => handleUpdateMonth(idx, 'prize', e.target.value)} className="w-full bg-transparent border-none text-white font-bold text-xs outline-none" />
                                        </div>
                                        <div className="bg-black/20 p-2 rounded-xl">
                                            <label className="text-[7px] text-gray-500 uppercase font-black block mb-1">Qtd</label>
                                            <input type="text" value={month.qualifiers} onChange={e => handleUpdateMonth(idx, 'qualifiers', e.target.value)} className="w-full bg-transparent border-none text-white font-bold text-xs outline-none" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center">
                            <button onClick={() => handleSaveContent('months', months)} disabled={isSavingContent} className="btn-save shadow-neon-pink w-full max-w-xs uppercase">
                                <span className="material-icons-outlined text-sm">save</span> {isSavingContent ? 'Salvando...' : 'Salvar Cronograma'}
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'ecosystem' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <SectionHeader title="Ecossistema" subtitle="Categorias e slots" />

                        {/* New Category Form (As per print) */}
                        <div className="mb-10 bg-[#050214] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md mx-auto shadow-2xl relative">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="material-icons text-primary">category</span>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Nova Categoria</h4>
                            </div>

                            <div className="space-y-6">
                                <FormGroup label="Slug (Sem Espaços)">
                                    <input
                                        type="text"
                                        value={newCatData.slug}
                                        onChange={e => setNewCatData({ ...newCatData, slug: e.target.value })}
                                        placeholder="ex: vip"
                                        className="form-input"
                                    />
                                </FormGroup>

                                <FormGroup label="Nome de Exibição">
                                    <input
                                        type="text"
                                        value={newCatData.title}
                                        onChange={e => setNewCatData({ ...newCatData, title: e.target.value })}
                                        placeholder="EX: VIP"
                                        className="form-input"
                                    />
                                </FormGroup>

                                <div className="relative">
                                    <FormGroup label="Ícone">
                                        <div
                                            onClick={() => setShowIconPicker(showIconPicker === -1 ? null : -1)}
                                            className="form-input flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons-outlined text-primary text-sm">{newCatData.icon}</span>
                                                <span className="text-xs text-gray-400">{newCatData.icon}</span>
                                            </div>
                                            <span className="material-icons text-gray-600 text-sm">expand_more</span>
                                        </div>
                                    </FormGroup>

                                    {showIconPicker === -1 && (
                                        <div className="absolute z-[10] top-full left-0 right-0 mt-2 p-3 bg-[#0a061e] border border-white/10 rounded-2xl shadow-2xl grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                                            {iconPool.map(icon => (
                                                <button
                                                    key={icon}
                                                    onClick={() => { setNewCatData({ ...newCatData, icon }); setShowIconPicker(null); }}
                                                    className={`w-full aspect-square flex items-center justify-center rounded-lg hover:bg-primary/20 transition-all ${newCatData.icon === icon ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-500'}`}
                                                >
                                                    <span className="material-icons-outlined text-lg">{icon}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <FormGroup label="Cor Base">
                                    <select
                                        value={newCatData.color}
                                        onChange={e => setNewCatData({ ...newCatData, color: e.target.value })}
                                        className="form-input text-xs appearance-none cursor-pointer hover:border-primary transition-all mb-4"
                                    >
                                        <option value="primary">Pink (Destaque)</option>
                                        <option value="secondary">Blue (Chip Race)</option>
                                        <option value="cyan">Ciano (Neon)</option>
                                        <option value="pink">Rosa (Suave)</option>
                                        <option value="amber">Amarelo (Gold)</option>
                                        <option value="orange">Laranja (Vibrant)</option>
                                        <option value="emerald">Verde (Emerald)</option>
                                        <option value="blue">Azul (Standard)</option>
                                        <option value="purple">Roxo (Luxury)</option>
                                        <option value="red">Vermelho (Danger)</option>
                                    </select>
                                </FormGroup>

                                <button
                                    onClick={handleConfirmAddCategory}
                                    disabled={!newCatData.slug || !newCatData.title}
                                    className="w-full py-4 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-neon-pink hover:bg-primary/80 transition-all disabled:opacity-30 disabled:shadow-none"
                                >
                                    Criar Categoria
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {categories.map((cat, idx) => (
                                <div key={cat.id || idx} className="bg-white/5 border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 relative group">
                                    <button onClick={() => handleDeleteCategory(cat.id || '')} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors lg:opacity-0 lg:group-hover:opacity-100">
                                        <span className="material-icons-outlined text-sm">delete</span>
                                    </button>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div className="col-span-2 flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3 sm:gap-4 flex-1">
                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${cat.color === 'primary' ? 'bg-primary/20 text-primary' :
                                                    cat.color === 'secondary' ? 'bg-secondary/20 text-secondary' :
                                                        cat.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                                                            cat.color === 'pink' ? 'bg-pink-500/20 text-pink-400' :
                                                                cat.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                                                    cat.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                                                                        cat.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                            cat.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                                                                                cat.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                                                                                    cat.color === 'red' ? 'bg-red-500/20 text-red-400' :
                                                                                        'bg-white/10 text-white'
                                                    }`}>
                                                    <span className="material-icons-outlined text-lg">{cat.icon}</span>
                                                </div>
                                                <input type="text" value={cat.title} onChange={e => handleUpdateCategory(idx, 'title', e.target.value)} className="w-full bg-transparent border-none text-white font-black uppercase text-xs sm:text-sm outline-none" placeholder="Nome" />
                                            </div>
                                            {cat.is_hidden && (
                                                <span className="text-[8px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-tighter ml-2 shrink-0">Oculto</span>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <FormGroup label="Ícone">
                                                <div
                                                    onClick={() => setShowIconPicker(showIconPicker === idx ? null : idx)}
                                                    className={`form-input flex items-center justify-between cursor-pointer transition-colors text-xs ${cat.color === 'primary' ? 'hover:border-primary' :
                                                        cat.color === 'secondary' ? 'hover:border-secondary' :
                                                            'hover:border-white/40'
                                                        }`}
                                                >
                                                    <span className={`material-icons-outlined text-sm ${cat.color === 'primary' ? 'text-primary' :
                                                        cat.color === 'secondary' ? 'text-secondary' :
                                                            cat.color === 'cyan' ? 'text-cyan-400' :
                                                                cat.color === 'pink' ? 'text-pink-400' :
                                                                    cat.color === 'amber' ? 'text-amber-400' :
                                                                        cat.color === 'orange' ? 'text-orange-400' :
                                                                            cat.color === 'emerald' ? 'text-emerald-400' :
                                                                                cat.color === 'blue' ? 'text-blue-400' :
                                                                                    cat.color === 'purple' ? 'text-purple-400' :
                                                                                        cat.color === 'red' ? 'text-red-400' : 'text-white'
                                                        }`}>{cat.icon}</span>
                                                    <span className="material-icons text-gray-600 text-xs">expand_more</span>
                                                </div>
                                            </FormGroup>
                                            {showIconPicker === idx && (
                                                <div className="absolute z-[10] top-full left-0 right-0 mt-2 p-2 bg-[#0a061e] border border-white/10 rounded-xl shadow-2xl grid grid-cols-4 gap-2 max-h-40 overflow-y-auto w-40">
                                                    {iconPool.map(icon => (
                                                        <button
                                                            key={icon}
                                                            onClick={() => { handleUpdateCategory(idx, 'icon', icon); setShowIconPicker(null); }}
                                                            className={`w-full aspect-square flex items-center justify-center rounded-lg hover:bg-primary/20 ${cat.icon === icon ? 'bg-primary text-white' : 'text-gray-500'}`}
                                                        >
                                                            <span className="material-icons-outlined text-sm">{icon}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <FormGroup label="Slots">
                                            <input type="text" inputMode="numeric" value={cat.slots}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    handleUpdateCategory(idx, 'slots', val === '' ? 0 : parseInt(val));
                                                }}
                                                className="form-input text-xs" />
                                        </FormGroup>
                                        <FormGroup label="Cor">
                                            <select
                                                value={cat.color}
                                                onChange={e => handleUpdateCategory(idx, 'color', e.target.value)}
                                                className="form-input text-[10px] appearance-none cursor-pointer hover:border-primary transition-all"
                                            >
                                                <option value="primary">Pink (Destaque)</option>
                                                <option value="secondary">Blue (Chip Race)</option>
                                                <option value="cyan">Ciano (Neon)</option>
                                                <option value="pink">Rosa (Suave)</option>
                                                <option value="amber">Amarelo (Gold)</option>
                                                <option value="orange">Laranja (Vibrant)</option>
                                                <option value="emerald">Verde (Emerald)</option>
                                                <option value="blue">Azul (Standard)</option>
                                                <option value="purple">Roxo (Luxury)</option>
                                                <option value="red">Vermelho (Danger)</option>
                                            </select>
                                        </FormGroup>
                                        <FormGroup label="Mstry">
                                            <div className="flex items-center gap-2 mt-2">
                                                <input type="checkbox" checked={cat.is_mystery} onChange={e => handleUpdateCategory(idx, 'is_mystery', e.target.checked)} className="w-4 h-4 rounded bg-white/5 border-white/10" />
                                                <span className="text-[9px] font-bold text-gray-500 uppercase">Habilitar</span>
                                            </div>
                                        </FormGroup>
                                        <FormGroup label="Ocultar">
                                            <div className="flex items-center gap-2 mt-2">
                                                <input type="checkbox" checked={cat.is_hidden} onChange={e => handleUpdateCategory(idx, 'is_hidden', e.target.checked)} className="w-4 h-4 rounded bg-white/5 border-white/10" />
                                                <span className="text-[9px] font-bold text-gray-500 uppercase">Sim</span>
                                            </div>
                                        </FormGroup>
                                        <div className="col-span-2">
                                            <FormGroup label="Descrição" fullWidth>
                                                <textarea rows={2} value={cat.description} onChange={e => handleUpdateCategory(idx, 'description', e.target.value)} className="form-input text-xs resize-none" />
                                            </FormGroup>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                                        <button onClick={() => handleSaveCategory(idx)} className="text-[9px] font-black uppercase text-primary hover:text-white transition-colors flex items-center gap-1">
                                            <span className="material-icons-outlined text-xs">check_circle</span> Salvar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'defaults' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <SectionHeader title="Estatísticas Analíticas" subtitle="Métricas principais do app" />
                            <button onClick={fetchStatistics} disabled={isLoadingStats} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all disabled:opacity-50">
                                <span className={`material-icons-outlined ${isLoadingStats ? 'animate-spin' : ''}`}>refresh</span>
                            </button>
                        </div>

                        {isLoadingStats ? (
                            <div className="flex justify-center p-12">
                                <div className="text-primary font-black uppercase text-xs animate-pulse tracking-widest flex items-center gap-2">
                                    <span className="material-icons-outlined animate-spin text-sm">sync</span>
                                    Calculando estatísticas...
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-2 hover:bg-white/10 transition-colors group">
                                    <span className="material-icons-outlined text-primary text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">group</span>
                                    <div className="text-3xl font-display font-black text-white">{stats.totalUsers}</div>
                                    <div className="text-[9px] uppercase font-black tracking-widest text-gray-500">Usuários Cadastrados</div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-2 hover:bg-white/10 transition-colors group">
                                    <span className="material-icons-outlined text-blue-400 text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">verified</span>
                                    <div className="text-3xl font-display font-black text-white">
                                        {stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%
                                    </div>
                                    <div className="text-[9px] uppercase font-black tracking-widest text-gray-500">
                                        {stats.verifiedUsers} de {stats.totalUsers} Verificados
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-2 hover:bg-white/10 transition-colors group">
                                    <span className="material-icons-outlined text-green-400 text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">event_available</span>
                                    <div className="text-3xl font-display font-black text-white">{stats.closedEvents}</div>
                                    <div className="text-[9px] uppercase font-black tracking-widest text-gray-500">Eventos Encerrados</div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-2 hover:bg-white/10 transition-colors group">
                                    <span className="material-icons-outlined text-secondary text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">emoji_events</span>
                                    <div className="text-3xl font-display font-black text-white">{stats.uniqueRankedPlayers}</div>
                                    <div className="text-[9px] uppercase font-black tracking-widest text-gray-500">Jogadores Frequentes</div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-2 lg:col-span-2 hover:bg-white/10 transition-colors group">
                                    <span className="material-icons-outlined text-yellow-400 text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">attach_money</span>
                                    <div className="text-3xl sm:text-4xl font-display font-black text-white text-glow-yellow">R$ {stats.totalPrizeDistributed.toLocaleString('pt-BR')}</div>
                                    <div className="text-[9px] uppercase font-black tracking-widest text-gray-500">Premiação Repassada</div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-2 hover:bg-white/10 transition-colors group">
                                    <span className="material-icons-outlined text-cyan-400 text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">diamond</span>
                                    <div className="text-3xl font-display font-black text-white text-glow-cyan">{stats.theChosenQualifiers}</div>
                                    <div className="text-[9px] uppercase font-black tracking-widest text-gray-500">Vagas The Chosen</div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-2 hover:bg-white/10 transition-colors group">
                                    <span className="material-icons-outlined text-orange-400 text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">savings</span>
                                    <div className="text-3xl font-display font-black text-white">{stats.totalChipz.toLocaleString('pt-BR')}</div>
                                    <div className="text-[9px] uppercase font-black tracking-widest text-gray-500">Chipz em Circulação</div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-2 lg:col-span-4 bg-red-900/10 border-red-500/20 hover:bg-red-900/20 transition-colors group">
                                    <span className="material-icons-outlined text-red-500 text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">account_balance_wallet</span>
                                    <div className="text-3xl sm:text-4xl font-display font-black text-white text-glow-red">R$ {stats.totalDebt.toLocaleString('pt-BR')}</div>
                                    <div className="text-[9px] uppercase font-black tracking-widest text-red-400/80">Total em Penduras a Receber</div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 lg:p-8">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="material-icons-outlined text-primary">local_fire_department</span>
                                    Mapa de Calor (Páginas)
                                </h4>
                                {pageViews.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Dados de acesso não disponíveis ainda ou tabela não criada.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pageViews.slice(0, 10).map((pv: any, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-all group relative overflow-hidden">
                                                {/* Badge de origem do dado */}
                                                <div className={`absolute top-0 right-0 px-2 py-0.5 text-[7px] font-black uppercase tracking-tighter ${pv.isNew ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-500'} rounded-bl-lg border-l border-b border-white/5`}>
                                                    {pv.isNew ? 'Modo Leve' : 'Legado'}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className="text-primary font-black text-[10px] italic w-5">{idx + 1}º</span>
                                                    <span className="text-white font-black text-xs uppercase tracking-widest">{pv.view_name.replace(/-/g, ' ')}</span>
                                                </div>
                                                <div className="bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-xl flex items-center gap-2 group-hover:scale-105 transition-transform">
                                                    <span className="material-icons-outlined text-[14px] text-cyan-400 opacity-80">visibility</span>
                                                    <span className="text-cyan-400 font-black text-xs font-display italic">{pv.count}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 lg:p-8">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="material-icons-outlined text-blue-400">touch_app</span>
                                    Clique por Usuários (Verificados)
                                </h4>
                                {userClicks.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Aguardando interações dos jogadores verificados.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {userClicks.map((uc, idx) => (
                                            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-all border-l-4 border-l-blue-400">
                                                <div className="flex-1 min-w-0 mr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="material-icons text-[16px] text-blue-400">verified</span>
                                                        <span className="text-white font-bold text-xs truncate uppercase tracking-tighter">{uc.user_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest bg-black/30 px-2 py-0.5 rounded-lg border border-white/5">{uc.view_name.replace(/-/g, ' ')}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-blue-900/30 border border-blue-500/20 px-4 py-2 rounded-xl text-center min-w-[60px]">
                                                    <div className="text-blue-400 font-black text-sm italic font-display">{uc.count}</div>
                                                    <div className="text-[7px] text-blue-400/60 uppercase font-black tracking-tighter">Cliques</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <span className="material-icons-outlined text-primary">webhook</span>
                                        Variável: Total Classificados The Chosen
                                    </h4>
                                    <FormGroup label="Substituir auto-cálculo do App" fullWidth>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={totalQualifiers === null ? '' : totalQualifiers}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setTotalQualifiers(val === '' ? null : parseInt(val));
                                                }}
                                                placeholder="Automático (DB)"
                                                className="flex-1 form-input text-center text-lg font-display italic text-primary"
                                            />
                                            <button onClick={() => setTotalQualifiers(null)} className="text-gray-500 hover:text-white" title="Resetar"><span className="material-icons-outlined">restart_alt</span></button>
                                        </div>
                                        <p className="text-[8px] text-gray-500 mt-2 px-2 uppercase font-black tracking-widest italic leading-normal">* Deixe em aberto para o app usar a contagem acima.</p>
                                    </FormGroup>
                                </div>
                                <button onClick={() => handleSaveContent('total_qualifiers', totalQualifiers)} disabled={isSavingContent} className="btn-save shadow-neon-pink w-full py-4 text-xs h-auto mt-4">
                                    <span className="material-icons-outlined text-sm">save</span> {isSavingContent ? 'Salvando...' : 'Salvar Variável'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'daily-rewards' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <SectionHeader title="Recompensas Diárias" subtitle="Gestão de streak e prêmios consecutivos" />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Form Column */}
                            <div className="lg:sticky lg:top-0 space-y-6">
                                <div className="bg-[#050214] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl border-l-4 border-l-primary">
                                    <div className="flex items-center gap-3 mb-8">
                                        <span className="material-icons text-primary">{editingReward ? 'edit_calendar' : 'add_task'}</span>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}</h4>
                                    </div>

                                    <div className="space-y-5">
                                        <FormGroup label="Dia Consecutivo">
                                            <input
                                                type="number"
                                                value={rewardForm.day}
                                                onChange={e => setRewardForm({ ...rewardForm, day: parseInt(e.target.value) })}
                                                className="form-input"
                                                placeholder="ex: 7"
                                            />
                                        </FormGroup>

                                        <FormGroup label="Label do Prêmio">
                                            <input
                                                type="text"
                                                value={rewardForm.reward_label}
                                                onChange={e => setRewardForm({ ...rewardForm, reward_label: e.target.value })}
                                                className="form-input"
                                                placeholder="ex: Bônus VIP"
                                            />
                                        </FormGroup>

                                        <FormGroup label="Tipo de Prêmio">
                                            <select
                                                value={rewardForm.reward_type}
                                                onChange={e => setRewardForm({ ...rewardForm, reward_type: e.target.value as any, reward_value: '' })}
                                                className="form-input appearance-none"
                                            >
                                                <option value="xp">Experiência (EXP)</option>
                                                <option value="chipz">Chipz (Moeda Virtual)</option>
                                                <option value="brl">BRL (Crédito Real)</option>
                                                <option value="badge">Insígnia (Medalha)</option>
                                            </select>
                                        </FormGroup>

                                        {rewardForm.reward_type === 'badge' ? (
                                            <FormGroup label="Selecionar Insígnia">
                                                <select
                                                    value={rewardForm.reward_value}
                                                    onChange={e => setRewardForm({ ...rewardForm, reward_value: e.target.value })}
                                                    className="form-input appearance-none"
                                                >
                                                    <option value="">Escolha uma insígnia...</option>
                                                    {badgeTemplates.map(b => (
                                                        <option key={b.id} value={b.id}>{b.title}</option>
                                                    ))}
                                                </select>
                                            </FormGroup>
                                        ) : (
                                            <FormGroup label="Valor do Prêmio">
                                                <input
                                                    type="number"
                                                    value={rewardForm.reward_value}
                                                    onChange={e => setRewardForm({ ...rewardForm, reward_value: e.target.value })}
                                                    className="form-input"
                                                    placeholder="Quantidade"
                                                />
                                            </FormGroup>
                                        )}

                                        <div className="flex gap-3 pt-4">
                                            {editingReward && (
                                                <button
                                                    onClick={() => { setEditingReward(null); setRewardForm({ day: dailyRewards.length + 1, reward_type: 'xp', reward_value: '', reward_label: '' }); }}
                                                    className="flex-1 py-3 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                            <button
                                                onClick={handleSaveReward}
                                                disabled={isSavingReward}
                                                className={`flex-[2] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-neon-pink ${editingReward ? 'bg-amber-500 text-black' : 'bg-primary text-white'}`}
                                            >
                                                {isSavingReward ? 'Salvando...' : editingReward ? 'Atualizar Dia' : 'Lançar Prêmio'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* List Column */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Streak Configurado</h4>
                                        <span className="text-[10px] text-primary font-black px-3 py-1 bg-primary/10 rounded-full border border-primary/20">{dailyRewards.length} Dias</span>
                                    </div>

                                    <div className="space-y-3">
                                        {isLoadingRewards ? (
                                            <div className="flex justify-center p-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                            </div>
                                        ) : dailyRewards.length === 0 ? (
                                            <EmptyState icon="auto_awesome" text="Configure o primeiro dia de login" />
                                        ) : (
                                            dailyRewards.map((reward) => (
                                                <div
                                                    key={reward.day}
                                                    className={`group p-4 bg-white/5 border rounded-2xl flex items-center gap-4 transition-all hover:bg-white/10 ${editingReward?.day === reward.day ? 'border-primary shadow-neon-pink/20 scale-[1.02]' : 'border-white/5'}`}
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center shrink-0">
                                                        <span className="text-[10px] text-gray-500 font-black leading-none uppercase">Dia</span>
                                                        <span className="text-xl font-display font-black text-white italic">{reward.day}</span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h5 className="text-white font-bold text-sm truncate uppercase tracking-tighter">{reward.reward_label}</h5>
                                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${reward.reward_type === 'xp' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : reward.reward_type === 'chipz' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : reward.reward_type === 'brl' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                                                {reward.reward_type}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-1">
                                                            <span className="material-icons-outlined text-[12px]">{reward.reward_type === 'xp' ? 'bolt' : reward.reward_type === 'chipz' ? 'monetization_on' : reward.reward_type === 'brl' ? 'account_balance_wallet' : 'military_tech'}</span>
                                                            {reward.reward_type === 'badge' ? 'Insignia ID: ' + reward.reward_value?.toString().slice(0, 8) + '...' : '+' + reward.reward_value}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { setEditingReward(reward); setRewardForm({ ...reward }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-primary/20 border border-white/5 transition-all"
                                                        >
                                                            <span className="material-icons-outlined text-sm">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReward(reward.day)}
                                                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-700 hover:text-red-500 hover:bg-red-500/10 border border-white/5 transition-all"
                                                        >
                                                            <span className="material-icons-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'sponsorship' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <SectionHeader title="Planos de Patrocínio" subtitle="Naming Rights e Estrutura Física" />
                            <button
                                onClick={handleAddSponsorshipPlan}
                                className="bg-primary/20 hover:bg-primary/40 text-primary px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <span className="material-icons-outlined text-sm">add_circle</span>
                                Novo Plano
                            </button>
                        </div>

                        <div className="space-y-8 mb-12">
                            {sponsorshipPlans.map((plan, idx) => (
                                <div key={plan.id} className={`bg-white/5 border border-white/10 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 relative overflow-hidden transition-all hover:bg-white/11 ${plan.is_most_noble ? 'border-amber-500/30 ring-1 ring-amber-500/10' : ''}`}>
                                    <div
                                        onClick={() => handleUpdateSponsorshipPlan(idx, 'is_most_noble', !plan.is_most_noble)}
                                        className={`absolute top-0 right-0 px-6 py-2 transition-all cursor-pointer z-20 ${plan.is_most_noble ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-500'} text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-xl`}
                                    >
                                        {plan.is_most_noble ? 'PLATINUM / NOBRE' : 'Destaque Desativado'}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6">
                                        <div className="md:col-span-12 flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                                            <div className={`w-12 h-12 rounded-2xl bg-${plan.color}/20 flex items-center justify-center text-${plan.color} shadow-lg`}>
                                                <span className="material-icons-outlined">{plan.icon}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black uppercase text-base tracking-tight">{plan.name || 'Novo Plano'}</h4>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mt-1">Configurações Gerais do Espaço</p>
                                            </div>
                                        </div>

                                        <div className="md:col-span-6">
                                            <FormGroup label="NOME DO PLANO" fullWidth>
                                                <input
                                                    type="text"
                                                    value={plan.name}
                                                    onChange={e => handleUpdateSponsorshipPlan(idx, 'name', e.target.value)}
                                                    className="form-input font-bold text-white uppercase text-sm"
                                                    placeholder="Ex: PLANO MASTER"
                                                />
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-6">
                                            <FormGroup label="SUBTÍTULO ESTRATÉGICO" fullWidth>
                                                <input
                                                    type="text"
                                                    value={plan.subtitle}
                                                    onChange={e => handleUpdateSponsorshipPlan(idx, 'subtitle', e.target.value)}
                                                    className="form-input text-gray-400 font-medium text-sm"
                                                    placeholder="Ex: Naming Rights da Entrada"
                                                />
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-6">
                                            <FormGroup label="APLICAÇÃO FÍSICA NO CLUBE" fullWidth>
                                                <input
                                                    type="text"
                                                    value={plan.physical_application}
                                                    onChange={e => handleUpdateSponsorshipPlan(idx, 'physical_application', e.target.value)}
                                                    className="form-input text-primary font-bold text-sm w-full"
                                                    placeholder="Ex: Fachada + Hall"
                                                />
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-3">
                                            <FormGroup label="VALOR" fullWidth>
                                                <input
                                                    type="text"
                                                    value={plan.price}
                                                    onChange={e => handleUpdateSponsorshipPlan(idx, 'price', e.target.value)}
                                                    className="form-input text-amber-500 font-display italic font-black text-xl text-center w-full"
                                                    placeholder="0.00"
                                                />
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-3">
                                            <FormGroup label="STATUS" fullWidth>
                                                <div
                                                    onClick={() => handleUpdateSponsorshipPlan(idx, 'is_sold_out', !plan.is_sold_out)}
                                                    className={`form-input flex items-center justify-center gap-2 cursor-pointer transition-all h-[54px] text-[11px] font-black ${plan.is_sold_out ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-500'}`}
                                                >
                                                    {plan.is_sold_out ? 'ESGOTADO' : 'DISPONÍVEL'}
                                                    <span className="material-icons-outlined text-sm">{plan.is_sold_out ? 'lock_clock' : 'check_circle'}</span>
                                                </div>
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-3">
                                            <FormGroup label="ÍCONE (MATERIAL ICON)" fullWidth>
                                                <div className="flex gap-2">
                                                    <div className="w-[54px] h-[54px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                                                        <span className="material-icons-outlined">{plan.icon}</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={plan.icon}
                                                        onChange={e => handleUpdateSponsorshipPlan(idx, 'icon', e.target.value)}
                                                        className="form-input font-bold flex-1"
                                                        placeholder="Ex: emoji_events"
                                                    />
                                                </div>
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-3">
                                            <FormGroup label="COR (TAILWIND CLASS)" fullWidth>
                                                <div className="flex gap-2">
                                                    <div className={`w-[54px] h-[54px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-${plan.color}`}>
                                                        <div className={`w-3 h-3 rounded-full bg-current`}></div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={plan.color}
                                                        onChange={e => handleUpdateSponsorshipPlan(idx, 'color', e.target.value)}
                                                        className="form-input font-bold flex-1"
                                                        placeholder="Ex: amber-500"
                                                    />
                                                </div>
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-6 flex items-end pb-1">
                                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest pl-2">As cores e ícones seguem o padrão Material e Tailwind CSS.</p>
                                        </div>

                                        <div className="md:col-span-6">
                                            <FormGroup label="EXPOSIÇÃO DE MARCA & BENEFÍCIOS (UM POR LINHA)" fullWidth>
                                                <textarea
                                                    value={plan.benefits.join('\n')}
                                                    onChange={e => handleUpdateSponsorshipPlan(idx, 'benefits', e.target.value.split('\n'))}
                                                    className="form-input min-h-[220px] text-[13px] sm:text-sm text-green-400 font-bold leading-relaxed py-4 custom-scrollbar w-full"
                                                    placeholder="Ex: Logo na fachada principal\nPainel Bem-Vindos..."
                                                />
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-6">
                                            <FormGroup label="ENCARGOS ESTRUTURANTE (UM POR LINHA)" fullWidth>
                                                <textarea
                                                    value={plan.structural_responsibilities.join('\n')}
                                                    onChange={e => handleUpdateSponsorshipPlan(idx, 'structural_responsibilities', e.target.value.split('\n'))}
                                                    className="form-input min-h-[220px] text-[13px] sm:text-sm text-gray-300 font-medium leading-relaxed py-4 custom-scrollbar w-full"
                                                    placeholder="Ex: Paisagismo externo\nIluminação arquitetônica..."
                                                />
                                            </FormGroup>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-3 opacity-40">
                                            <div className={`w-8 h-8 rounded-lg bg-${plan.color}/20 flex items-center justify-center text-${plan.color}`}>
                                                <span className="material-icons-outlined text-base">{plan.icon}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Preview visual no site habilitado</span>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleDeleteSponsorshipPlan(idx)}
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20"
                                            >
                                                Excluir Plano
                                            </button>
                                            <button
                                                onClick={() => handleSaveContent('sponsorship_plans', sponsorshipPlans)}
                                                disabled={isSavingContent}
                                                className="bg-primary hover:bg-primary/90 text-white px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-neon-pink"
                                            >
                                                {isSavingContent ? 'Salvando...' : 'Salvar Plano de Patrocínio'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center pb-12">
                            <button
                                onClick={() => handleSaveContent('sponsorship_plans', sponsorshipPlans)}
                                disabled={isSavingContent}
                                className="btn-save shadow-neon-blue w-full max-w-md py-6 h-auto"
                            >
                                <span className="material-icons-outlined text-sm">cloud_sync</span>
                                {isSavingContent ? 'Salvando...' : 'Salvar Todos Planos de Patrocínio'}
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'vip' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <SectionHeader title="Gestão Planos VIP" subtitle="Preços, Períodos e Benefícios" />
                            <button
                                onClick={handleAddVipPlan}
                                className="bg-primary/20 hover:bg-primary/40 text-primary px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <span className="material-icons-outlined text-sm">add_circle</span>
                                Novo Plano VIP
                            </button>
                        </div>

                        <div className="space-y-8 mb-12">
                            {vipPlans.map((plan, idx) => (
                                <div key={plan.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden transition-all hover:bg-white/11">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-12 flex items-center gap-4 mb-2 pb-4 border-b border-white/5">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg">
                                                <span className="material-icons-outlined">diamond</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black uppercase text-base tracking-tight">{plan.title || 'Novo Plano VIP'}</h4>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mt-1">ID: {plan.id}</p>
                                            </div>
                                        </div>

                                        <div className="md:col-span-4">
                                            <FormGroup label="TÍTULO DO PLANO">
                                                <input
                                                    type="text"
                                                    value={plan.title}
                                                    onChange={e => handleUpdateVipPlan(idx, 'title', e.target.value)}
                                                    className="form-input font-bold text-white text-sm"
                                                />
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-4">
                                            <FormGroup label="PREÇO (EX: 189,90)">
                                                <input
                                                    type="text"
                                                    value={plan.price}
                                                    onChange={e => handleUpdateVipPlan(idx, 'price', e.target.value)}
                                                    className="form-input text-primary font-bold text-sm"
                                                />
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-4">
                                            <FormGroup label="PERÍODO (EX: MÊS)">
                                                <input
                                                    type="text"
                                                    value={plan.period}
                                                    onChange={e => handleUpdateVipPlan(idx, 'period', e.target.value)}
                                                    className="form-input text-gray-400 text-sm"
                                                />
                                            </FormGroup>
                                        </div>

                                        <div className="md:col-span-12">
                                            <FormGroup label="BENEFÍCIOS (UM POR LINHA)" fullWidth>
                                                <textarea
                                                    value={plan.features.join('\n')}
                                                    onChange={e => handleUpdateVipPlan(idx, 'features', e.target.value.split('\n'))}
                                                    className="form-input min-h-[160px] text-sm text-gray-300 leading-relaxed py-4 custom-scrollbar"
                                                />
                                            </FormGroup>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                                        <button
                                            onClick={() => handleDeleteVipPlan(idx)}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20"
                                        >
                                            Excluir VIP
                                        </button>
                                        <button
                                            onClick={handleSyncVipPlans}
                                            disabled={isSavingContent}
                                            className="bg-primary hover:bg-primary/90 text-white px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-neon-pink"
                                        >
                                            {isSavingContent ? 'Salvando...' : 'Salvar Plano VIP'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center pb-12">
                            <button
                                onClick={handleSyncVipPlans}
                                disabled={isSavingContent}
                                className="btn-save shadow-neon-pink w-full max-w-md py-6 h-auto"
                            >
                                <span className="material-icons-outlined text-sm">auto_awesome</span>
                                {isSavingContent ? 'Salvando...' : 'Salvar Todos Planos VIP'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// Helper Components
const SidebarButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap lg:whitespace-normal shrink-0 ${active ? 'bg-primary text-white shadow-neon-pink scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
        <span className="material-icons-outlined text-base sm:text-lg">{icon}</span> {label}
    </button>
);

const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-6 sm:mb-10">
        <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tighter italic lg:text-3xl">{title}</h3>
        <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black mt-1 tracking-[0.2em]">{subtitle}</p>
    </div>
);

const FormGroup = ({ label, children, className, fullWidth }: { label: string, children: React.ReactNode, className?: string, fullWidth?: boolean }) => (
    <div className={`w-full ${fullWidth ? 'col-span-1 sm:col-span-2' : ''} ${className || ''}`}>
        <label className="text-[9px] sm:text-[10px] text-primary uppercase font-black block mb-2 ml-2 sm:ml-4 tracking-[0.15em] opacity-80">{label}</label>
        {children}
    </div>
);

const ContentBlock = ({ title, color, children }: { title: string, color: string, children: React.ReactNode }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-[3rem] p-5 sm:p-8 relative overflow-hidden">
        <div className="mb-6 sm:mb-8 flex items-center gap-4">
            <div className={`w-2 h-8 sm:w-2.5 sm:h-10 ${color} rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] flex-shrink-0`}></div>
            <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.25em]">{title}</h4>
        </div>
        {children}
    </div>
);

const RoadmapCard: React.FC<{ m: RoadmapMilestone, onEdit: () => void, onDelete: () => any }> = ({ m, onEdit, onDelete }) => (
    <div className="group flex items-center gap-3 sm:gap-5 p-3 sm:p-5 bg-white/5 border border-white/10 rounded-2xl sm:rounded-[2rem] hover:bg-white/10 hover:border-white/20 transition-all duration-300">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${m.status === 'current' ? 'bg-primary/20 border border-primary/40 shadow-neon-pink/20' : 'bg-black/40 border border-white/5'}`}>
            <span className={`text-base sm:text-lg font-display font-black ${m.status === 'current' ? 'text-primary' : 'text-gray-500'}`}>{m.version}</span>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h4 className="text-white font-bold text-xs sm:text-sm tracking-tight truncate max-w-[150px] sm:max-w-none">{m.title}</h4>
                <span className={`px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-tighter ${m.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : m.status === 'current' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                    {m.status === 'completed' ? 'Fim' : m.status === 'current' ? 'On' : 'Off'}
                </span>
            </div>
            <p className="text-[8px] sm:text-[9px] text-gray-500 font-black uppercase tracking-widest">{m.date}</p>
        </div>
        <div className="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="w-8 h-8 sm:w-9 sm:h-9 bg-white/5 rounded-lg sm:rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary/20 transition-all border border-white/10 flex-shrink-0"><span className="material-icons-outlined text-xs sm:text-sm">edit</span></button>
            <button onClick={onDelete} className="w-8 h-8 sm:w-9 sm:h-9 bg-white/5 rounded-lg sm:rounded-xl flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/10 flex-shrink-0"><span className="material-icons-outlined text-xs sm:text-sm">delete</span></button>
        </div>
    </div>
);

const EmptyState = ({ icon, text }: { icon: string, text: string }) => (
    <div className="text-center py-10 sm:py-20 border-2 border-dashed border-white/5 rounded-2xl sm:rounded-[2.5rem] bg-white/[0.02]">
        <span className="material-icons-outlined text-3xl sm:text-4xl text-gray-800 block mb-4">{icon}</span>
        <p className="text-gray-600 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] italic">{text}</p>
    </div>
);
