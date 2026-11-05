import React, { useState } from 'react';
import type { EvidenceItem } from '../../types/dispute';
import { Image, MessageSquare, BookOpen, ExternalLink, Calendar, Tag, Sparkles } from 'lucide-react';

interface EvidenceViewerProps {
  evidence: EvidenceItem[];
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ evidence }) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'chat' | 'policy'>('photos');
  const [selectedImage, setSelectedImage] = useState<EvidenceItem | null>(null);

  const photos = evidence.filter((e) => e.type === 'photo' || e.type === 'receipt');
  const chatLogs = evidence.filter((e) => e.type === 'chat_log');
  const policies = evidence.filter((e) => e.type === 'policy_clause');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'photos'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Photos & OCR ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Logs ({chatLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'policy'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Marketplace Policy ({policies.length})</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          {evidence.length} Total Evidence Artifacts
        </span>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[520px]">
        
        {/* PHOTOS & OCR TAB */}
        {activeTab === 'photos' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden hover:border-slate-700 transition-all flex flex-col"
              >
                {/* Image Container */}
                <div
                  className="h-44 w-full bg-slate-900 relative overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(item)}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />
                  
                  {/* Badge Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md uppercase tracking-wider ${
                        item.submittedBy === 'buyer'
                          ? 'bg-sky-500/80 text-white'
                          : item.submittedBy === 'seller'
                          ? 'bg-emerald-500/80 text-white'
                          : 'bg-indigo-500/80 text-white'
                      }`}
                    >
                      {item.submittedBy}
                    </span>
                    {item.tags?.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-900/80 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-slate-900/90 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1">
                      {item.title}
                    </h4>
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* AI Vision Highlight Annotation if available */}
                  {item.aiAnnotation && (
                    <div className="mt-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-start space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] text-indigo-300 font-medium leading-snug">
                        {item.aiAnnotation}
                      </span>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </span>
                    <span>{item.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CHAT LOGS TAB */}
        {activeTab === 'chat' && (
          <div className="space-y-3">
            {chatLogs.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-300 flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{item.title}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-mono">
                  "{item.notes}"
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                  <Tag className="w-3 h-3" />
                  <span>Authenticated via Marketplace In-App Messaging Engine</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* POLICY TAB */}
        {activeTab === 'policy' && (
          <div className="space-y-3">
            {policies.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex flex-col space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Binding Marketplace Policy
                    </span>
                    <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400">Section Grounding</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {item.notes}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal Lightbox for Image Inspection */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">{selectedImage.title}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono px-2 py-1 rounded bg-slate-800"
              >
                ESC / Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-hidden bg-black flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>
            <div className="p-4 text-xs text-slate-300 bg-slate-950/80 border-t border-slate-800">
              <p className="font-semibold text-slate-200 mb-1">Evidence Summary:</p>
              <p className="text-slate-400">{selectedImage.notes}</p>
              {selectedImage.aiAnnotation && (
                <div className="mt-2 p-2 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  <span className="font-bold">AI Computer Vision Note:</span> {selectedImage.aiAnnotation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
