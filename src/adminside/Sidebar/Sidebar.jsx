/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import logo from "/assets/logow.png";
import {
  MdDashboard, MdOutlineCategory, MdAddBox, MdBarChart,
  MdFolderOpen, MdTune, MdAccountTree, MdAltRoute, MdListAlt,
  MdSupportAgent, MdMenuBook, MdPlaylistAdd, MdQuestionAnswer,
  MdGroup, MdWork, MdMap, MdShare, MdPeople, MdHelpOutline,
  MdEmail, MdInbox, MdStarRate, MdCampaign, MdLocalOffer,
  MdAdsClick, MdComment, MdAttachMoney, MdMoneyOff, MdPayment,
  MdAdminPanelSettings, MdBadge, MdPersonAdd, MdLogout,
  MdChevronRight, MdChevronLeft, MdInventory, MdGroups,
} from "react-icons/md";
import { FaBriefcase, FaUserTie } from "react-icons/fa";

const sectionIcons = {
  packages:        <MdInventory size={20} />,
  orders:          <MdFolderOpen size={20} />,
  businessplanner: <FaBriefcase size={18} />,
  website:         <MdWork size={20} />,
  marketing:       <MdCampaign size={20} />,
  accounts:        <MdAttachMoney size={20} />,
  roles:           <MdGroups size={20} />,
};

const routeIcons = {
  "Category":           <MdOutlineCategory size={16} />,
  "Add Packages":       <MdAddBox size={16} />,
  "Package statistics": <MdBarChart size={16} />,
  "Projects":           <MdFolderOpen size={16} />,
  "Custom projects":    <MdTune size={16} />,
  "Work Distribution":  <MdGroup size={16} />,
  "Work Flow Maker":    <MdAccountTree size={16} />,
  "All Work Flows":     <MdAltRoute size={16} />,
  "Support Chat":       <MdSupportAgent size={16} />,
  "Planner":            <MdMenuBook size={16} />,
  "PLan List":          <MdListAlt size={16} />,
  "Responses":          <MdQuestionAnswer size={16} />,
  "Team":               <MdGroup size={16} />,
  "Portfolio":          <MdWork size={16} />,
  "Service":            <MdPlaylistAdd size={16} />,
  "Map":                <MdMap size={16} />,
  "Social":             <MdShare size={16} />,
  "Client List":        <MdPeople size={16} />,
  "FAQ":                <MdHelpOutline size={16} />,
  "EMail Manager":      <MdEmail size={16} />,
  "EMail Inbox":        <MdInbox size={16} />,
  "Reviews":            <MdStarRate size={16} />,
  "Marketing":          <MdCampaign size={16} />,
  "Sell Coupons":       <MdLocalOffer size={16} />,
  "Advertise":          <MdAdsClick size={16} />,
  "Comments":           <MdComment size={16} />,
  "Income":             <MdAttachMoney size={16} />,
  "Expense":            <MdMoneyOff size={16} />,
  "Payment Gateway":    <MdPayment size={16} />,
  "Admin List":         <MdAdminPanelSettings size={16} />,
  "Employee List":      <FaUserTie size={14} />,
  "Client List (roles)":<MdBadge size={16} />,
  "Recruitment":        <MdPersonAdd size={16} />,
};

// ── Flyout panel shown on hover when collapsed ────────────────
const CollapsedFlyout = ({ section, routes, currentPath, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const sectionLabel = (key) => {
    if (key === "businessplanner") return "Business Planner";
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <div
      ref={ref}
      className="fixed left-[64px] z-[999] bg-[#13131f] border border-white/10
        rounded-r-xl shadow-2xl py-3 min-w-[180px]"
      style={{ top: "auto" }}
    >
      <p className="text-xs font-semibold text-sky-400 uppercase tracking-widest px-4 pb-2 border-b border-white/5">
        {sectionLabel(section)}
      </p>
      <ul className="mt-2 flex flex-col gap-0.5 px-2">
        {routes.map((route) => (
          <li key={route.id}>
           <a 
              href={route.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                ${currentPath === route.path
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
            >
              <span className="flex-shrink-0">
                {routeIcons[route.name] ?? <MdListAlt size={16} />}
              </span>
              <span>{route.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Sidebar = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [allowedTabs, setAllowedTabs]     = useState([]);
  // which section's flyout is open (collapsed mode)
 

  const sections = {
    packages: [
      { id: 1, name: "Category",            path: "/admin/cetagory" },
      { id: 2, name: "Add Packages",        path: "/admin/add-pack" },
      { id: 3, name: "Package statistics",  path: "/admin/pack-stat" },
    ],
    orders: [
      { id: 1, name: "Projects",          path: "/admin/projects" },
      { id: 2, name: "Custom projects",   path: "/admin/customprojects" },
      { id: 3, name: "Work Distribution", path: "/admin/workdistribution" },
      { id: 4, name: "Work Flow Maker",   path: "/admin/flowmaker" },
      { id: 5, name: "All Work Flows",    path: "/admin/allflows" },
      { id: 6, name: "Support Chat",      path: "/admin/support" },
    ],
    businessplanner: [
      { id: 1, name: "Planner",   path: "/admin/planner" },
      { id: 2, name: "PLan List", path: "/admin/planslist" },
      { id: 3, name: "Responses", path: "/admin/planresponses" },
    ],
    website: [
      { id: 1, name: "Team",          path: "/admin/team" },
      { id: 2, name: "Portfolio",     path: "/admin/portfolio" },
      { id: 3, name: "Service",       path: "/admin/service" },
      { id: 4, name: "Map",           path: "/admin/map" },
      { id: 5, name: "Social",        path: "/admin/social" },
      { id: 6, name: "Client List",   path: "/admin/hclients" },
      { id: 7, name: "FAQ",           path: "/admin/faq" },
      { id: 8, name: "EMail Manager", path: "/admin/emailmanager" },
      { id: 9, name: "EMail Inbox",   path: "/admin/emailinbox" },
    ],
    marketing: [
      { id: 1, name: "Reviews",      path: "/admin/reviews" },
      { id: 2, name: "Marketing",    path: "/admin/marketing" },
      { id: 3, name: "Sell Coupons", path: "/admin/coupons" },
      { id: 4, name: "Advertise",    path: "/admin/advertisement" },
      { id: 5, name: "Comments",     path: "/admin/comments" },
    ],
    accounts: [
      { id: 1, name: "Income",          path: "/admin/income" },
      { id: 2, name: "Expense",         path: "/admin/expense" },
      { id: 3, name: "Payment Gateway", path: "/admin/paymentgate" },
    ],
    roles: [
      { id: 1, name: "Admin List",    path: "/admin/adminlist" },
      { id: 2, name: "Employee List", path: "/admin/employeelist" },
      { id: 3, name: "Client List",   path: "/admin/clientlist" },
      { id: 4, name: "Recruitment",   path: "/admin/recruitment" },
    ],
  };
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [flyoutSection, setFlyoutSection] = useState(null);
  const flyoutRefs = useRef({});

  // Persist collapsed state whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("adminData"));
    if (storedUser?.tabs) {
      setAllowedTabs(storedUser.tabs.map(t => t.toLowerCase()));
    }
    const currentPath = window.location.pathname;
    for (const [key, routes] of Object.entries(sections)) {
      if (routes.some(r => r.path === currentPath)) {
        setActiveSection(key);
        break;
      }
    }
  }, []);

  // close flyout when sidebar expands
  useEffect(() => {
    if (!collapsed) setFlyoutSection(null);
  }, [collapsed]);

  const handleLogout = () => {
    localStorage.removeItem("adminData");
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
  };

  const filteredSections = Object.entries(sections).filter(([key]) =>
    allowedTabs.includes(key.toLowerCase())
  );

  const sectionLabel = (key) => {
    if (key === "businessplanner") return "Business Planner";
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  const currentPath = window.location.pathname;

  return (

    <div  style={{ transition: "width 0.3s cubic-bezier(.4,0,.2,1)" }}
      className={`relative flex flex-col bg-[#09090f] border-r border-white/5
        min-h-screen flex-shrink-0 ${collapsed ? "w-[64px]" : "w-[240px]"}`}
    >

      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-sky-500
          text-white flex items-center justify-center shadow-lg hover:bg-sky-400 transition-colors"
      >
        {collapsed ? <MdChevronRight size={16} /> : <MdChevronLeft size={16} />}
      </button>

  
      <div className="flex items-center justify-center h-16 flex-shrink-0 overflow-hidden">
        {collapsed
          ? <span className="text-sky-400 font-black text-xl">C</span>
          : <img className="h-12 object-contain" src={logo} alt="logo" />
        }
      </div>

    
      
    <a    href="/admin"
        title={collapsed ? "Dashboard" : ""}
        className={`flex items-center gap-3 mx-2 mb-1 px-3 py-2.5 rounded-lg
          text-gray-300 hover:bg-white/5 hover:text-white transition-colors
          ${collapsed ? "justify-center" : ""}`}
      >
        <span className="flex-shrink-0 text-sky-400"><MdDashboard size={20} /></span>
        {!collapsed && <span className="text-sm font-semibold tracking-wide">Dashboard</span>}
      </a>

      <div className="mx-3 border-t border-white/5 mb-2" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
        {filteredSections.length > 0 ? filteredSections.map(([key, routes]) => (
          <div
            key={key}
            className="mb-1 relative"
            ref={el => flyoutRefs.current[key] = el}
          >

            {/* Section header button */}
            <button
              onClick={() => {
                if (collapsed) {
                  // toggle flyout for this section only
                  setFlyoutSection(flyoutSection === key ? null : key);
                } else {
                  setActiveSection(activeSection === key ? null : key);
                }
              }}
              title={collapsed ? sectionLabel(key) : ""}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-gray-400 hover:bg-white/5 hover:text-white transition-colors
                ${collapsed ? "justify-center" : "justify-between"}
                ${collapsed && flyoutSection === key ? "bg-white/10 text-white" : ""}
                ${!collapsed && activeSection === key ? "text-white" : ""}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0">{sectionIcons[key]}</span>
                {!collapsed && (
                  <span className="text-sm font-medium tracking-wide">
                    {sectionLabel(key)}
                  </span>
                )}
              </div>
              {!collapsed && (
                <MdChevronRight
                  size={16}
                  style={{
                    transition: "transform 0.25s",
                    transform: activeSection === key ? "rotate(90deg)" : "rotate(0deg)"
                  }}
                />
              )}
            </button>

            {/* ── EXPANDED: inline sub-items ── */}
            {!collapsed && activeSection === key && (
              <ul className="mt-0.5 ml-3 pl-3 border-l border-white/10 flex flex-col gap-0.5">
                {routes.map(route => (
                  <li key={route.id}>
                    
                  <a    href={route.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                        ${currentPath === route.path
                          ? "bg-sky-500/20 text-sky-300"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      <span className="flex-shrink-0">
                        {routeIcons[route.name] ?? <MdListAlt size={16} />}
                      </span>
                      <span className="truncate">{route.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {/* ── COLLAPSED: flyout panel for THIS section only ── */}
            {collapsed && flyoutSection === key && (
              <CollapsedFlyout
                section={key}
                routes={routes}
                currentPath={currentPath}
                onClose={() => setFlyoutSection(null)}
              />
            )}

          </div>
        )) : (
          <p className="text-gray-600 text-center text-xs py-8 italic">No tabs assigned.</p>
        )}
      </div>

      <div className="mx-3 border-t border-white/5" />


      <button
        onClick={handleLogout}
        title={collapsed ? "Log out" : ""}
        className={`flex items-center gap-3 mx-2 my-3 px-3 py-2.5 rounded-lg
          text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors
          ${collapsed ? "justify-center" : ""}`}
      >
        <span className="flex-shrink-0"><MdLogout size={20} /></span>
        {!collapsed && <span className="text-sm font-medium">Log out</span>}
      </button>

    </div>
  );
};

export default Sidebar;