// src/components/NotificationBell.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listNotifications, markAllNotificationsAsRead } from '../services/notifications';

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s`;
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const panelRef = useRef(null);

    async function fetchNotifications() {
        try {
            const data = await listNotifications();
            const results = data.results || data;
            setNotifications(results);
            // Revisa si alguna de las notificaciones no está leída
            setHasUnread(results.some(n => !n.is_read));
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }

    // Carga inicial y polling cada 30 segundos
    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 30000);
        return () => clearInterval(intervalId);
    }, []);

    // Cierra el panel si se hace clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [panelRef]);


    const handleToggle = async () => {
        setIsOpen(!isOpen);
        // Si se abre el panel y hay notificaciones sin leer, se marcan como leídas
        if (!isOpen && hasUnread) {
            try {
                await markAllNotificationsAsRead();
                setHasUnread(false); // Actualiza el estado visualmente de inmediato
            } catch (error) {
                console.error("Error marking notifications as read:", error);
            }
        }
    };

    return (
        <div ref={panelRef} className="notification-bell-container">
            <button onClick={handleToggle} className="notification-bell-button">
                🔔
                {hasUnread && <span className="notification-dot"></span>}
            </button>
            
            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-panel-header">
                        <h3>Notificaciones</h3>
                    </div>
                    <div className="notification-list">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <Link to={n.link || '#'} key={n.id} className="notification-item" onClick={() => setIsOpen(false)}>
                                    <div className="notification-message">{n.message}</div>
                                    <div className="notification-time">{timeAgo(n.created_at)}</div>
                                </Link>
                            ))
                        ) : (
                            <div className="notification-empty">No tienes notificaciones.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}