import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API, request, json } from "../utils/api";
import { localDate } from "../utils/date";
import Avatar from "../components/Avatar";
import BrandLogo from "../components/BrandLogo";
import { applyColorTheme, colorThemes, saveColorTheme, validTheme } from "../utils/themes";
import {
  Activity, ArrowUpRight, Bell, CalendarDays, Check, CheckCheck,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Flame, History as HistoryIcon,
  ImagePlus, LayoutDashboard, ListTodo, Menu, MessageCircle, MoreHorizontal, Palette,
  Pause, Pencil, Play, Plus, Save, Search, Send, Settings2, SlidersHorizontal, Sparkles, Target,
  Trash2, UserRound, Users, X,
} from "lucide-react";

const menu = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "My tasks", icon: ListTodo },
  { id: "routines", label: "Routines", icon: CalendarDays },
  { id: "history", label: "History", icon: HistoryIcon },
  { id: "friends", label: "Your circle", icon: Users },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "assistant", label: "AI assistant", icon: MessageCircle },
];

const routineTemplates = [
  {
    id: "study",
    title: "Study",
    subtitle: "A focused plan for learning, practice, and steady progress.",
    icon: "S",
    routines: [
      { title: "DSA practice — 2 hours", description: "Work through data structures and algorithms with focused practice.", category: "study", timeOfDay: "morning", repeatType: "weekdays", minimumTarget: 1, normalTarget: 2 },
      { title: "Read — 30 minutes", description: "Read a textbook, course material, or a few pages of a good book.", category: "study", timeOfDay: "afternoon", repeatType: "daily", minimumTarget: 1, normalTarget: 1 },
      { title: "Revise today's notes", description: "Review key ideas and write down what you want to remember.", category: "study", timeOfDay: "evening", repeatType: "weekdays", minimumTarget: 1, normalTarget: 1 },
      { title: "Solve practice questions", description: "Apply what you studied with a few problems or a short quiz.", category: "study", timeOfDay: "evening", repeatType: "weekdays", minimumTarget: 1, normalTarget: 1 },
    ],
  },
  {
    id: "personal-growth",
    title: "Personal Growth",
    subtitle: "Make room for reflection, meaningful habits, and new skills.",
    icon: "G",
    routines: [
      { title: "Read for personal growth", description: "Spend a little time with a book that inspires or teaches you.", category: "development", timeOfDay: "morning", repeatType: "daily", minimumTarget: 1, normalTarget: 1 },
      { title: "Journal and reflect", description: "Write down a thought, something you learned, or what you are grateful for.", category: "personal", timeOfDay: "evening", repeatType: "daily", minimumTarget: 1, normalTarget: 1 },
      { title: "Practice a new skill", description: "Give one skill you care about a focused block of practice.", category: "development", timeOfDay: "afternoon", repeatType: "weekdays", minimumTarget: 1, normalTarget: 1 },
      { title: "Take a mindful pause", description: "Step away from distractions and reset with a few calm breaths.", category: "health", timeOfDay: "anytime", repeatType: "daily", minimumTarget: 1, normalTarget: 1 },
    ],
  },
  {
    id: "other",
    title: "Other",
    subtitle: "A flexible mix of everyday routines you can make your own.",
    icon: "O",
    routines: [
      { title: "Move your body", description: "Take a walk, stretch, or choose movement that feels right for you.", category: "fitness", timeOfDay: "morning", repeatType: "daily", minimumTarget: 1, normalTarget: 1 },
      { title: "Drink enough water", description: "Build a simple hydration check-in into your day.", category: "health", timeOfDay: "anytime", repeatType: "daily", minimumTarget: 1, normalTarget: 6 },
      { title: "Choose today's priority", description: "Decide what matters most and give it your attention.", category: "work", timeOfDay: "morning", repeatType: "weekdays", minimumTarget: 1, normalTarget: 1 },
      { title: "Reset your space", description: "Tidy one small area to make your surroundings feel calmer.", category: "personal", timeOfDay: "evening", repeatType: "weekly", weeklyTarget: 3, minimumTarget: 1, normalTarget: 1 },
    ],
  },
];

const dashboardThemes = [
  { id: "focus", title: "Focus", description: "Give today's routines and priorities the most space.", icon: Target },
  { id: "balanced", title: "Balanced", description: "Keep your progress, routines, and tasks in view together.", icon: Activity },
  { id: "compact", title: "Compact", description: "Fit more of your day into a tighter dashboard.", icon: LayoutDashboard },
];

export default function Workspace({ initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);
  const [view, setView] = useState("dashboard");
  const [data, setData] = useState({ dashboard: null, routines: [], tasks: [], notifications: [], friends: [], followers: [], connectionCounts: { followers: 0, following: 0 }, conversations: [], analytics: null });
  const [dataError, setDataError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  const flash = useCallback((message) => { setNotice(message); window.setTimeout(() => setNotice(""), 3200); }, []);
  useLayoutEffect(() => {
    const userId = initialUser.id || initialUser._id;
    const savedTheme = window.localStorage.getItem(`comeback-theme:${userId}`) || window.localStorage.getItem("comeback-theme");
    const legacyTheme = window.localStorage.getItem(`comeback-accent-${userId}`);
    const migratedTheme = { blue: "ocean-blue", green: "emerald", purple: "purple" }[legacyTheme] || "orange";
    applyColorTheme(validTheme(savedTheme) ? savedTheme : migratedTheme);
  }, [initialUser.id, initialUser._id]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      request(`/dashboard?date=${localDate()}`), request("/routines"),
      request("/tasks"), request("/social/notifications"),
      request("/social/following"), request("/social/followers"),
      request("/social/connections/counts"), request("/social/conversations"), request("/analytics"),
    ]).then(([dashboard, routines, tasks, notifications, friends, followers, connectionCounts, conversations, analytics]) => {
      if (active) setDataError("");
      if (active) setData({ dashboard, routines: routines?.routines || [], tasks: tasks?.tasks || [], notifications: notifications?.notifications || [], unread: notifications?.unread || 0, friends: friends?.users || [], followers: followers?.users || [], connectionCounts: { followers: connectionCounts?.followers || 0, following: connectionCounts?.following || 0 }, conversations: conversations?.conversations || [], analytics });
    }).catch((error) => {
      if (active) {
        setDataError(error.message);
        if (error.status === 401 || /authentication|session/i.test(error.message)) onLogout();
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, refreshKey, onLogout]);

  useEffect(() => {
    if (!user) return;
    const socket = io(API, { withCredentials: true, transports: ["websocket", "polling"] });
    socket.on("notification:new", (notification) => {
      setData((current) => ({ ...current, notifications: [notification, ...current.notifications], unread: (current.unread || 0) + 1 }));
    });
    return () => socket.disconnect();
  }, [user]);

  const signOut = async () => {
    try { await request("/auth/logout", { method: "POST" }); } catch (err) { flash(err.message); }
    onLogout();
  };
  const openSocialProfile = (person) => { setSelectedFriend(person); setView("social-profile"); setNotificationOpen(false); };
  const followBackFromNotification = async (event, person) => {
    event.stopPropagation();
    try {
      await request(`/social/follow/${person._id}`, { method: "POST" });
      setData((current) => ({ ...current, friends: current.friends.some((friend) => String(friend._id) === String(person._id)) ? current.friends : [{ ...person, isFollowing: true, followsYou: true }, ...current.friends], connectionCounts: { ...current.connectionCounts, following: current.connectionCounts.following + 1 } }));
      refresh();
      flash(`You’re now following ${person.name}. You can message each other.`);
    } catch (error) { flash(error.message); }
  };

  if (loading) return <div className="loading-screen"><BrandLogo compact /><div className="loader" /></div>;

  const dashboard = data.dashboard;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
    <aside className="sidebar">
      <div className="side-brand"><BrandLogo /><button className="icon-button collapse-button" onClick={() => setCollapsed(!collapsed)}><Menu size={17} /></button></div>
      <div className="side-label">WORKSPACE</div>
      <nav>{menu.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? "active" : ""}`} onClick={() => setView(id)} title={label}><Icon size={18} /><span>{label}</span>{id === "messages" && <i className="nav-dot" />}</button>)}</nav>
      <div className="side-bottom">
        <div className="side-mini-card"><div className="mini-flame"><Flame size={16} /></div><span>Keep your rhythm</span><strong>{dashboard?.streak?.current || 0} day streak</strong></div>
        <button className={`nav-item ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}><Settings2 size={18} /><span>Settings</span></button>
        <button className="profile-switch" onClick={() => setView("profile")}><Avatar user={user} /><span className="profile-name"><span className="user-name-rubik">{user.name}</span><small>My account</small></span><MoreHorizontal size={17} /></button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{menu.find((item) => item.id === view)?.label || "Settings"}</strong></div><div className="top-actions"><span className="date-chip"><span className="live-dot" /> {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><button className={`icon-button notification-button ${notificationOpen ? "selected" : ""}`} onClick={() => { setNotificationOpen(!notificationOpen); if (!notificationOpen) request("/social/notifications/read", { method: "PATCH" }).then(() => setData((d) => ({ ...d, unread: 0 }))).catch((e) => flash(e.message)); }}><Bell size={18} />{data.unread > 0 && <b>{data.unread}</b>}</button><button className="top-profile" onClick={() => setView("profile")}><Avatar user={user} size="small" /><span className="user-name-rubik">{user.name.split(" ")[0]}</span><ChevronDown size={14} /></button></div>
        {notificationOpen && <div className="notification-popover"><div className="popover-title">Notifications <button onClick={() => setNotificationOpen(false)} aria-label="Close notifications"><X size={14} /></button></div>{data.notifications.length ? data.notifications.slice(0, 8).map((item) => <div className={`notification-row ${item.actorId ? "actionable" : ""}`} key={item._id}>
          {item.actorId ? <button className="notification-open" onClick={() => {
            if (item.type === "message") {
              setSelectedFriend(item.actorId);
              setView("messages");
              setNotificationOpen(false);
            } else if (item.type === "follow") {
              openSocialProfile(item.actorId);
            }
          }}><Avatar user={item.actorId} size="small" /><span><strong className="user-name-rubik">{item.actorId.name || "Someone"}</strong> {item.text}<small>{new Date(item.createdAt).toLocaleString()}</small></span></button> : <span className="notification-copy">{item.text}<small>{new Date(item.createdAt).toLocaleString()}</small></span>}
          {item.type === "follow" && item.actorId && !data.friends.some((friend) => String(friend._id) === String(item.actorId._id)) ? <button className="button primary notification-follow-back" onClick={(event) => followBackFromNotification(event, item.actorId)}>Follow back</button> : item.type === "follow" ? <span className="notification-following">Following</span> : item.type === "message" ? <MessageCircle size={15} /> : null}
        </div>) : <div className="empty-note">You're all caught up.</div>}</div>}
      </header>
      <section className="page-content">
        {dataError && <div className="load-error"><CircleHelp size={16} />We couldn't load your latest data: {dataError}<button onClick={refresh}>Try again</button></div>}
        {view === "dashboard" && <Dashboard user={user} data={data} greeting={greeting} tasks={data.tasks} onNavigate={setView} onRefresh={refresh} onFlash={flash} />}
        {view === "tasks" && <Tasks tasks={data.tasks} onRefresh={refresh} onFlash={flash} />}
        {view === "routines" && <Routines routines={data.routines} today={dashboard?.today} onRefresh={refresh} onFlash={flash} />}
        {view === "history" && <HistoryPage />}
        {view === "friends" && <Friends friends={data.friends} followers={data.followers} counts={data.connectionCounts} onRefresh={refresh} onFlash={flash} onOpenProfile={openSocialProfile} />}
        {view === "social-profile" && selectedFriend && <SocialProfile key={selectedFriend._id} person={selectedFriend} onBack={() => setView("friends")} onRefresh={refresh} onFlash={flash} onMessage={(person) => { setSelectedFriend(person); setView("messages"); }} />}
        {view === "messages" && <Messages friends={data.friends} conversations={data.conversations} initialFriend={selectedFriend} onFlash={flash} onRefresh={refresh} />}
        {view === "assistant" && <Assistant onRefresh={refresh} />}
        {view === "profile" && <Profile user={user} onUpdate={(next) => setUser(next)} onFlash={flash} onLogout={signOut} />}
      </section>
    </main>
    {notice && <div className="toast"><Check size={16} />{notice}</div>}
  </div>;
}

function PageTitle({ eyebrow, title, subtitle, action }) {
  return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function Dashboard({ user, data, greeting, tasks, onNavigate, onRefresh, onFlash }) {
  const [quote, setQuote] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [dashboardMode, setDashboardMode] = useState(() =>
    ["focus", "balanced", "compact"].includes(window.localStorage.getItem(`comeback-dashboard-${user.id || user._id}`))
      ? window.localStorage.getItem(`comeback-dashboard-${user.id || user._id}`)
      : "classic"
  );
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorTheme, setColorTheme] = useState(() => document.documentElement.dataset.theme || "orange");
  const [dailyNote, setDailyNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(true);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const todayDate = localDate();
  useEffect(() => { request("/assistant/quote").then((result) => setQuote(result.quote)).catch((error) => setQuoteError(error.message)); }, []);
  useEffect(() => {
    let active = true;
    setNoteLoading(true);
    setNoteError("");
    request(`/logs/note?date=${todayDate}`)
      .then((result) => { if (active) setDailyNote(result.note || ""); })
      .catch((error) => { if (active) setNoteError(error.message); })
      .finally(() => { if (active) setNoteLoading(false); });
    return () => { active = false; };
  }, [todayDate]);
  const today = data.dashboard?.today;
  const completion = today?.percent || 0;
  const avatarImage = user.wallpaper || user.avatar;
  const analytics = data.analytics;
  const doneToday = today?.done || 0;
  const changeDashboardMode = (mode) => {
    window.localStorage.setItem(`comeback-dashboard-${user.id || user._id}`, mode);
    setDashboardMode(mode);
    setThemePickerOpen(false);
  };
  const changeColorTheme = (theme) => {
    if (saveColorTheme(theme, user.id || user._id)) setColorTheme(theme);
  };
  const saveDailyNote = async () => {
    setNoteSaving(true);
    try {
      const result = await request("/logs/note", json("PUT", { date: todayDate, note: dailyNote }));
      setDailyNote(result.note);
      setNoteError("");
      onFlash("Today's note saved.");
    } catch (error) {
      setNoteError(error.message);
    } finally {
      setNoteSaving(false);
    }
  };
  return <div className="dashboard-page">
    <div className="welcome-row"><div><span className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</span><h1>{greeting}, <em className="user-name-rubik">{user.name.split(" ")[0]}</em>.</h1><p>A fresh day is another chance to show up for yourself.</p></div><div className="welcome-actions"><button className={`button ${colorPickerOpen ? "primary" : "subtle"} dashboard-theme-trigger`} type="button" aria-expanded={colorPickerOpen} aria-controls="dashboard-color-picker" onClick={() => { setColorPickerOpen((open) => !open); setThemePickerOpen(false); }}><Palette size={15} /> Colors</button><button className={`button ${themePickerOpen ? "primary" : "subtle"} dashboard-theme-trigger`} type="button" aria-expanded={themePickerOpen} aria-controls="dashboard-theme-picker" onClick={() => { setThemePickerOpen((open) => !open); setColorPickerOpen(false); }}><SlidersHorizontal size={15} /> Dashboard style</button><button className="button subtle" onClick={() => onNavigate("profile")}><ImagePlus size={16} /> Personalize</button><button className="button primary" onClick={() => onNavigate("tasks")}><Plus size={16} /> Add a task</button></div></div>
    {colorPickerOpen && <section className="dashboard-color-picker" id="dashboard-color-picker" aria-label="Choose a color theme">
      <div className="dashboard-theme-picker-heading"><div><span className="eyebrow">CHOOSE YOUR COLORS</span><h2>Dashboard color</h2><p>Change the colors across your entire Comback workspace.</p></div><button type="button" className="icon-button quiet" aria-label="Close color themes" onClick={() => setColorPickerOpen(false)}><X size={16} /></button></div>
      <div className="dashboard-color-options">
        {colorThemes.map(({ id, label, color }) => <button type="button" key={id} className={`dashboard-color-option ${colorTheme === id ? "selected" : ""}`} onClick={() => changeColorTheme(id)} aria-label={`${label} theme${colorTheme === id ? ", selected" : ""}`} aria-pressed={colorTheme === id}>
          <span className="accent-theme-swatch" style={{ "--swatch-color": color }}>{colorTheme === id && <Check size={12} />}</span><span>{label}</span>
        </button>)}
      </div>
    </section>}
    {themePickerOpen && <section className="dashboard-theme-picker" id="dashboard-theme-picker" aria-label="Choose a dashboard design">
      <div className="dashboard-theme-picker-heading"><div><span className="eyebrow">MAKE YOUR HOME YOURS</span><h2>Choose a dashboard style</h2><p>Pick a layout that fits the way you plan your day.</p></div><button type="button" className="icon-button quiet" aria-label="Close dashboard styles" onClick={() => setThemePickerOpen(false)}><X size={16} /></button></div>
      <div className="dashboard-theme-options">
        {dashboardThemes.map(({ id, title, description, icon: Icon }) => <button type="button" key={id} className={`dashboard-theme-card ${dashboardMode === id ? "selected" : ""}`} onClick={() => changeDashboardMode(id)} aria-pressed={dashboardMode === id}>
          <span className={`dashboard-theme-preview preview-${id}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          <span className="dashboard-theme-card-copy"><span><Icon size={15} />{title}{dashboardMode === id && <b>SELECTED</b>}</span><small>{description}</small></span>
        </button>)}
      </div>
      <div className="dashboard-theme-picker-footer"><span>Your current accent color and dashboard data stay the same.</span><button type="button" className="dashboard-reset-button" onClick={() => changeDashboardMode("classic")}>Restore classic layout</button></div>
    </section>}
    <div className={`dashboard-grid ${dashboardMode === "classic" ? "" : `dashboard-layout-${dashboardMode}`}`}>
      <section className="hero-card panel" style={avatarImage ? { backgroundImage: `linear-gradient(90deg,rgba(18,13,11,.94) 4%,rgba(22,15,12,.73) 54%,rgba(20,14,12,.28)),url("${avatarImage}")` } : undefined}>
        <div className="hero-content"><span className="hero-tag">YOUR DAY, YOUR PACE</span><h2>Progress is built<br />in the <em>little things.</em></h2><p>You've completed <strong>{doneToday} of {today?.total || 0}</strong> planned routines today. Keep the momentum going.</p><button className="button orange-outline" onClick={() => onNavigate("routines")}>View today's plan <ArrowUpRight size={15} /></button></div>
        <div className="hero-bottom"><div className="hero-date"><span>{new Date().toLocaleDateString(undefined, { weekday: "long" }).toUpperCase()}</span><strong>{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong></div><div className="hero-progress"><div className="progress-line"><span style={{ width: `${completion}%` }} /></div><small>{completion}% DAILY CONSISTENCY</small></div></div>
        <div className="hero-streak"><Flame size={15} /><strong>{data.dashboard?.streak?.current || 0}</strong><span>DAY STREAK</span></div>
      </section>
      <section className="areas-card panel"><div className="area-orb"><div className="orb-face" /></div><div className="areas-content"><span className="eyebrow">YOUR NORTH STAR</span><h3>Areas of <em>life</em></h3><p>Small steps, across the things that matter.</p><div className="area-pills">{(user.goals?.length ? user.goals.slice(0, 3) : ["Wellbeing", "Growth", "Balance"]).map((goal) => <span key={goal}><i />{goal}</span>)}</div></div><button className="area-edit" onClick={() => onNavigate("profile")}><ArrowUpRight size={15} /></button></section>
      <section className="panel schedule-card"><div className="section-heading"><div><span className="eyebrow">YOUR ROUTINE</span><h3>Today's rhythm</h3></div><button className="text-link" onClick={() => onNavigate("routines")}>See all <ArrowUpRight size={14} /></button></div>
        {(today?.items || []).length ? <div className="routine-list">{today.items.map(({ routine, status }, index) => <button className={`routine-row ${status === "done" ? "is-done" : ""}`} key={routine._id} onClick={() => onNavigate("routines")}><span className={`routine-time time-${routine.timeOfDay || "anytime"}`}>{routine.timeOfDay === "anytime" ? "ANY" : routine.timeOfDay?.slice(0, 3).toUpperCase()}</span><span className="routine-color" style={{ "--row-color": ["#ff7545", "#d5b17e", "#8fa391", "#bd8a68"][index % 4] }} /><span className="routine-copy"><strong>{routine.title}</strong><small>{routine.category || "Personal"} · {routine.reminderTime || "Your own pace"}</small></span><span className={`check-circle ${status === "done" ? "checked" : ""}`}>{status === "done" ? <Check size={13} /> : ""}</span></button>)}</div> : <div className="empty-card"><CalendarDays size={22} /><span>No routines planned yet.</span><button className="text-link" onClick={() => onNavigate("routines")}>Create your first routine <ArrowUpRight size={14} /></button></div>}
      </section>
      <section className="panel score-card"><div className="section-heading"><div><span className="eyebrow">CONSISTENCY</span><h3>Your momentum</h3></div><Activity size={17} className="muted-icon" /></div><div className="score-main"><span>{analytics?.weekly?.completionRate ?? completion}<small>%</small></span><div className="score-ring" style={{ "--score": `${analytics?.weekly?.completionRate ?? completion}%` }}><Target size={21} /></div></div><p className="score-caption">weekly follow-through</p><div className="score-stats"><div><strong>{data.dashboard?.streak?.best || 0}</strong><span>Best streak</span></div><div><strong>{analytics?.weekly?.completedDays || doneToday}</strong><span>Days completed</span></div></div><button className="button dark-button full" onClick={() => onNavigate("routines")}>Explore progress <ArrowUpRight size={15} /></button></section>
      <section className="panel tasks-card"><div className="section-heading"><div><span className="eyebrow">MAKE IT HAPPEN</span><h3>Priority tasks</h3></div><button className="text-link" onClick={() => onNavigate("tasks")}>All tasks <ArrowUpRight size={14} /></button></div>
        {tasks.length ? <div className="task-list compact">{tasks.map((task) => <div className={`task-row ${task.status === "completed" ? "is-complete" : ""}`} key={task._id}><span className={`priority-dot ${task.priority}`} /><span className="task-copy"><strong>{task.title}</strong><small>{task.status === "completed" ? "Completed" : task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "No deadline"}</small></span><span className={`priority-label ${task.status === "completed" ? "completed" : task.priority}`}>{task.status === "completed" ? "Done" : task.priority}</span></div>)}</div> : <div className="empty-note">No tasks yet. Add one when you're ready.</div>}
        <div className="quote-box"><span className="quote-mark">“</span><span>{quote || quoteError || "A little progress each day adds up to big results."}</span></div>
      </section>
      <section className="assistant-promo panel"><div className="assistant-promo-head"><span className="ai-label">AI</span><span className="eyebrow">YOUR AI COMPANION</span><button className="text-link" onClick={() => onNavigate("assistant")}>Open chat <ArrowUpRight size={14} /></button></div><h3>A plan that fits <em>your life.</em></h3><p>Ask about your progress, get a realistic schedule, or turn a thought into a task.</p><button className="button ai-button full" onClick={() => onNavigate("assistant")}><MessageCircle size={15} /> Ask your assistant</button><div className="ai-suggestion"><span>TRY ASKING</span> “How am I doing this week?”</div></section>
    </div>
    <section className="panel dashboard-daily-note">
      <div className="dashboard-note-heading"><div><span className="eyebrow">A NOTE FOR TODAY</span><h2>Save a thought from your day.</h2><p>Your note will be saved to today and available from that date in History.</p></div><span className="dashboard-note-date">{dateFromKey(todayDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div>
      {noteLoading ? <p className="dashboard-note-status">Loading today's note…</p> : <>
        <textarea aria-label="Today's note" value={dailyNote} onChange={(event) => setDailyNote(event.target.value)} maxLength={1000} placeholder="What would you like to remember about today?" />
        <div className="dashboard-note-actions">{noteError && <span role="alert">{noteError}</span>}<small>{dailyNote.length}/1000</small><button className="button primary" type="button" onClick={saveDailyNote} disabled={noteSaving}><Save size={14} />{noteSaving ? "Saving…" : "Save today's note"}</button></div>
      </>}
    </section>
  </div>;
}

function Tasks({ tasks, onRefresh, onFlash }) {
  const [draft, setDraft] = useState({ title: "", deadline: "", priority: "medium" });
  const pending = tasks.filter((task) => task.status === "pending");
  const complete = tasks.filter((task) => task.status === "completed");
  const addTask = async (event) => {
    event.preventDefault();
    try { await request("/tasks", json("POST", draft)); setDraft({ title: "", deadline: "", priority: "medium" }); onRefresh(); onFlash("Task added to your list."); }
    catch (error) { onFlash(error.message); }
  };
  const update = async (task, patch) => { try { await request(`/tasks/${task._id}`, json("PATCH", patch)); onRefresh(); } catch (error) { onFlash(error.message); } };
  const renderTask = (task) => <div className={`task-card ${task.status === "completed" ? "finished" : ""}`} key={task._id}><button className={`task-check ${task.status === "completed" ? "done" : ""}`} onClick={() => update(task, { status: task.status === "completed" ? "pending" : "completed" })}>{task.status === "completed" && <Check size={15} />}</button><div className="task-card-copy"><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<small>{task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : "No deadline"}</small></div><select className={`priority-select ${task.priority}`} aria-label="Task priority" value={task.priority} onChange={(e) => update(task, { priority: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><button className="icon-button quiet" aria-label="Delete task" onClick={async () => { try { await request(`/tasks/${task._id}`, { method: "DELETE" }); onRefresh(); } catch (error) { onFlash(error.message); } }}><X size={15} /></button></div>;
  return <><PageTitle eyebrow="YOUR FOCUS" title="Tasks that move you forward." subtitle="A clear list turns good intentions into small, doable steps." /><form className="task-create panel" onSubmit={addTask}><div className="create-input"><Plus size={18} /><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="What's one thing you want to get done?" required maxLength={160} /></div><input type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} aria-label="Deadline" /><select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select><button className="button primary"><Plus size={15} /> Add task</button></form><div className="task-columns"><section><div className="list-title"><span className="list-marker orange" /><h3>In progress</h3><span className="count-badge">{pending.length}</span></div>{pending.length ? pending.map(renderTask) : <div className="panel empty-state"><CheckCheck size={22} /><strong>Nothing on your plate.</strong><span>Add a task above or ask your AI assistant to help plan.</span></div>}</section><section><div className="list-title"><span className="list-marker green" /><h3>Completed</h3><span className="count-badge">{complete.length}</span></div>{complete.length ? complete.map(renderTask) : <div className="panel empty-state"><span>Your finished tasks will show up here.</span></div>}</section></div></>;
}

const calendarDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const dateFromKey = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const shiftDate = (date, days) => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};

const historyStatusLabels = {
  completed: "Complete",
  partial: "Partial",
  missed: "Missed",
  pending: "In progress",
  skipped: "Skipped",
  upcoming: "Upcoming",
  none: "No routines",
};

function HistoryPage() {
  const today = localDate();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(today);
  const [summaries, setSummaries] = useState([]);
  const [day, setDay] = useState(null);
  const [note, setNote] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [dayError, setDayError] = useState("");
  const monthStart = calendarDateKey(month);
  const calendarStart = shiftDate(month, -month.getDay());
  const calendarEnd = shiftDate(calendarStart, 41);
  const calendarDays = Array.from({ length: 42 }, (_, index) => shiftDate(calendarStart, index));

  useEffect(() => {
    let active = true;
    setHistoryLoading(true);
    setHistoryError("");
    request(`/logs/history?from=${calendarDateKey(calendarStart)}&to=${calendarDateKey(calendarEnd)}&today=${today}`)
      .then((result) => { if (active) setSummaries(result.days || []); })
      .catch((error) => { if (active) setHistoryError(error.message); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [monthStart, today]);

  useEffect(() => {
    let active = true;
    setDayLoading(true);
    setDayError("");
    Promise.all([
      request(`/logs/day?date=${selectedDate}`),
      request(`/logs/note?date=${selectedDate}`),
    ]).then(([dayResult, noteResult]) => {
      if (!active) return;
      setDay(dayResult);
      setNote(noteResult.note || "");
    }).catch((error) => {
      if (active) setDayError(error.message);
    }).finally(() => { if (active) setDayLoading(false); });
    return () => { active = false; };
  }, [selectedDate]);

  const summaryByDate = new Map(summaries.map((summary) => [summary.date, summary]));
  return <>
    <PageTitle eyebrow="YOUR PROGRESS, DAY BY DAY" title="Your history." subtitle="See how your routines are going. Select any day to revisit its routines and save a note." />
    <div className="history-layout">
      <section className="panel history-calendar">
        <div className="history-calendar-heading">
          <div><span className="eyebrow">ROUTINE CALENDAR</span><h2>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2></div>
          <div className="history-month-actions">
            <button className="icon-button quiet" type="button" aria-label="Previous month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
            <button className="icon-button quiet" type="button" aria-label="Next month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={17} /></button>
          </div>
        </div>
        <div className="history-weekdays" aria-hidden="true">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
        <div className="history-calendar-grid" aria-busy={historyLoading}>
          {calendarDays.map((date) => {
            const dateKey = calendarDateKey(date);
            const summary = summaryByDate.get(dateKey);
            const status = summary?.status || "none";
            const label = historyStatusLabels[status] || status;
            return <button
              className={`history-day ${date.getMonth() !== month.getMonth() ? "outside-month" : ""} ${dateKey === selectedDate ? "selected" : ""} ${dateKey === today ? "today" : ""} status-${status}`}
              type="button"
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              aria-label={`${date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}: ${label}${summary?.total ? `, ${summary.done} of ${summary.total} routines complete` : ""}`}
              aria-pressed={dateKey === selectedDate}
            >
              <span>{date.getDate()}</span>
              {summary?.total > 0 && <small>{summary.done}/{summary.total}</small>}
              {summary?.total > 0 && <i aria-hidden="true" />}
            </button>;
          })}
        </div>
        <div className="history-legend">
          <span><i className="status-completed" />Complete</span>
          <span><i className="status-partial" />Partial</span>
          <span><i className="status-missed" />Missed</span>
          <span><i className="status-upcoming" />Upcoming</span>
        </div>
        {historyError && <div className="history-error" role="alert">Could not load calendar: {historyError}</div>}
      </section>

      <section className="panel history-day-detail">
        <div className="history-detail-heading">
          <div><span className="eyebrow">DAY DETAILS</span><h2>{dateFromKey(selectedDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2></div>
          {day && <span className="history-day-percent">{day.percent}%</span>}
        </div>
        {dayLoading ? <div className="history-message">Loading this day's routines…</div> : dayError ? <div className="history-error" role="alert">{dayError}</div> : <>
          <p className="history-day-summary">{day?.done || 0} of {day?.total || 0} routines completed</p>
          {day?.items?.length ? <div className="history-routine-list">
            {day.items.map((item) => <article className="history-routine" key={item.routine._id}>
              <span className={`history-routine-check ${item.status}`} aria-hidden="true">{item.status === "done" ? <Check size={13} /> : null}</span>
              <div><strong>{item.routine.title}</strong><small>{item.routine.category} · {item.routine.timeOfDay} · {item.routine.repeatType}</small>
                {item.routine.description && <p>{item.routine.description}</p>}
                {item.note && <p className="history-routine-note">Note: {item.note}</p>}
              </div>
              <span className={`history-routine-status ${item.status}`}>{item.status === "done" ? `${item.amount}/${item.routine.normalTarget || 1}` : item.status}</span>
            </article>)}
          </div> : <div className="history-message">No routines were scheduled for this day.</div>}
          <div className="history-note">
            <span className="eyebrow">DAILY NOTE</span>
            {note ? <p className="history-saved-note">{note}</p> : <p className="history-no-note">No note was saved for this day.</p>}
          </div>
        </>}
      </section>
    </div>
  </>;
}

function Routines({ routines, today, onRefresh, onFlash }) {
  const [showForm, setShowForm] = useState(false);
  const [bundleEditor, setBundleEditor] = useState(null);
  const [bundleDrafts, setBundleDrafts] = useState([]);
  const [bundleBusy, setBundleBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyDraft = {
    title: "", description: "", category: "personal", timeOfDay: "anytime",
    reminderTime: "", repeatType: "daily", repeatDays: [], weeklyTarget: 3,
    minimumTarget: 1, normalTarget: 1,
  };
  const [draft, setDraft] = useState(emptyDraft);
  const statusById = useMemo(() => new Map((today?.items || []).map((item) => [String(item.routine._id), item.status])), [today]);
  const openBundle = (template) => {
    setShowForm(false);
    setEditing(null);
    setBundleEditor(template);
    setBundleDrafts(template.routines.map((routine) => ({ ...emptyDraft, ...routine })));
  };
  const updateBundleRoutine = (index, patch) => setBundleDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const addBundleRoutine = () => setBundleDrafts((items) => items.length >= 20 ? items : [...items, { ...emptyDraft, category: bundleEditor?.id === "study" ? "study" : bundleEditor?.id === "personal-growth" ? "development" : "other" }]);
  const removeBundleRoutine = (index) => setBundleDrafts((items) => items.filter((_, itemIndex) => itemIndex !== index));
  const submitBundle = async (event) => {
    event.preventDefault();
    if (!bundleDrafts.length) return onFlash("Add at least one routine to your plan.");
    setBundleBusy(true);
    const payload = bundleDrafts.map((routine, order) => ({
      ...routine,
      order,
      startDate: localDate(),
      weeklyTarget: Number(routine.weeklyTarget),
      minimumTarget: Number(routine.minimumTarget),
      normalTarget: Number(routine.normalTarget),
    }));
    try {
      await request("/routines/batch", json("POST", { routines: payload }));
      const createdCount = payload.length;
      setBundleEditor(null);
      setBundleDrafts([]);
      onRefresh();
      onFlash(`${createdCount} ${createdCount === 1 ? "routine" : "routines"} added to your plan.`);
    } catch (error) { onFlash(error.message); }
    finally { setBundleBusy(false); }
  };
  const openCreate = () => {
    setBundleEditor(null);
    setEditing(null);
    setDraft(emptyDraft);
    setShowForm(true);
  };
  const openEdit = (routine) => {
    setBundleEditor(null);
    setEditing(routine);
    setDraft({
      title: routine.title || "",
      description: routine.description || "",
      category: routine.category || "personal",
      timeOfDay: routine.timeOfDay || "anytime",
      reminderTime: routine.reminderTime || "",
      repeatType: routine.repeatType || "daily",
      repeatDays: routine.repeatDays || [],
      weeklyTarget: routine.weeklyTarget || 3,
      minimumTarget: routine.minimumTarget || 1,
      normalTarget: routine.normalTarget || 1,
    });
    setShowForm(true);
  };
  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...draft,
      startDate: editing?.startDate || localDate(),
      weeklyTarget: Number(draft.weeklyTarget),
      minimumTarget: Number(draft.minimumTarget),
      normalTarget: Number(draft.normalTarget),
    };
    try {
      await request(editing ? `/routines/${editing._id}` : "/routines", json(editing ? "PUT" : "POST", payload));
      setShowForm(false);
      setEditing(null);
      onRefresh();
      onFlash(editing ? "Routine updated." : "Routine created.");
    }
    catch (error) { onFlash(error.message); }
  };
  const toggleDay = (day) => setDraft((current) => ({
    ...current,
    repeatDays: current.repeatDays.includes(day)
      ? current.repeatDays.filter((value) => value !== day)
      : [...current.repeatDays, day].sort(),
  }));
  const toggle = async (routine) => {
    const status = statusById.get(String(routine._id)) === "done" ? "pending" : "done";
    try { await request("/logs", json("PUT", { routineId: routine._id, date: localDate(), status, amount: routine.normalTarget || 1 })); onRefresh(); }
    catch (error) { onFlash(error.message); }
  };
  const remove = async (routine) => {
    if (!window.confirm(`Delete "${routine.title}" and its history?`)) return;
    try { await request(`/routines/${routine._id}`, { method: "DELETE" }); onRefresh(); onFlash("Routine deleted."); }
    catch (error) { onFlash(error.message); }
  };
  return <>
    <PageTitle eyebrow="SHOW UP FOR YOURSELF" title="Routines, at your own pace." subtitle="Consistency isn't perfection. It's choosing to begin again." action={<button className="button primary" onClick={openCreate}><Plus size={16} /> New routine</button>} />
    {!showForm && !bundleEditor && <section className="routine-templates">
      <div className="routine-templates-heading"><div><span className="eyebrow">READY-MADE ROUTINE PLANS</span><h2>A good place to begin.</h2><p>Choose a complete plan, make it yours, and change anything before saving.</p></div><span className="template-total">3 plans · fully editable</span></div>
      <div className="template-grid bundle-template-grid">{routineTemplates.map((template) => <article className={`routine-template glass-surface bundle-template ${template.id}`} key={template.id}>
        <h3>{template.title}</h3>
        <button type="button" className="template-use" onClick={() => openBundle(template)}>Use</button>
      </article>)}</div>
    </section>}
    {bundleEditor && <form className="bundle-editor panel" onSubmit={submitBundle}>
      <div className="routine-editor-heading"><div><span className="eyebrow">MAKE THIS PLAN YOURS</span><h3>{bundleEditor.title} routine plan</h3><p>Edit, remove, or add routines before you add them to your daily plan.</p></div><button className="icon-button quiet" type="button" onClick={() => setBundleEditor(null)} aria-label="Close plan editor"><X size={17} /></button></div>
      <div className="bundle-routine-list">{bundleDrafts.map((routine, index) => <article className="bundle-routine-edit" key={`${bundleEditor.id}-${index}`}>
        <div className="bundle-routine-edit-heading"><span>ROUTINE {String(index + 1).padStart(2, "0")}</span><button className="bundle-remove" type="button" onClick={() => removeBundleRoutine(index)} aria-label={`Remove ${routine.title || `routine ${index + 1}`}`}><Trash2 size={15} /> Remove</button></div>
        <div className="bundle-fields">
          <label>Routine name<input value={routine.title} onChange={(event) => updateBundleRoutine(index, { title: event.target.value })} maxLength={100} required /></label>
          <label>Description<input value={routine.description} onChange={(event) => updateBundleRoutine(index, { description: event.target.value })} maxLength={500} /></label>
          <label>Area<select value={routine.category} onChange={(event) => updateBundleRoutine(index, { category: event.target.value })}>{["health", "fitness", "study", "work", "personal", "development", "other"].map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
          <label>Time of day<select value={routine.timeOfDay} onChange={(event) => updateBundleRoutine(index, { timeOfDay: event.target.value })}>{["morning", "afternoon", "evening", "anytime"].map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
          <label>Repeat<select value={routine.repeatType} onChange={(event) => updateBundleRoutine(index, { repeatType: event.target.value })}><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option></select></label>
          {routine.repeatType === "weekly" && <label>Times per week<input type="number" min="1" max="7" value={routine.weeklyTarget} onChange={(event) => updateBundleRoutine(index, { weeklyTarget: event.target.value })} /></label>}
          <label>Minimum amount<input type="number" min="1" max="1000" value={routine.minimumTarget} onChange={(event) => updateBundleRoutine(index, { minimumTarget: event.target.value, normalTarget: Math.max(Number(event.target.value) || 1, Number(routine.normalTarget) || 1) })} /></label>
          <label>Usual amount<input type="number" min={routine.minimumTarget} max="1000" value={routine.normalTarget} onChange={(event) => updateBundleRoutine(index, { normalTarget: event.target.value })} /></label>
          <label>Reminder (optional)<input type="time" value={routine.reminderTime} onChange={(event) => updateBundleRoutine(index, { reminderTime: event.target.value })} /></label>
        </div>
      </article>)}</div>
      <div className="bundle-editor-actions"><button className="button subtle" type="button" onClick={addBundleRoutine} disabled={bundleDrafts.length >= 20}><Plus size={15} /> Add a routine</button><span>{bundleDrafts.length} of 20 routines selected</span><button className="button primary" type="submit" disabled={bundleBusy || !bundleDrafts.length}>{bundleBusy ? "Adding routines…" : "Add plan to my routines"}</button></div>
    </form>}
    {showForm && <form className="routine-editor panel" onSubmit={submit}>
      <div className="routine-editor-heading"><div><span className="eyebrow">{editing ? "REFINE YOUR ROUTINE" : "START WITH ONE SMALL THING"}</span><h3>{editing ? "Edit routine" : "Create a routine"}</h3></div><button className="icon-button quiet" type="button" onClick={() => setShowForm(false)} aria-label="Close routine editor"><X size={17} /></button></div>
      <label>Routine name<input autoFocus placeholder="e.g. A walk after lunch" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required maxLength={100} /></label>
      <label>What does it mean to you?<textarea placeholder="Add a little detail (optional)" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={500} rows={2} /></label>
      <div className="routine-editor-grid">
        <label>Area<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{["health", "fitness", "study", "work", "personal", "development", "other"].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        <label>Time of day<select value={draft.timeOfDay} onChange={(event) => setDraft({ ...draft, timeOfDay: event.target.value })}>{["morning", "afternoon", "evening", "anytime"].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        <label>Repeat<select value={draft.repeatType} onChange={(event) => setDraft({ ...draft, repeatType: event.target.value, repeatDays: event.target.value === "custom" ? draft.repeatDays : [] })}><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="custom">Choose days</option><option value="weekly">Weekly target</option></select></label>
        <label>Reminder (optional)<input type="time" value={draft.reminderTime} onChange={(event) => setDraft({ ...draft, reminderTime: event.target.value })} /></label>
        {draft.repeatType === "weekly" && <label>Times per week<input type="number" min="1" max="7" value={draft.weeklyTarget} onChange={(event) => setDraft({ ...draft, weeklyTarget: event.target.value })} /></label>}
        <label>Minimum amount<input type="number" min="1" max="1000" value={draft.minimumTarget} onChange={(event) => setDraft({ ...draft, minimumTarget: event.target.value, normalTarget: Math.max(Number(event.target.value) || 1, Number(draft.normalTarget) || 1) })} required /></label>
        <label>Usual amount<input type="number" min={draft.minimumTarget} max="1000" value={draft.normalTarget} onChange={(event) => setDraft({ ...draft, normalTarget: event.target.value })} required /></label>
      </div>
      {draft.repeatType === "custom" && <fieldset className="weekday-picker"><legend>Choose your days</legend>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, day) => <label key={day}><input type="checkbox" checked={draft.repeatDays.includes(day)} onChange={() => toggleDay(day)} /><span>{label}</span></label>)}</fieldset>}
      <div className="routine-editor-actions"><button className="button subtle" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="button primary" type="submit">{editing ? "Save routine" : "Create routine"}</button></div>
    </form>}
    <div className="routine-page-grid"><section className="panel routine-page-list"><div className="section-heading"><div><span className="eyebrow">TODAY · {today?.done || 0} OF {today?.total || 0} DONE</span><h3>Your daily rhythm</h3></div><span className="big-percent">{today?.percent || 0}%</span></div>
      {routines.filter((routine) => !routine.isArchived).map((routine) => {
        const status = statusById.get(String(routine._id)) || "pending";
        return <div className="routine-page-row" key={routine._id}>
          <button className={`task-check ${status === "done" ? "done" : ""}`} onClick={() => toggle(routine)} aria-label={status === "done" ? "Mark routine pending" : "Complete routine"}>{status === "done" && <Check size={15} />}</button>
          <div className="task-card-copy"><strong>{routine.title}</strong><small>{routine.category} · {routine.timeOfDay} · {routine.repeatType}{routine.reminderTime ? ` · ${routine.reminderTime}` : ""}</small></div>
          <span className={`status-chip ${routine.isActive ? "on" : "off"}`}>{routine.isActive ? "Active" : "Paused"}</span>
          <button className="icon-button quiet" title="Edit routine" onClick={() => openEdit(routine)}><Pencil size={15} /></button>
          <button className="icon-button quiet" title={routine.isActive ? "Pause routine" : "Resume routine"} onClick={async () => { try { await request(`/routines/${routine._id}/toggle`, { method: "PATCH" }); onRefresh(); } catch (error) { onFlash(error.message); } }}>{routine.isActive ? <Pause size={15} /> : <Play size={15} />}</button>
          <button className="icon-button quiet" title="Delete routine" onClick={() => remove(routine)}><Trash2 size={15} /></button>
        </div>;
      })}
      {!routines.some((routine) => !routine.isArchived) && <div className="empty-state"><CalendarDays size={22} /><strong>Start with one small habit.</strong><span>Build routines that fit the life you have today.</span><button className="button subtle" onClick={openCreate}>Create a routine</button></div>}
    </section><aside className="panel routine-tip"><span className="ai-label">NOTE</span><span className="eyebrow">A GENTLE REMINDER</span><h3>Show up, not show off.</h3><p>Your routines are personal. Your consistency is something you can choose to share with your circle.</p><div className="streak-callout"><Flame size={18} /><div><strong>Small wins count.</strong><small>Every completed routine is progress.</small></div></div></aside></div>
  </>;
}

function Friends({ friends, followers, counts, onRefresh, onFlash, onOpenProfile }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [list, setList] = useState("following");
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return undefined; }
    const timer = setTimeout(() => { setSearching(true); request(`/social/users?q=${encodeURIComponent(query.trim())}`).then((result) => setResults(result.users || [])).catch((error) => onFlash(error.message)).finally(() => setSearching(false)); }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  const follow = async (person, isFollowing) => {
    try {
      await request(`/social/follow/${person._id}`, { method: isFollowing ? "DELETE" : "POST" });
      onRefresh();
      setResults((rows) => rows.map((row) => row._id === person._id ? { ...row, following: !isFollowing } : row));
      onFlash(isFollowing ? "Unfollowed." : `You’re now following ${person.name}.`);
    }
    catch (error) { onFlash(error.message); }
  };
  const visiblePeople = list === "following" ? friends : followers;
  return <>
    <PageTitle eyebrow="YOUR PEOPLE, YOUR PACE" title="Your circle." subtitle="Find people, follow their consistency, and grow your circle together." />
    <section className="connections-panel panel">
      <div className="connection-counts">
        <button className={`connection-count ${list === "followers" ? "selected" : ""}`} onClick={() => setList("followers")}><strong>{counts.followers}</strong><span>followers</span></button>
        <span className="connection-count-divider" />
        <button className={`connection-count ${list === "following" ? "selected" : ""}`} onClick={() => setList("following")}><strong>{counts.following}</strong><span>following</span></button>
      </div>
      <label className="friend-search panel"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find people by name…" /><span>{searching ? "Searching…" : "Search"}</span></label>
      {query.trim().length >= 2 && <div className="search-results">{results.length ? results.map((person) => <article className="connection-person-card" key={person._id}>
        <button className="connection-person-main" onClick={() => onOpenProfile(person)}><Avatar user={person} /><span className="friend-copy"><strong>{person.name}</strong><small>{person.bio || "Building better days."}</small></span></button>
        <button className={`button ${person.following ? "subtle" : "primary"}`} onClick={() => follow(person, person.following)}>{person.following ? <Check size={15} /> : <Plus size={15} />}{person.following ? "Following" : "Follow"}</button>
      </article>) : !searching && <p className="connection-empty-search">No people found. Try another name.</p>}</div>}
      <div className="connection-list-heading"><div><span className="eyebrow">YOUR NETWORK</span><h2>{list === "following" ? "Following" : "Followers"} <small>{list === "following" ? counts.following : counts.followers}</small></h2></div><span>{list === "following" ? "People you follow" : "People following you"}</span></div>
      {visiblePeople.length ? <div className="connection-list">{visiblePeople.map((person) => <button className="connection-person-card connection-person-button" key={person._id} onClick={() => onOpenProfile(person)}>
        <Avatar user={person} />
        <span className="friend-copy"><strong>{person.name}</strong><small>{person.bio || (person.followsYou ? "Follows you" : "Building better days.")}</small></span>
        <span className={`connection-status ${person.isFollowing && person.followsYou ? "mutual" : ""}`}>{person.isFollowing ? person.followsYou ? "Friends" : "Following" : "Follows you"}</span>
        <ArrowUpRight size={17} className="connection-open-icon" />
      </button>)}</div> : <div className="connection-empty"><Users size={23} /><strong>{list === "following" ? "Your following list is empty." : "No followers just yet."}</strong><span>Search for people above to grow your circle.</span></div>}
    </section>
  </>;
}

function SocialProfile({ person, onBack, onRefresh, onFlash, onMessage }) {
  const [profile, setProfile] = useState(person);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    request(`/social/users/${person._id}`).then((result) => { if (active) setProfile(result.user); }).catch((error) => onFlash(error.message));
    return () => { active = false; };
  }, [person._id]);
  const toggleFollow = async () => {
    setBusy(true);
    try {
      await request(`/social/follow/${profile._id}`, { method: profile.isFollowing ? "DELETE" : "POST" });
      setProfile((current) => ({ ...current, isFollowing: !current.isFollowing, mutualFollow: !current.isFollowing && current.followsYou }));
      onRefresh();
      onFlash(profile.isFollowing ? `You unfollowed ${profile.name}.` : profile.followsYou ? `You and ${profile.name} can now message each other.` : `You’re now following ${profile.name}.`);
    } catch (error) { onFlash(error.message); }
    finally { setBusy(false); }
  };
  return <div className="social-profile-page">
    <button className="social-profile-back" onClick={onBack}>← <span>Your circle</span></button>
    <article className="social-profile-card panel">
      <div className="social-profile-cover" />
      <div className="social-profile-body">
        <Avatar user={profile} size="large" />
        <span className="eyebrow">COMEBACK MEMBER</span>
        <h1 className="user-name-rubik">{profile.name}</h1>
        <p>{profile.bio || "Making progress at their own pace."}</p>
        <div className="social-profile-stats"><div><strong>{profile.consistency?.currentStreak || 0}</strong><span>day streak</span></div><div><strong>{profile.consistency?.completionRate || 0}%</strong><span>consistency</span></div><div><strong>{profile.consistency?.activeDays || 0}</strong><span>active days</span></div></div>
        <div className="social-profile-actions">
          <button className={`button ${profile.isFollowing ? "subtle" : "primary"}`} onClick={toggleFollow} disabled={busy}>{profile.isFollowing ? <Check size={16} /> : <Plus size={16} />}{profile.isFollowing ? "Following" : profile.followsYou ? "Follow back" : "Follow"}</button>
          {profile.mutualFollow && <button className="button subtle" onClick={() => onMessage(profile)}><MessageCircle size={16} /> Message</button>}
        </div>
        {!profile.mutualFollow && <span className="social-profile-hint">{profile.followsYou ? "Follow them back to start a conversation." : "Follow each other to unlock private messaging."}</span>}
        <div className="social-profile-privacy"><Activity size={16} /><span>Only consistency is shared. Their routines and tasks stay private.</span></div>
      </div>
    </article>
  </div>;
}

function Messages({ friends, conversations, initialFriend, onFlash, onRefresh }) {
  const [selected, setSelected] = useState(initialFriend || null);
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState(conversations);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const socket = useRef(null);
  const bottom = useRef(null);
  const stream = useRef(null);
  const preservedScroll = useRef(null);
  useEffect(() => setThreads(conversations), [conversations]);
  useEffect(() => { if (initialFriend) setSelected(initialFriend); }, [initialFriend]);
  const contacts = useMemo(() => {
    const byId = new Map();
    for (const friend of friends.filter((person) => person.followsYou)) byId.set(String(friend._id), { user: friend, unread: 0, lastMessage: "" });
    for (const thread of threads) {
      const id = String(thread.user?._id || thread.userId);
      byId.set(id, { ...byId.get(id), ...thread, user: thread.user || byId.get(id)?.user });
    }
    if (selected?._id) byId.set(String(selected._id), { ...byId.get(String(selected._id)), user: selected, unread: byId.get(String(selected._id))?.unread || 0 });
    return [...byId.values()].filter((entry) => entry.user).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
  }, [friends, selected, threads]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    setMessages([]);
    request(`/social/messages/${selected._id}`).then((result) => {
      if (!active) return;
      setMessages(result.messages || []);
      setHasMore(Boolean(result.hasMore));
      setThreads((items) => items.map((thread) => String(thread.user?._id || thread.userId) === String(selected._id) ? { ...thread, unread: 0 } : thread));
      onRefresh();
    }).catch((error) => { if (active) onFlash(error.message); });
    return () => { active = false; };
  }, [selected?._id]);
  useEffect(() => {
    socket.current = io(API, { withCredentials: true, transports: ["websocket", "polling"] });
    const currentUserId = String(selected?._id || "");
    socket.current.on("message:new", (message) => {
      const senderId = String(message.senderId);
      if (senderId === currentUserId) {
        setMessages((items) => [...items, message]);
      }
      setThreads((items) => items.map((thread) => String(thread.user?._id || thread.userId) === senderId
        ? { ...thread, lastMessage: message.body, lastMessageAt: message.createdAt, unread: senderId === currentUserId ? 0 : (thread.unread || 0) + 1 }
        : thread));
    });
    return () => socket.current?.disconnect();
  }, [selected?._id]);
  useLayoutEffect(() => {
    if (preservedScroll.current && stream.current) {
      const { height, top } = preservedScroll.current;
      stream.current.scrollTop = top + stream.current.scrollHeight - height;
      preservedScroll.current = null;
      return;
    }
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const loadOlder = async () => {
    if (!selected || !messages.length || loadingOlder) return;
    setLoadingOlder(true);
    try {
      if (stream.current) preservedScroll.current = { height: stream.current.scrollHeight, top: stream.current.scrollTop };
      const cursor = encodeURIComponent(messages[0].createdAt);
      const cursorId = encodeURIComponent(messages[0]._id);
      const result = await request(`/social/messages/${selected._id}?before=${cursor}&beforeId=${cursorId}`);
      setMessages((items) => [...(result.messages || []), ...items]);
      setHasMore(Boolean(result.hasMore));
    } catch (error) { onFlash(error.message); }
    finally { setLoadingOlder(false); }
  };
  const send = (event) => {
    event.preventDefault();
    if (!draft.trim() || !selected) return;
    socket.current.emit("message:send", { recipientId: selected._id, body: draft.trim() }, (result) => {
      if (!result.success) return onFlash(result.message);
      setMessages((items) => [...items, result.message]);
      setThreads((items) => [
        { user: selected, userId: selected._id, lastMessage: result.message.body, lastMessageAt: result.message.createdAt, unread: 0 },
        ...items.filter((thread) => String(thread.user?._id || thread.userId) !== String(selected._id)),
      ]);
      setDraft("");
      onRefresh();
    });
  };
  return <><PageTitle eyebrow="STAY CONNECTED" title="Conversations." subtitle="Pick up where you left off, or send a friend a little encouragement." /><div className="messages-layout panel"><aside className="conversation-sidebar"><div className="conversation-label">YOUR CONVERSATIONS</div>{contacts.map(({ user: person, lastMessage, lastMessageAt, unread }) => <button key={person._id} className={`conversation-person ${selected?._id === person._id ? "selected" : ""}`} onClick={() => setSelected(person)}><Avatar user={person} size="small" /><span><strong>{person.name}</strong><small>{lastMessage || "Start a conversation"}</small></span>{unread > 0 && <b className="conversation-unread">{unread}</b>}{lastMessageAt && !unread && <time>{new Date(lastMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>}</button>)}{!contacts.length && <p className="empty-note">Follow someone in Your circle to start a conversation.</p>}</aside><section className="conversation-main">{selected ? <><div className="conversation-header"><Avatar user={selected} size="small" /><div><strong>{selected.name}</strong><small>Private conversation · only you and {selected.name}</small></div></div><div className="message-stream" ref={stream}>{hasMore && <button className="load-older-messages" onClick={loadOlder} disabled={loadingOlder}>{loadingOlder ? "Loading…" : "Load earlier messages"}</button>}{messages.map((message) => <div className={`message-bubble ${String(message.senderId) === String(selected._id) ? "incoming" : "outgoing"}`} key={message._id}>{message.body}<small>{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{message.readAt && String(message.senderId) !== String(selected._id) ? " · Read" : ""}</small></div>)}<div ref={bottom} />{!messages.length && <div className="empty-state"><MessageCircle size={22} /><span>Say hello to {selected.name}.</span></div>}</div><form className="message-compose" onSubmit={send}><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${selected.name}…`} maxLength={2000} /><button className="button primary" disabled={!draft.trim()} aria-label="Send message"><Send size={16} /></button></form></> : <div className="empty-state"><MessageCircle size={24} /><strong>Your conversations, all in one place.</strong><span>Choose someone from your circle or start by following a friend.</span></div>}</section></div></>;
}

function Assistant({ onRefresh }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState("");
  const stream = useRef(null);
  useEffect(() => { stream.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const ask = async (text = draft) => {
    if (!text.trim() || busy) return;
    const history = [...messages, { role: "user", content: text.trim() }];
    setMessages(history); setDraft(""); setBusy(true); setError("");
    try {
      const result = await request("/assistant/chat", json("POST", { messages: history }));
      setMessages([...history, { role: "assistant", content: result.reply }]);
      if (result.createdTasks?.length) onRefresh();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const makeSchedule = async () => {
    setBusy(true); setError("");
    try { setSchedule(await request("/assistant/schedule", json("POST", {}))); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <div className="assistant-page"><div className="assistant-heading"><div><span className="eyebrow">THOUGHTFUL PLANNING, MADE PERSONAL</span><h1>Your AI <em>companion.</em></h1><p>Grounded in your tasks, routines, goals, and real progress.</p></div><span className="ai-orb large"><Sparkles size={22} /></span></div><div className="assistant-workspace"><section className="panel chat-panel"><div className="chat-top"><div><span className="ai-status"><i /> READY WHEN YOU ARE</span><h3>Let's find your next step.</h3></div><button className="button subtle" onClick={makeSchedule} disabled={busy}><CalendarDays size={15} /> Plan my day</button></div><div className="chat-history">{messages.length === 0 ? <div className="chat-welcome"><span className="ai-orb"><Sparkles size={18} /></span><strong>What would make today feel like a win?</strong><p>I can help plan your day, look at your weekly progress, or turn a thought into a task.</p><div className="suggestion-chips"><button onClick={() => ask("How many tasks do I have pending?")}>How many tasks are pending?</button><button onClick={() => ask("How was my progress this week?")}>How is my week going?</button><button onClick={() => ask("Help me make a realistic plan for today.")}>Plan my day</button></div></div> : messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${index}-${message.role}`}><span className="chat-avatar">{message.role === "assistant" ? <Sparkles size={14} /> : <UserRound size={14} />}</span><div>{message.content.split("\n").map((line, i) => <p key={i}>{line || "\u00a0"}</p>)}</div></div>)}{busy && <div className="typing-indicator"><i /><i /><i /></div>}{error && <div className="form-error">{error}</div>}<div ref={stream} /></div><form className="assistant-input" onSubmit={(e) => { e.preventDefault(); ask(); }}><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about your goals, tasks, or progress…" maxLength={4000} /><button className="button primary" disabled={busy || !draft.trim()}><Send size={16} /></button><small>Your private data is sent to your configured AI provider to answer.</small></form></section><aside className="assistant-side"><div className="panel prompt-card"><span className="eyebrow">THINGS I CAN HELP WITH</span><button onClick={() => ask("How many tasks do I have pending?")}><ListTodo size={16} /><span><strong>Task check-in</strong><small>See what's still on your plate</small></span><ArrowUpRight size={14} /></button><button onClick={() => ask("How was my progress this week?")}><Activity size={16} /><span><strong>Weekly reflection</strong><small>Celebrate the steps you've made</small></span><ArrowUpRight size={14} /></button><button onClick={makeSchedule}><CalendarDays size={16} /><span><strong>Shape your day</strong><small>Make time for what matters</small></span><ArrowUpRight size={14} /></button><button onClick={() => ask("Create a task for me to take a 20 minute walk tomorrow, medium priority.")}><Plus size={16} /><span><strong>Create a task</strong><small>Just tell me what you need to do</small></span><ArrowUpRight size={14} /></button></div>{schedule && <div className="panel schedule-suggestion"><div className="section-heading"><div><span className="eyebrow">A PLAN FOR TODAY</span><h3>Your suggested rhythm</h3></div><button className="icon-button quiet" onClick={() => setSchedule(null)}><X size={14} /></button></div>{schedule.plan?.map((item, index) => <div className="plan-row" key={index}><span>{item.time}</span><div><strong>{item.title}</strong><small>{item.reason}</small></div></div>)}{schedule.note && <p className="muted">{schedule.note}</p>}</div>}<div className="privacy-note"><CircleHelp size={16} /><p>Answers use only your account's tasks and routines. Your friends cannot see your private task list or routine details.</p></div></aside></div></div>;
}

function Profile({ user, onUpdate, onFlash, onLogout }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [goals, setGoals] = useState((user.goals || []).join(", "));
  const [colorTheme, setColorTheme] = useState(() => document.documentElement.dataset.theme || "orange");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState({ avatar: false, wallpaper: false });
  const [removingWallpaper, setRemovingWallpaper] = useState(false);
  const avatarInput = useRef(null);
  const wallpaperInput = useRef(null);
  const changeColorTheme = (theme) => {
    if (saveColorTheme(theme, user.id || user._id)) setColorTheme(theme);
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const result = await request("/profile", json("PATCH", { name, bio, goals })); onUpdate(result.user); onFlash("Your profile is up to date."); }
    catch (error) { onFlash(error.message); } finally { setBusy(false); }
  };
  const upload = async (file, kind) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      onFlash("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onFlash("Images must be 5 MB or smaller.");
      return;
    }
    setUploading((current) => ({ ...current, [kind]: true }));
    const form = new FormData();
    form.append("image", file);
    try {
      const result = await request(`/profile/media/${kind}`, { method: "POST", body: form });
      onUpdate(result.user);
      onFlash(kind === "avatar" ? "Profile photo updated." : "Dashboard wallpaper updated.");
    } catch (error) {
      onFlash(error.message);
    } finally {
      setUploading((current) => ({ ...current, [kind]: false }));
    }
  };
  const handleFileChange = (kind, event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    void upload(file, kind);
  };
  const removeWallpaper = async () => {
    setRemovingWallpaper(true);
    try {
      const result = await request("/profile/wallpaper", { method: "DELETE" });
      onUpdate(result.user);
      onFlash("Wallpaper removed. Your profile photo is shown on the dashboard.");
    } catch (error) {
      onFlash(error.message);
    } finally {
      setRemovingWallpaper(false);
    }
  };
  return <>
    <PageTitle eyebrow="MAKE IT YOURS" title="Your profile." subtitle="A little context helps your assistant make better suggestions." />
    <div className="profile-layout">
      <form className="panel profile-form" onSubmit={save}>
        <div className="profile-cover" style={user.wallpaper ? { backgroundImage: `linear-gradient(90deg,rgba(18,13,11,.78),rgba(18,13,11,.2)),url("${user.wallpaper}")` } : undefined}>
          <button type="button" className="cover-upload" disabled={uploading.wallpaper} onClick={() => wallpaperInput.current?.click()}>
            <ImagePlus size={15} />{uploading.wallpaper ? "Uploading wallpaper…" : user.wallpaper ? "Change wallpaper" : "Upload wallpaper"}
          </button>
          {user.wallpaper && <button type="button" className="cover-remove" disabled={uploading.wallpaper || removingWallpaper} onClick={removeWallpaper} title="Remove wallpaper">{removingWallpaper ? "…" : <X size={15} />}</button>}
          <input ref={wallpaperInput} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading.wallpaper} onChange={(event) => handleFileChange("wallpaper", event)} />
        </div>
        {uploading.wallpaper && <div className="upload-progress" role="status">Uploading your wallpaper. Keep this page open…</div>}
        <div className="profile-avatar-row">
          <button className="profile-avatar-button" type="button" disabled={uploading.avatar} onClick={() => avatarInput.current?.click()}>
            <Avatar user={user} size="large" /><span><ImagePlus size={13} /></span>
          </button>
          <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading.avatar} onChange={(event) => handleFileChange("avatar", event)} />
          <div><strong className="user-name-rubik">{user.name}</strong><small>{uploading.avatar ? "Uploading your photo…" : "JPEG, PNG or WebP · up to 5 MB"}</small></div>
        </div>
        <div className="profile-fields">
          <label>Display name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} /></label>
          <label>Email address<input value={user.email} disabled /></label>
          <label>About you<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} rows={3} placeholder="What are you working toward?" /></label>
          <label>Your goals <small>Separate each goal with a comma</small><input value={goals} onChange={(event) => setGoals(event.target.value)} placeholder="Feel healthier, learn a language…" /></label>
          <div className="profile-actions">
            <button className="button primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Update profile"} <Check size={15} /></button>
            <button className="button logout-button" type="button" onClick={onLogout}>Log out</button>
          </div>
        </div>
      </form>
      <div className="profile-side-panels">
        <section className="panel appearance-panel">
          <Palette size={19} />
          <span className="eyebrow">MAKE IT YOURS</span>
          <h3>Color theme</h3>
          <p>Choose a coordinated color palette for every part of your workspace.</p>
          <div className="accent-theme-options color-theme-options" role="group" aria-label="Choose a color theme">
            {colorThemes.map(({ id: theme, label, color }) => (
              <button
                className={`accent-theme-option ${colorTheme === theme ? "selected" : ""}`}
                type="button"
                key={theme}
                onClick={() => onColorThemeChange(theme)}
                aria-pressed={colorTheme === theme}
              >
                <span className="accent-theme-swatch" style={{ "--swatch-color": color }} />
                {label}
                {colorTheme === theme && <Check size={14} />}
              </button>
            ))}
          </div>
        </section>
        <aside className="panel privacy-panel"><span className="ai-label">YOU</span><span className="eyebrow">YOUR SPACE, YOUR RULES</span><h3>Private by default.</h3><p>Your profile photo and bio help friends recognize you. Friends see your consistency summary only—not your routines, tasks, or deadlines.</p><div className="privacy-item"><Check size={14} /> Your tasks and deadlines stay private</div><div className="privacy-item"><Check size={14} /> Your routines stay private</div><div className="privacy-item"><Check size={14} /> You choose your dashboard wallpaper</div></aside>
      </div>
    </div>
  </>;
}
