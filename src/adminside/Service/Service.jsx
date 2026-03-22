import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const Service = () => {
    const [service, setService] = useState([]);
    const [showForm, setShowForm] = useState(false); // modal toggle

    useEffect(() => {
        fetch(`${base_url}/service`)
            .then((res) => res.json())
            .then((data) => setService(data))
            .catch((error) => console.error("Error fetching services:", error));
    }, []);

    const handleDelete = (_id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`${base_url}/delservice/${_id}`, {
                    method: "DELETE",
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.deletedCount > 0) {
                            Swal.fire("Deleted!", "The service has been deleted.", "success");
                            setService((prev) => prev.filter((s) => s._id !== _id));
                        }
                    })
                    .catch((error) => console.error("Error deleting service:", error));
            }
        });
    };

    const handleAddPost = async (event) => {
        event.preventDefault();
        const form = event.target;

        const postData = {
            serviceTitle: form.serviceTitle.value.trim(),
            serviceDescription: form.serviceDescription.value.trim(),
            serviceBgImage: form.serviceBgImage.value.trim(),
        };

        try {
            const response = await fetch(`${base_url}/addservice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData),
            });

            const data = await response.json();

            if (data.insertedId) {
                Swal.fire("New Service Added!", "Successfully added.", "success");
                form.reset();
                setShowForm(false);
                setService([...service, { ...postData, _id: data.insertedId }]);
            } else {
                Swal.fire("Error!", "Failed to add service.", "error");
            }
        } catch (error) {
            console.error("Error adding service:", error);
            Swal.fire("Error!", "Unexpected error occurred.", "error");
        }
    };

    return (
        <div className="w-full">
            <div className='hdr'>Services</div>

            <div className="flex justify-end items-center mb-4">
                <button
                    onClick={() => setShowForm(true)}
                    className="smbut"
                >
                    + Add New Service
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table-auto w-full border">
                    <thead className="bg-gray-100">
                        <tr className="text-center font-semibold">
                            <th>Title</th>
                            <th>Description</th>
                            <th>Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {service.map((s) => (
                            <tr key={s._id} className="text-center border-b">
                                <td>{s.serviceTitle}</td>

                                <td className="max-w-xs truncate">{s.serviceDescription}</td>

                                <td>
                                    <img
                                        src={s.serviceBgImage}
                                        className="w-20 h-20 object-cover rounded"
                                    />
                                </td>
                                <td >
                                    <button className="btn btn-xs bg-blue-300 text-black" disabled>
                                        Update
                                    </button>
                                    <button
                                        onClick={() => handleDelete(s._id)}
                                        className="btn btn-xs btn-error"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-semibold mb-4 text-center">
                            Add New Service
                        </h3>
                        <form onSubmit={handleAddPost} className="flex flex-col gap-3">
                            <input
                                name="serviceTitle"
                                type="text"
                                placeholder="Service Title"
                                className="input input-bordered w-full"
                                required
                            />
                            <input
                                name="serviceDescription"
                                type="text"
                                placeholder="Service Description"
                                className="input input-bordered w-full"
                                required
                            />
                            <input
                                name="serviceBgImage"
                                type="text"
                                placeholder="Background Image URL"
                                className="input input-bordered w-full"
                                required
                            />
                            <button type="submit" className="btn btn-primary w-full mt-3">
                                Add Service
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Service;
