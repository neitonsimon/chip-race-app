import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = "",
    variant = 'rectangular',
    width,
    height
}: SkeletonProps) => {
    const baseClass = "animate-pulse bg-white/5";
    const variantClass = variant === 'circular' ? 'rounded-full' : variant === 'text' ? 'rounded-md h-4 w-full' : 'rounded-2xl';

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClass} ${variantClass} ${className}`}
            style={style}
        />
    );
};

export const RankingSkeleton = () => (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-grow space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
        </div>
        <Skeleton variant="rectangular" width={60} height={24} />
    </div>
);

export const EventSkeleton = () => (
    <div className="bg-surface-dark border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-start">
            <div className="space-y-2 flex-grow">
                <Skeleton variant="text" width="40%" height={12} />
                <Skeleton variant="text" width="70%" height={24} />
            </div>
            <Skeleton variant="circular" width={40} height={40} />
        </div>
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
        </div>
        <div className="flex gap-2">
            <Skeleton variant="rectangular" height={36} className="flex-grow" />
            <Skeleton variant="rectangular" width={100} height={36} />
        </div>
    </div>
);

export const ProfileStatsSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-dark border border-white/5 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between">
                    <Skeleton variant="text" width="40%" height={24} />
                    <Skeleton variant="circular" width={24} height={24} />
                </div>
                <Skeleton variant="text" width="80%" height={12} />
            </div>
        ))}
    </div>
);
