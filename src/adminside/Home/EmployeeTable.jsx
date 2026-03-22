const roleBadge = {
  emp:      "bg-indigo-100 text-indigo-700",
  marketer: "bg-amber-100 text-amber-700",
  admin:    "bg-red-100 text-red-700",
};

const EmployeesList = ({ data = [] }) => (
  <div className="shadow-lg rounded-xl p-5 flex flex-col gap-4">
    <h2 className="text-lg font-semibold text-gray-700">Employees</h2>
    <div className="flex flex-col gap-3">
      {data.map((emp, i) => (
        <div key={i} className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl px-4 py-3">

          {/* Avatar + Name */}
          <div className="flex items-center gap-3 w-1/3">
            <img
              src={emp.pic}
              onError={e => { e.target.src = "https://p1.hiclipart.com/preview/359/957/100/face-icon-user-profile-user-account-avatar-icon-design-head-silhouette-neck-png-clipart.jpg"; }}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{emp.name}</p>
              <p className="text-xs text-gray-400">{emp.email}</p>
            </div>
          </div>

          {/* Department */}
          <div className="w-1/5 text-center">
            <p className="text-sm font-medium text-gray-700 leading-tight">{emp.department}</p>
            <p className="text-xs text-gray-400">{emp.subDep}</p>
          </div>

          {/* Expertise */}
          <div className="w-1/6 flex justify-center">
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {emp.expertise}
            </span>
          </div>

          {/* Role */}
          <div className="w-1/6 flex justify-center">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge[emp.role] || "bg-gray-100 text-gray-600"}`}>
              {emp.role}
            </span>
          </div>

          {/* Tasks + XP */}
          <div className="w-1/6 text-center">
            <p className="text-xs text-gray-400">Tasks / XP</p>
            <p className="text-sm font-bold text-gray-700">
              {emp.tasksDone} <span className="text-amber-500 font-semibold">· {emp.xp}xp</span>
            </p>
          </div>

        </div>
      ))}
    </div>
  </div>
);

export default EmployeesList;