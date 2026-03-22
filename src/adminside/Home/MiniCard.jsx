import PropTypes from 'prop-types';

const iconMap = {
  "Clients": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  "Tasks": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
};

const colorMap = {
  "Clients": {
    bg:      "bg-violet-50",
    border:  "border-violet-100",
    iconBg:  "bg-violet-100",
    icon:    "text-violet-500",
    number:  "text-violet-600",
    bar:     "bg-violet-400",
  },
  "Tasks": {
    bg:      "bg-sky-50",
    border:  "border-sky-100",
    iconBg:  "bg-sky-100",
    icon:    "text-sky-500",
    number:  "text-sky-600",
    bar:     "bg-sky-400",
  },
};

const MiniCard = ({ miniCardItem }) => {
  const { name, number } = miniCardItem;
  const c = colorMap[name] || colorMap["Tasks"];

  return (
    <div className={`relative overflow-hidden rounded-xl border ${c.border} ${c.bg}
      shadow-sm transition-shadow duration-300 p-5 flex flex-col gap-4`}>

      {/* Top row — label + icon */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {name}
        </span>
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.icon}
          flex items-center justify-center flex-shrink-0`}>
          {iconMap[name] ?? iconMap["Tasks"]}
        </div>
      </div>

      {/* Number */}
      <div className={`text-5xl font-bold ${c.number} leading-none`}>
        {number}
      </div>

      {/* Decorative bottom bar */}
      <div className="h-1 w-full rounded-full bg-black/5">
        <div className={`h-1 rounded-full ${c.bar}`}
          style={{ width: `${Math.min((number / 20) * 100, 100)}%`, transition: "width 0.6s ease" }} />
      </div>

      {/* Subtle background circle decoration */}
      <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10 ${c.bar}`} />
    </div>
  );
};

MiniCard.propTypes = {
  miniCardItem: PropTypes.object,
};

export default MiniCard;