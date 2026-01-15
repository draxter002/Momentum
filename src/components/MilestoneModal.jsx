import { useState, useEffect } from 'react';
import milestoneRepository from '../db/milestoneRepository';
import { TIER_COLORS } from '../lib/milestones';

export default function MilestoneModal({ isOpen, onClose, userId, currentStreak }) {
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    if (isOpen && userId) {
      loadMilestones();
    }
  }, [isOpen, userId]);

  const loadMilestones = async () => {
    const allMilestones = await milestoneRepository.getAllMilestones(userId);
    setMilestones(allMilestones);
  };

  const getMilestonesByTier = (tier) => {
    return milestones.filter((m) => m.tier === tier);
  };

  const getTierTitle = (tier) => {
    const titles = {
      early: 'Early Achievements',
      intermediate: 'Intermediate Challenges',
      advanced: 'Advanced Feats',
      legendary: 'Legendary Milestones',
    };
    return titles[tier] || tier;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Gold Streak Milestones</h2>
            <p className="text-gray-400">
              Current Streak: <span className="text-amber-400 font-semibold">{currentStreak} days</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {['early', 'intermediate', 'advanced', 'legendary'].map((tier) => {
            const tierMilestones = getMilestonesByTier(tier);
            if (tierMilestones.length === 0) return null;

            return (
              <div key={tier} className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className={`text-xl font-bold ${TIER_COLORS[tier]?.text || 'text-gray-400'}`}>
                    {getTierTitle(tier)}
                  </h3>
                  <div className={`h-1 flex-1 rounded ${TIER_COLORS[tier]?.bg || 'bg-gray-700'}`}></div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {tierMilestones.map((milestone) => (
                    <div
                      key={milestone.days}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all duration-300
                        ${
                          milestone.achieved
                            ? `${TIER_COLORS[tier]?.border} ${TIER_COLORS[tier]?.bg} shadow-lg ${TIER_COLORS[tier]?.glow}`
                            : 'border-gray-700 bg-gray-800 opacity-50 grayscale'
                        }
                      `}
                    >
                      {milestone.achieved && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-green-500 rounded-full p-1">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {milestone.achieved && milestone.count > 1 && (
                        <div className="absolute -top-2 -left-2">
                          <div className="bg-amber-500 rounded-full px-2 py-1 shadow-lg border-2 border-amber-300">
                            <span className="text-xs font-bold text-white">×{milestone.count}</span>
                          </div>
                        </div>
                      )}

                      <div className="text-center">
                        <div className={`text-5xl mb-2 ${milestone.achieved ? 'animate-pulse-slow' : ''}`}>
                          {milestone.emoji}
                        </div>
                        <h4 className={`font-semibold mb-1 ${milestone.achieved ? 'text-white' : 'text-gray-500'}`}>
                          {milestone.name}
                        </h4>
                        <p className={`text-sm ${milestone.achieved ? 'text-gray-300' : 'text-gray-600'}`}>
                          {milestone.days} {milestone.days === 1 ? 'day' : 'days'}
                        </p>
                        {milestone.achieved && milestone.achievedAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            {milestone.count > 1 ? `Last claimed: ` : 'Claimed '}{new Date(milestone.achievedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-850 text-center">
          <p className="text-sm text-gray-400">
            {milestones.filter((m) => m.achieved).length} of {milestones.length} milestones achieved
          </p>
        </div>
      </div>
    </div>
  );
}
