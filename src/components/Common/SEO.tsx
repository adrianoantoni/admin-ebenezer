import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

interface SEOProps {
    title: string;
    description?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description }) => {
    const { state } = useApp();
    const churchName = state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú';

    useEffect(() => {
        const fullTitle = `${title} | ${churchName}`;
        document.title = fullTitle;

        if (description) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            } else {
                metaDescription = document.createElement('meta');
                metaDescription.setAttribute('name', 'description');
                metaDescription.setAttribute('content', description);
                document.head.appendChild(metaDescription);
            }
        }
    }, [title, description]);

    return null;
};

export default SEO;
