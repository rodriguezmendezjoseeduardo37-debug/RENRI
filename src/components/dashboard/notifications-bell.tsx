"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { 
    getUserNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} from "@/actions/notifications";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Notification = {
    id: string;
    type: string;
    title: string;
    content: string | null;
    isRead: boolean;
    actionUrl: string | null;
    createdAt: Date;
};

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const popoverRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const data = await getUserNotifications(10);
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll every 1 minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        }
        
        if (notification.actionUrl) {
            setIsOpen(false);
            router.push(notification.actionUrl);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all focus:outline-none"
                aria-label="Notificaciones"
            >
                <Bell className="h-5 w-5" strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl shadow-2xl border border-border/50 animate-in fade-in slide-in-from-top-4 duration-300 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-foreground">
                            Notificaciones {unreadCount > 0 && <span className="ml-1 text-muted-foreground">({unreadCount})</span>}
                        </h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] uppercase font-bold tracking-wider text-[#08b6ff] hover:text-[#08b6ff]/80 transition-colors"
                            >
                                Marcar leídas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">Cargando...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <Bell className="h-8 w-8 opacity-20" />
                                <span className="text-xs">No tienes notificaciones</span>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notification) => (
                                    <div 
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex flex-col gap-1 p-4 cursor-pointer transition-colors border-b border-border/30 last:border-0 ${
                                            !notification.isRead ? 'bg-accent/30 hover:bg-accent/50' : 'hover:bg-accent/40'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className={`text-sm font-semibold leading-none ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {notification.title}
                                            </h4>
                                            {!notification.isRead && (
                                                <span className="h-2 w-2 mt-0.5 rounded-full bg-[#08b6ff] flex-shrink-0" />
                                            )}
                                        </div>
                                        {notification.content && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                {notification.content}
                                            </p>
                                        )}
                                        <span className="text-[10px] text-muted-foreground mt-2 font-medium">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
