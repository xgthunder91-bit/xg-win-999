import React, { useState } from 'react';
import {
  ChevronLeft,
  Mail,
  MailOpen,
  Trash2,
  CheckCheck,
  FileText,
  AlertCircle,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  summary: string;
  content: string;
  isRead: boolean;
  type: 'user' | 'platform';
}

interface NotificationViewProps {
  notifications: NotificationItem[];
  onBack: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

export const NotificationView: React.FC<NotificationViewProps> = ({
  notifications,
  onBack,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'user' | 'platform'>('user');
  const [selectedMessage, setSelectedMessage] = useState<NotificationItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const filteredNotifications = notifications.filter((item) => item.type === activeTab);
  const unreadCount = filteredNotifications.filter((item) => !item.isRead).length;

  const handleOpenDetail = (item: NotificationItem) => {
    if (!item.isRead) {
      onMarkAsRead(item.id);
    }
    setSelectedMessage(item);
  };

  const handleDeleteSelected = () => {
    if (selectedMessage) {
      onDeleteNotification(selectedMessage.id);
      setSelectedMessage(null);
      showToast('Message deleted successfully');
    }
  };

  return (
    <div className="min-h-screen bg-[#111923] text-white flex flex-col select-none relative">
      {/* If Viewing Message Detail */}
      {selectedMessage ? (
        <div className="flex-1 flex flex-col">
          {/* Header (/messagesDetail) */}
          <header className="sticky top-0 z-30 bg-[#111923] px-4 py-3.5 flex items-center justify-between border-b border-white/5">
            <button
              type="button"
              onClick={() => setSelectedMessage(null)}
              className="p-1 text-slate-200 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-base font-bold text-white">Messages Detail</h1>
            <div className="w-6" />
          </header>

          {/* Message Content Container */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div className="bg-[#1a2332] rounded-2xl p-4 border border-white/5 shadow-md">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff8a1e]/20 to-[#ea580c]/30 border border-[#ff8a1e]/30 flex items-center justify-center text-[#ff8a1e] shrink-0">
                  <MailOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-white leading-tight">
                    {selectedMessage.title}
                  </h2>
                  <div className="text-[11px] font-mono-num text-slate-400 mt-1">
                    {selectedMessage.time}
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/10 my-3" />

              <div className="text-xs text-slate-300 leading-relaxed space-y-3 whitespace-pre-line">
                {selectedMessage.content}
              </div>
            </div>

            {/* Bottom Delete Button */}
            <div className="pt-6 pb-6">
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="w-full py-3.5 rounded-full bg-[#1e293b] border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer shadow-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete Message</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Notification List View */
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#111923] px-4 py-3.5 flex items-center justify-between border-b border-white/5">
            <button
              type="button"
              onClick={onBack}
              className="p-1 text-slate-200 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-base font-bold text-white">Notification</h1>
            <div className="w-6" />
          </header>

          {/* Tabs: User & Platform (01:10 in video) */}
          <div className="bg-[#182230] px-4 pt-2 border-b border-white/5">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab('user')}
                className={`flex-1 py-3 text-xs font-bold text-center relative cursor-pointer transition-colors ${
                  activeTab === 'user' ? 'text-[#ff8a1e]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>User</span>
                {notifications.filter((n) => n.type === 'user' && !n.isRead).length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#ff7b1b] text-white text-[10px] font-mono-num font-bold">
                    {notifications.filter((n) => n.type === 'user' && !n.isRead).length}
                  </span>
                )}
                {activeTab === 'user' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#ff8a1e] rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('platform')}
                className={`flex-1 py-3 text-xs font-bold text-center relative cursor-pointer transition-colors ${
                  activeTab === 'platform'
                    ? 'text-[#ff8a1e]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Platform</span>
                {activeTab === 'platform' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#ff8a1e] rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* List or Empty State */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-[#1a2332] flex items-center justify-center text-slate-600 mb-4 border border-white/5">
                  <FileText className="w-12 h-12 stroke-[1.2]" />
                </div>
                <div className="text-sm font-semibold text-slate-300">No data</div>
                <div className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  {activeTab === 'user'
                    ? 'No notifications yet'
                    : 'No platform notices at this moment'}
                </div>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={`bg-[#1a2332] rounded-2xl p-3.5 border transition-all cursor-pointer active:scale-[0.99] relative overflow-hidden ${
                    !item.isRead
                      ? 'border-[#ff8a1e]/40 shadow-[0_2px_12px_rgba(255,138,30,0.15)]'
                      : 'border-white/5 opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Red Unread Dot Indicator */}
                  {!item.isRead && (
                    <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
                  )}

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        !item.isRead
                          ? 'bg-[#ff8a1e]/20 border-[#ff8a1e]/40 text-[#ff8a1e]'
                          : 'bg-[#131b26] border-slate-700/60 text-slate-400'
                      }`}
                    >
                      <Mail className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`text-xs font-bold truncate ${
                            !item.isRead ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <div className="text-[11px] font-mono-num text-slate-500 mt-0.5">
                        {item.time}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-snug">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sticky Bottom Actions Bar (01:12 in video) */}
          {filteredNotifications.length > 0 && (
            <div className="sticky bottom-0 bg-[#111923]/95 backdrop-blur-md px-4 py-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  onMarkAllAsRead();
                  showToast('All notifications marked as read');
                }}
                disabled={unreadCount === 0}
                className={`w-full py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  unreadCount > 0
                    ? 'bg-gradient-to-r from-[#ff9a2e] to-[#ff6300] text-white shadow-lg active:scale-95'
                    : 'bg-[#1e293b] text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                <span>Read all</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center max-w-[430px] mx-auto">
          <div className="bg-black/85 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-white/10">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};
