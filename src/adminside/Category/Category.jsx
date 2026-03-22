import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { useLoaderData } from "react-router-dom";
import Swal from 'sweetalert2';
import { base_url } from "../../config/config";
const Cetagory = () => {
    const loadercategorys = useLoaderData();
    const [categorys, setCategorys] = useState(loadercategorys);

    useEffect(() => {
        // Fetch the categories from the server
        fetch(`${base_url}/category`)
            .then(res => res.json())
            .then(data => setCategorys(data))
            .catch(error => console.error('Error fetching categories:', error));
    }, []);

    // Delete function
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
                fetch(`${base_url}/delcategory/${_id}`, {
                    method: 'DELETE'
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.deletedCount > 0) {
                            Swal.fire({
                                title: "Deleted!",
                                text: "The category has been deleted.",
                                icon: "success"
                            }).then(() => {
                                setCategorys(categorys.filter(category => category._id !== _id));
                            });
                        }
                    })
                    .catch(error => console.error('Error deleting category:', error));
            }
        });
    }

    // Add category function
    const handleAddCategory = async (event) => {
        event.preventDefault();
        const form = event.target;
        const category = form.category.value.trim();

        const postData = { category }; // Send only the category field

        try {
            const response = await fetch(`${base_url}/addcategory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            const data = await response.json();

            if (data.insertedId) {
                Swal.fire({
                    title: "New category added!",
                    text: "You have successfully added a new category",
                    icon: "success"
                });

                form.reset();
                setCategorys([...categorys, postData]); // Add new category to the table
            } else {
                Swal.fire({
                    title: "Error!",
                    text: "There was an issue adding the category.",
                    icon: "error"
                });
            }
        } catch (error) {
            console.error('Error adding category:', error);
            Swal.fire({
                title: "Error!",
                text: "An unexpected error occurred.",
                icon: "error"
            });
        }
    };

    return (
          <div className="w-full">
            <div className="hdr">Add Category</div>
            <div className="flex flex-col lg:flex-row justify-around gap-5 p-5">
                <form onSubmit={handleAddCategory} className="p-6 w-full mx-auto rounded-xl shadow-md flex flex-col gap-5">
                    <div className="flex-1 flex flex-col justify-start gap-2">
                        <label className="form-control w-full max-w-xs">
                            <div className="label">
                                <span className="label-text">Category</span>
                            </div>
                            <input name="category" className="input input-bordered" type="text" placeholder="Enter category" required />
                        </label>
                    </div>

                    <div className="flex-1 flex flex-col justify-start gap-2">
                        <button type="submit" className="btn btn-wide">Add Category</button>
                    </div>
                </form>
            </div>

            <div>
                <table className="table">
                    <thead>
                        <tr className="font-bold text-xl flex flex-row justify-between">
                            <td className='text-lg text-center'>Category</td>
                            <td className='text-lg text-center'>Action</td>
                        </tr>
                    </thead>
                    <tbody>
                        {categorys.map(category => (
                            <tr key={category._id}>
                                <td><p className='text-lg text-center'>{category.category}</p></td>
                                <td>
                                    <Link className="btn btn-xs bg-blue-300 text-black" to={`/update/${category._id}`}>Update</Link>
                                    <button onClick={() => handleDelete(category._id)} className="z-50 btn btn-xs btn-error">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>


                </table>
            </div>
        </div>
    );
};

export default Cetagory;
