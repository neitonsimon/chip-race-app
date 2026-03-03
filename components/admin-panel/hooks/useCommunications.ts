import { useState } from 'react';

interface UseCommunicationsProps {
    onSendAdminMessage?: (subject: string, content: string, category: 'admin' | 'system' | 'tournament') => void;
    onCreatePoll?: (question: string, options: string[]) => void;
}

export function useCommunications({ onSendAdminMessage, onCreatePoll }: UseCommunicationsProps) {
    const [adminSubject, setAdminSubject] = useState('');
    const [adminMsgContent, setAdminMsgContent] = useState('');
    const [adminMsgCategory, setAdminMsgCategory] = useState<'admin' | 'system' | 'tournament'>('admin');
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    const handleSendBroadcast = () => {
        if (onSendAdminMessage && adminSubject && adminMsgContent) {
            onSendAdminMessage(adminSubject, adminMsgContent, adminMsgCategory);
            setAdminSubject('');
            setAdminMsgContent('');
            alert('Comunicado Global enviado!');
        }
    };

    const handleCreatePollSubmit = () => {
        const validOptions = pollOptions.filter(o => o.trim());
        if (onCreatePoll && pollQuestion && validOptions.length >= 2) {
            onCreatePoll(pollQuestion, validOptions);
            setPollQuestion('');
            setPollOptions(['', '']);
            alert('Enquete publicada!');
        }
    };

    return {
        adminSubject, setAdminSubject,
        adminMsgContent, setAdminMsgContent,
        adminMsgCategory, setAdminMsgCategory,
        pollQuestion, setPollQuestion,
        pollOptions, setPollOptions,
        handleSendBroadcast,
        handleCreatePollSubmit
    };
}
