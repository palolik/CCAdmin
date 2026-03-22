import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { useLoaderData } from "react-router-dom";
import Swal from 'sweetalert2';
import { base_url } from "../../config/config";
const PackStat = () => {
    useEffect(() => {
        document.title = "All My Classes";
    }, []);

    const loaderpacks = useLoaderData();
    const [packs, setpacks] = useState(loaderpacks);
    useEffect(() => {
        fetch(`${base_url}/packages`)
            .then(res => res.json())
            .then(data => setpacks(data))
            .catch(error => console.error('Error fetching classes:', error));
    }, []);
    const handleDelete = (_id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`${base_url}/delpackage/${_id}`, {
                    method: 'DELETE'
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.deletedCount > 0) {
                            Swal.fire({
                                title: "Deleted!",
                                text: "The pack has been deleted.",
                                icon: "success"
                            }).then(() => {
                                setpacks(packs.filter(pack => pack._id !== _id));
                            });
                        }
                    })
                    .catch(error => console.error('Error deleting pack:', error));
            }
        });
    }
  const handleStatusChange = (packId, newStatus) => {
    fetch(`${base_url}/packagestatus/${packId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.modifiedCount > 0 || data.acknowledged) {
          Swal.fire({
            icon: "success",
            title: "Status Updated!",
            text: `Status changed to ${newStatus}`,
            timer: 1200,
            showConfirmButton: false,
          });

          setpacks((prev) =>
            prev.map((p) =>
              p._id === packId ? { ...p, status: newStatus } : p
            )
          );
        }
      })
      .catch((error) => {
        console.error("Error updating status:", error);
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: "Could not update status.",
        });
      });
  };

    return (
           <div className="w-full">
            <div className="hdr">Package Statistics</div>
     <table className="w-full table-auto border-collapse border border-gray-300">
  <thead className="bg-gray-100 text-blacktext-gray-800">
    <tr className="text-center text-lg font-semibold">
      <th className="border border-gray-300">Category</th>
      <th className="border border-gray-300">Name</th>
      <th className="border border-gray-300">Price</th>
      <th className="border border-gray-300">Clicks</th>
      <th className="border border-gray-300">Sold</th>
      <th className="border border-gray-300">Details</th>
            <th className="border border-gray-300">Contents</th>

      <th className="border border-gray-300">Requirements</th>
      <th className="border border-gray-300">Status</th>
      <th className="border border-gray-300">Actions</th>
    </tr>
  </thead>

  <tbody>
    {packs.map((pack, index) => (
      <tr
        key={pack._id}
        className={`text-center hover:bg-blue-50 transition ${
          index % 2 === 0 ? "bg-white" : "bg-gray-50"
        }`}
      >
        <td className="py-2 px-3 font-medium">{pack.category}</td>
        <td className="py-2 px-3">{pack.packageName}</td>
        <td className="py-2 px-3 font-semibold text-green-700 flex flex-col">
         <p> ${pack.packagePrice} in  {pack.deliveryTime} days</p>
       <p>${pack.expressDeliveryPrice} in{pack.expressDeliveryTime}days </p>
        </td>
        <td className="py-2 px-3">{pack.clicks}</td>
        <td className="py-2 px-3">{pack.tsold}'s</td>

        <td className="py-2 px-3 text-left align-top max-w-[300px]">
  {pack.packageDetails ? (
    <div
      className="prose max-w-none  overflow-hidden text-ellipsis whitespace-nowrap hover:whitespace-normal  transition-all duration-200  break-words [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
      dangerouslySetInnerHTML={{ __html: pack.packageDetails }}
    />
  ) : (
    <span className="text-gray-400 italic">No details</span>
  )}
</td>



       <td className="py-2 px-3">
  <ul className="list-disc pl-6 text-gray-700 space-y-1">
    {pack.packageContents
      .filter(content => content && content.trim() !== "") // ✅ skip empty or whitespace-only items
      .map((content, index) => (
        <li key={index}>{content}</li>
      ))}
  </ul>
</td>


        <td className="prose max-w-none py-2 px-3 text-left  break-words [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5">
          {pack.packageRequirements || (
            <span className="text-gray-400 italic">No requirements</span>
          )}
        </td>

         <td className="py-2 px-3">
              <select
                value={pack.status || "pending"}
                onChange={(e) =>
                  handleStatusChange(pack._id, e.target.value)
                }
                className={`border rounded px-2 py-1 text-sm cursor-pointer ${
                  pack.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : pack.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >   <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </td>
        <td className="py-2 px-3 flex justify-center items-center ">
         
          <Link
            className="btn btn-xs bg-blue-500 text-white hover:bg-blue-600"
            to={`/update/${pack._id}`}
          >
            Update
          </Link>
          <button
            onClick={() => handleDelete(pack._id)}
            className="btn btn-xs btn-error text-white"
          >
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
</div>
    );
};

export default PackStat;
