import React from 'react';
import type { TimelineEvent } from '../../types/dispute';
import { EscrowBadge } from '../common/Badge';
import { Clock, User, Shield, Sparkles, ArrowRight, UserCheck } from 'lucide-react';

interface EscrowTimelineProps {
  timeline: TimelineEvent[];
}

export const EscrowTimeline: React.FC<EscrowTimelineProps> = ({ timeline }) => {
  const getActorBadge = (actor: TimelineEvent['actor'], actorName: string) => {
    switch (actor) {
      case 'escrow_system':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Shield className="w-2.5 h-2.5" />
            <span>{actorName}</span>
          </span>
        );
      case 'buyer':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <User className="w-2.5 h-2.5" />
            <span>{actorName}</span>
          </span>
        );
      case 'seller':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <User className="w-2.5 h-2.5" />
            <span>{actorName}</span>
          </span>
        );
      case 'ai_system':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{actorName}</span>
          </span>
        );
      case 'reviewer':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <UserCheck className="w-2.5 h-2.5" />
            <span>{actorName}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Chronological Audit & Escrow Timeline
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {timeline.length} Recorded Events
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timeline.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-slate-900 bg-indigo-500 group-hover:bg-indigo-400 transition-colors shadow-sm" />

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-200">{event.action}</span>
                  {getActorBadge(event.actor, event.actorName)}
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(event.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {event.description}
              </p>

              {/* State Transition if present */}
              {event.fromState && event.toState && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center space-x-2 text-[11px] font-mono">
                  <span className="text-slate-500 text-[10px]">State Change:</span>
                  <EscrowBadge state={event.fromState} className="scale-90 origin-left" />
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <EscrowBadge state={event.toState} className="scale-90 origin-left" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
