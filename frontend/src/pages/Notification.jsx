// src/components/Notification.jsx
import React, { useEffect, useRef, useState } from 'react';
import { notificationsAPI } from '../services/api'; // adjust path if needed
import axios from 'axios';

/**
 * Notification component
 *
 * Props:
 *  - socket (optional): socket.io client instance; component will listen to 'notification' events
 *  - initialFetch (optional, default true): whether to fetch notifications on mount
 *  - pageSize (optional, default 8): items per page for the dropdown's client-side pagination
 *  - embedded (optional, default false): when true, render ONLY the dropdown content (no bell trigger).
 *
 * Usage:
 *  // Standalone (has its own bell trigger)
 *  <Notification socket={socket} />
 *
 *  // Embedded (only content, suitable for header popover)
 *  <Notification embedded socket={socket} />
 */
export default function Notification({
  socket = null,
  initialFetch = true,
  pageSize = 8,
  embedded = false,
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false); // used only for standalone mode
  const [page, setPage] = useState(1);
  const containerRef = useRef(null);

  // fetch notifications (uses your notificationsAPI.getAll())
  async function fetchNotifications() {
    try {
      const res = await notificationsAPI.getAll(); // expecting { notifications, meta } or array
      // support both shapes: { notifications: [], meta: {} } or raw array
      const items = Array.isArray(res?.data) ? res.data : res?.data?.notifications ?? [];
      setNotifications(items);
      // compute unread count from payload; fallback to an additional call if missing
      const unread = items.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('fetchNotifications error', err);
    }
  }

  // mark a single notification as read
  async function handleMarkAsRead(id) {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (String(n._id || n.id) === String(id) ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('markAsRead error', err);
    }
  }

  // mark all as read (backend route: PATCH /api/notifications/read-all)
  async function handleMarkAllRead() {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('markAllRead error', err);
    }
  }

  // handle incoming realtime notification (socket)
  function onRealtimeNotification(payload) {
    // payload should resemble the notification document; adapt if your socket sends wrapped event
    const n = payload?.notification ?? payload;
    if (!n) return;
    setNotifications((prev) => [n, ...prev]);
    setUnreadCount((c) => c + 1);
    // do not auto-open the dropdown here
  }

  // click outside -> close dropdown (only for standalone mode)
  useEffect(() => {
    if (embedded) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [embedded]);

  // initial fetch
  useEffect(() => {
    if (initialFetch) fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // socket listeners
  useEffect(() => {
    if (!socket) return;
    // assume socket emits 'notification' with payload = notification document
    socket.on('notification', onRealtimeNotification);
    return () => {
      socket.off('notification', onRealtimeNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // pagination helpers (client-side)
  const pages = Math.max(1, Math.ceil(notifications.length / pageSize));
  const pageItems = notifications.slice((page - 1) * pageSize, page * pageSize);

  // Dropdown content shared by standalone and embedded modes
  const DropdownContent = (
    <div className="w-96 bg-white border rounded shadow-lg z-50">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="font-semibold">Notifications</div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllRead}
            className="text-sm px-2 py-1 rounded hover:bg-gray-100"
            title="Mark all read"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-auto">
        {notifications.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-600">No notifications</div>
        )}

        {pageItems.map((n) => {
          const id = n._id ?? n.id;
          return (
            <div
              key={id}
              className={`flex items-start gap-3 px-4 py-3 border-b hover:bg-gray-50 ${
                n.read ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-xs text-gray-400 ml-2">
                    {new Date(n.createdAt || n.created_at || Date.now()).toLocaleString()}
                  </div>
                </div>

                {n.body && <div className="mt-1 text-sm text-gray-700 truncate">{n.body}</div>}

                <div className="mt-2 flex items-center gap-2">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(id)}
                      className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      Mark read
                    </button>
                  )}

                  {/* optional contextual link to project if provided */}
                  {n.project && (
                    <a
                      href={`/projects/${n.project}`}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      Open project
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination controls (client-side) */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <div className="text-xs text-gray-500">
            Page {page} of {pages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 text-sm rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-2 py-1 text-sm rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Standalone mode: show internal bell trigger + dropdown
  if (!embedded) {
    return (
      <div className="relative" ref={containerRef}>
        {/* Trigger */}
        <button
          onClick={() => {
            setOpen((v) => !v);
            if (!open) {
              // when opening, optionally refresh notifications
              fetchNotifications().catch(() => {});
              setPage(1);
            }
          }}
          aria-haspopup="true"
          aria-expanded={open}
          className="relative inline-flex items-center p-2 rounded hover:bg-gray-100 focus:outline-none"
        >
          {/* Bell icon (simple) */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3.6c0 .538-.214 1.055-.595 1.445L4 17h11z"
            />
          </svg>

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && <div className="absolute right-0 mt-2">{DropdownContent}</div>}
      </div>
    );
  }

  // Embedded mode: render only the dropdown content (no trigger/wrapper)
  return <div ref={containerRef}>{DropdownContent}</div>;
}
