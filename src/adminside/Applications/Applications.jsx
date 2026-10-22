import { useEffect, useState } from "react";
import { base_url } from "../../config/config";
import { Shimmer, ShimmerTable } from "../../userside/utils/Shimmer.jsx";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`${base_url}/jobapplications`)
      .then((res) => res.json())
      .then((data) => setApplications(data))
      .catch((error) => console.error("Error fetching applications:", error))
      .finally(() => setLoading(false));
  }, []);

  const filtered = applications.filter((app) => {
    const search = searchTerm.toLowerCase();

    return (
      app.name?.toLowerCase().includes(search) ||
      app.email?.toLowerCase().includes(search) ||
      app.phone?.toLowerCase().includes(search) ||
      app.jobTitle?.toLowerCase().includes(search)
    );
  });

  const getCvUrl = (cvPath) => {
    if (!cvPath) return "#";

    const cleanPath = cvPath.replace(/\\/g, "/");

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    return `${base_url}/${cleanPath}`;
  };

  return (
    <div className="min-h-screen w-full">
      <div className="hdr">
        <h1>Job Applications</h1>
      </div>

      <div className="flex flex-col gap-6 items-start p-6">
        <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Table Top Bar */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                All Applications
              </span>

              {loading ? (
                <Shimmer className="h-5 w-8 rounded-full" />
              ) : (
                <span className="bg-violet-50 text-violet-500 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {filtered.length}
                </span>
              )}
            </div>

            <input
              type="text"
              placeholder="Search name, email, phone, job..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 placeholder-gray-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition w-72"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                    #
                  </th>

                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                    Applicant
                  </th>

                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                    Phone
                  </th>

                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                    Job Title
                  </th>

                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                    Applied Date
                  </th>

                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                    CV
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <ShimmerTable rows={6} cols={6} asRows />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-12 text-gray-300 text-sm"
                    >
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((application, index) => (
                    <tr
                      key={application._id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-700">
                            {application.name}
                          </span>

                          <span className="text-xs text-gray-400">
                            {application.email}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {application.phone}
                      </td>

                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full">
                          {application.jobTitle || "N/A"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {application.createdAt
                          ? new Date(application.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          {application.cv ? (
                            <a
                              href={getCvUrl(application.cv)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 border border-green-100 px-3 py-1.5 rounded-lg transition"
                            >
                              View CV
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No CV</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Applications;