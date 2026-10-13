"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABELS, useRole, type Role } from "@/lib/roleContext";

interface Notification {
  id: number;
  message: string;
  read: boolean;
  relatedUseCaseId: number | null;
}

const NAV_LINKS = [
  { href: "/", label: "Portfolio" },
  { href: "/submit", label: "Submit Use Case" },
  { href: "/company-knowledge", label: "Company Knowledge" },
];

export default function NavBar() {
  const { role, name, setRole, setName } = useRole();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/notifications?role=${role}`);
      if (!cancelled && res.ok) {
        setNotifications(await res.json());
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [role]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
        <Link href="/" className="font-semibold text-lg text-teal-700">
          ROI-Align
        </Link>
        <nav className="flex gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                pathname === l.href ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications((s) => !s);
                if (!showNotifications) markAllRead();
              }}
              className="relative px-2 py-1.5 text-sm rounded-md hover:bg-slate-100"
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">No notifications yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <li key={n.id} className="p-3 text-sm">
                        {n.relatedUseCaseId ? (
                          <Link href={`/use-cases/${n.relatedUseCaseId}`} className="text-teal-700 hover:underline">
                            {n.message}
                          </Link>
                        ) : (
                          n.message
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="text-sm border border-slate-300 rounded-md px-2 py-1.5 bg-white"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm border border-slate-300 rounded-md px-2 py-1.5 w-32"
            placeholder="Your name"
          />
        </div>
      </div>
      <p className="bg-amber-50 text-amber-900 text-xs text-center py-1 px-2">
        Demo mock-up with fictional data only. The AI supports decisions; it does not make binding compliance,
        legal, or final start/stop/continue decisions — humans do.
      </p>
    </header>
  );
}
