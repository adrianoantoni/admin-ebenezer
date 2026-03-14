import React from 'react';

interface AvatarPlaceholderProps {
    name?: string;
    id?: string;
    photoUrl?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({
    name = 'User',
    id = '',
    photoUrl,
    size = 'md',
    className = ''
}) => {
    // If there's a photoUrl, use it
    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={name}
                className={className || getSizeClass(size)}
                onError={(e) => {
                    // If image fails to load, replace with SVG placeholder
                    e.currentTarget.style.display = 'none';
                    const svg = e.currentTarget.nextElementSibling;
                    if (svg) (svg as HTMLElement).style.display = 'block';
                }}
            />
        );
    }

    // Generate initials from name
    const initials = name
        .split(' ')
        .filter(word => word.length > 0)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join('');

    // Generate a deterministic color from the ID or name
    const color = generateColor(id || name);

    return (
        <div
            className={className || `${getSizeClass(size)} flex items-center justify-center font-semibold text-white`}
            style={{ backgroundColor: color }}
        >
            {initials || name[0]?.toUpperCase() || 'U'}
        </div>
    );
};

// Generate deterministic color from string
function generateColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate pleasant colors with good contrast
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash) % 15); // 65-80%
    const lightness = 45 + (Math.abs(hash >> 8) % 10); // 45-55%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Size class mappings
function getSizeClass(size: string): string {
    const sizeMap: Record<string, string> = {
        sm: 'w-8 h-8 rounded-lg text-xs',
        md: 'w-10 h-10 rounded-xl text-sm',
        lg: 'w-12 h-12 rounded-2xl text-base',
        xl: 'w-14 h-14 rounded-2xl text-lg'
    };
    return sizeMap[size] || sizeMap.md;
}

export default AvatarPlaceholder;
