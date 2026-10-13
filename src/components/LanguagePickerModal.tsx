import React, { useState } from 'react';
import { X, Check, Globe, Search } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  LanguageInfo,
  getTranslation,
} from '../utils/i18n';

interface LanguagePickerModalProps {
  currentLanguage: SupportedLanguage;
  onClose: () => void;
  onSelectLanguage: (lang: SupportedLanguage) => void;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  currentLanguage,
  onClose,
  onSelectLanguage,
}) => {
  const [search, setSearch] = useState('');
  const t = (key: string) => getTranslation(currentLanguage, key);

  const filtered = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 max-w-[430px] mx-auto select-none animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-[#182230] rounded-3xl border border-amber-500/30 w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#d97706] via-[#ea580c] to-[#b45309] px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-white" />
            <h3 className="font-display font-extrabold text-sm text-white tracking-wide">
              {t('selectLanguage')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/25 text-white flex items-center justify-center active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#131b26] border-b border-white/5 shrink-0">
          <div className="bg-[#1a2332] border border-slate-700/70 rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language / भाषा खोजें..."
              className="bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Language List */}
        <div className="p-3 space-y-2 overflow-y-auto flex-1 no-scrollbar divide-y divide-white/5">
          {filtered.map((lang: LanguageInfo) => {
            const isSelected = lang.code === currentLanguage;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`w-full pt-2.5 pb-2.5 px-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#ff7b1b]/15 border border-[#ff7b1b]/40 text-white'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{lang.flag}</span>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span className={isSelected ? 'text-[#ff8a1e]' : 'text-white'}>
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({lang.name})
                      </span>
                    </div>
                    <div className="text-[10px] font-mono-num text-slate-500 uppercase">
                      Code: {lang.code}
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-600/60" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Close Strip */}
        <div className="p-3 bg-[#131b26] border-t border-white/5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-[#243042] text-slate-200 text-xs font-bold active:scale-95 cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
