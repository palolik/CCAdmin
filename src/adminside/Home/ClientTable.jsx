const atypeBadge = {
  Business: "bg-purple-100 text-purple-700",
  Personal:  "bg-blue-100 text-blue-700",
};

const ClientsList = ({ data = [] }) => (
  <div className="shadow-lg rounded-xl p-5 flex flex-col gap-4">
    <h2 className="text-lg font-semibold text-gray-700">Top Clients</h2>
    <div className="flex flex-col gap-3">
      {data.map((client, i) => (
        <div key={i} className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl px-4 py-3">
          
          {/* Avatar + Name */}
          <div className="flex items-center gap-3 w-1/3">
            <img
              src={client.pic}
              onError={e => { e.target.src = "https://p1.hiclipart.com/preview/359/957/100/face-icon-user-profile-user-account-avatar-icon-design-head-silhouette-neck-png-clipart.jpg"; }}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{client.name}</p>
              <p className="text-xs text-gray-400">{client.email}</p>
            </div>
          </div>

       

     
          <div className="w-1/2 flex flex-row gap-1">
              <div className="w-1/2 text-center">
            <p className="font-bold text-gray-700">{client.orders}</p>
            <p className="font-bold text-indigo-600">${client.totalSpent}</p>
          </div>

         
          <div className="w-1/2 flex flex-col justify-end">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${atypeBadge[client.atype] || "bg-gray-100 text-gray-600"}`}>
              {client.atype}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${client.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${client.active ? "bg-green-500" : "bg-gray-400"}`} />
              {client.active ? "Active" : "Inactive"}
            </span>
          </div>
          </div>
        

        </div>
      ))}
    </div>
  </div>
);

export default ClientsList;