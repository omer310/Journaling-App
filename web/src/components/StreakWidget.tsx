'use client';

import { useMemo } from 'react';

// Custom flame component for streak display
const CustomFlame = ({ size = 'medium', streak = 0 }: { size?: 'small' | 'medium' | 'large', streak?: number }) => {
  const sizeClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4', 
    large: 'w-5 h-5'
  };
  
  const getFlameColors = (streak: number) => {
    const normalized = Math.min(streak / 100, 1);
    const colors = [
      { base: '#ff1100', left: '#ff3300', center: '#ff5500', right: '#ff7700', glow: '#ffff00' },
      { base: '#ff5500', left: '#ff7700', center: '#ff9900', right: '#ffbb00', glow: '#ffff44' },
      { base: '#ff9900', left: '#ffbb00', center: '#ffdd00', right: '#ffff00', glow: '#ffff88' },
      { base: '#00aa00', left: '#00cc00', center: '#00ee00', right: '#44ff44', glow: '#88ff88' },
      { base: '#0040ff', left: '#0060ff', center: '#0080ff', right: '#40a0ff', glow: '#80c0ff' },
      { base: '#4a148c', left: '#6a1b9a', center: '#8e24aa', right: '#ab47bc', glow: '#f3e5f5' }
    ];
    
    const segment = normalized * (colors.length - 1);
    const index = Math.floor(segment);
    const fraction = segment - index;
    
    const current = colors[index];
    const next = colors[Math.min(index + 1, colors.length - 1)];
    
    const interpolateColor = (color1: string, color2: string, frac: number) => {
      const hex1 = color1.replace('#', '');
      const hex2 = color2.replace('#', '');
      
      const r1 = parseInt(hex1.substr(0, 2), 16);
      const g1 = parseInt(hex1.substr(2, 2), 16);
      const b1 = parseInt(hex1.substr(4, 2), 16);
      
      const r2 = parseInt(hex2.substr(0, 2), 16);
      const g2 = parseInt(hex2.substr(2, 2), 16);
      const b2 = parseInt(hex2.substr(4, 2), 16);
      
      const r = Math.round(r1 + (r2 - r1) * frac);
      const g = Math.round(g1 + (g2 - g1) * frac);
      const b = Math.round(b1 + (b2 - b1) * frac);
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    
    return {
      base: interpolateColor(current.base, next.base, fraction),
      left: interpolateColor(current.left, next.left, fraction),
      center: interpolateColor(current.center, next.center, fraction),
      right: interpolateColor(current.right, next.right, fraction),
      glow: interpolateColor(current.glow, next.glow, fraction)
    };
  };
  
  const colors = getFlameColors(streak);
  
  return (
    <div className={`flame-container ${sizeClasses[size]}`}>
      <div 
        className="flame-base"
        style={{ background: `linear-gradient(to top, ${colors.base} 0%, ${colors.left} 50%, ${colors.center} 100%)` }}
      ></div>
      <div 
        className="flame-left"
        style={{ background: `linear-gradient(to top, ${colors.left} 0%, ${colors.center} 30%, ${colors.right} 60%, ${colors.glow} 85%, #ffffff 100%)` }}
      ></div>
      <div 
        className="flame-center"
        style={{ background: `linear-gradient(to top, ${colors.left} 0%, ${colors.center} 25%, ${colors.right} 50%, ${colors.glow} 75%, #ffffff 100%)` }}
      ></div>
      <div 
        className="flame-right"
        style={{ background: `linear-gradient(to top, ${colors.left} 0%, ${colors.center} 35%, ${colors.right} 65%, ${colors.glow} 90%, #ffffff 100%)` }}
      ></div>
      <div 
        className="flame-glow"
        style={{ background: `linear-gradient(to top, ${colors.glow} 0%, #ffffff 60%, rgba(255, 255, 255, 0.9) 100%)` }}
      ></div>
    </div>
  );
};

interface StreakWidgetProps {
  streak: number;
}

export function StreakWidget({ streak }: StreakWidgetProps) {
  // Calculate next badge and progress
  const { nextBadge, progress, progressPercentage } = useMemo(() => {
    // Define badge milestones
    const milestones = [3, 7, 14, 30, 60, 100, 365, 1000];
    
    // Find the next milestone
    const nextMilestone = milestones.find(milestone => streak < milestone) || milestones[milestones.length - 1];
    
    // Calculate progress towards next milestone (from 0 to next milestone)
    const progressPercentage = Math.min((streak / nextMilestone) * 100, 100);
    
    // Format next badge text
    let nextBadgeText = '';
    if (nextMilestone >= 365) {
      nextBadgeText = `${nextMilestone} days (${Math.floor(nextMilestone / 365)} year${Math.floor(nextMilestone / 365) > 1 ? 's' : ''})`;
    } else if (nextMilestone >= 30) {
      nextBadgeText = `${nextMilestone} days (${Math.floor(nextMilestone / 30)} month${Math.floor(nextMilestone / 30) > 1 ? 's' : ''})`;
    } else if (nextMilestone >= 7) {
      nextBadgeText = `${nextMilestone} days (${Math.floor(nextMilestone / 7)} week${Math.floor(nextMilestone / 7) > 1 ? 's' : ''})`;
    } else {
      nextBadgeText = `${nextMilestone} days`;
    }
    
    return {
      nextBadge: nextBadgeText,
      progress: streak,
      progressPercentage: progressPercentage
    };
  }, [streak]);

  // Get streak text
  const getStreakText = (streak: number) => {
    if (streak >= 365) return `${Math.floor(streak/365)} year streak`;
    if (streak >= 30) return `${Math.floor(streak/30)} month streak`;
    if (streak >= 7) return `${Math.floor(streak/7)} week streak`;
    return `${streak} day streak`;
  };

  return (
    <div className="lg:w-80 bg-surface rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <CustomFlame size="medium" streak={streak} />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Streak</h3>
          <p className="text-sm text-text-secondary">{getStreakText(streak)}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Next badge: {nextBadge}</span>
          <span className="text-primary font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
