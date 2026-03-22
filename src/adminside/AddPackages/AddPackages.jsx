import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { base_url } from '../../config/config';
const AddPackages = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  const [packageDetails, setPackageDetails] = useState("");
  const [packageRequirements, setpackageRequirements] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${base_url}/category`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCategories(data.map(item => item.category));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleAddPost = async (event) => {
        event.preventDefault();
        const form = event.target;

        const getTrimmedValue = (name) => {
            const value = form[name]?.value;
            return value ? value.trim() : '';
        };

        const category = form.categories?.value;
        const packageCover = getTrimmedValue('packageCover');
        const packageName = getTrimmedValue('packageName');
        const packagePrice = getTrimmedValue('packagePrice');
const packageContents = Array.from({ length: 8 }, (_, i) => 
  getTrimmedValue(`content${i + 1}`)
).filter(content => content && content.trim() !== "");
        const deliveryTime = getTrimmedValue('deliveryTime');
        const expressDeliveryTime = getTrimmedValue('expressDeliveryTime');
        const expressDeliveryPrice = getTrimmedValue('expressDeliveryPrice');
        const packageDetailsValue = packageDetails;
        const packageRequirementValue = packageRequirements;


        const postData = {
            category,
            packageCover,
            packageName,
            packagePrice,
            packageContents,
            deliveryTime,
            expressDeliveryTime,
            expressDeliveryPrice,
            packageDetails: packageDetailsValue,
            packageRequirements: packageRequirementValue,
        };

        try {
            const response = await fetch(`${base_url}/addpackages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            const data = await response.json();

            if (data.insertedId) {
                Swal.fire({
                    title: "New Package Added!",
                    text: "You have successfully added a new Package",
                    icon: "success"
                });
                form.reset();
                setPackageDetails("");
                setpackageRequirements("");

            } else {
                Swal.fire({
                    title: "Error!",
                    text: "There was an issue adding the post.",
                    icon: "error"
                });
            }
        } catch (error) {
            console.error('Error adding post:', error);
            Swal.fire({
                title: "Error!",
                text: "An unexpected error occurred.",
                icon: "error"
            });
        }
    };

    if (loading) return <p>Loading categories...</p>;
    if (error) return <p>Error loading categories: {error}</p>;

    return (
          <div className="w-full">
            <div className="hdr">Add Packages</div>
        <form onSubmit={handleAddPost}>
            <div className="flex flex-row lg:flex-row justify-start p-5">
                <div className="flex flex-col justify-start mr-10 gap-2">
                    <div className="flex flex-col gap-2">
                        <label className="form-control w-full max-w-xs">
                            <div className="label">
                                <span className="label-text">Package Category</span>
                            </div>
                            <select id="categories" name="categories" className="input input-bordered" required>
                                <option value="" disabled>Select Your Category</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </label>
                        <label className="form-control w-full max-w-xs">
                            <div className="label">
                                <span className="label-text">Package Cover</span>
                            </div>
                            <input name="packageCover" className="input input-bordered" type="text" placeholder="Enter Your Package Name Here" required />
                        </label>
                        <label className="form-control w-full max-w-xs">
                            <div className="label">
                                <span className="label-text">Package Name</span>
                            </div>
                            <input name="packageName" className="input input-bordered" type="text" placeholder="Enter Your Package Name Here" required />
                        </label>

                        <label className="form-control w-full max-w-xs">
                            <div className="label">
                                <span className="label-text">Package Price</span>
                            </div>
                            <input name="packagePrice" className="input input-bordered" type="text" placeholder="Enter Package Price Here" required />
                        </label>
                    </div>

                    <div>
                        <label className="form-control w-full max-w-xs">
                            <div className="label">
                                <span className="label-text">Package Contents</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="flex flex-row items-center gap-5">
                                        <h1 className="text-2xl font-bold">{i + 1}</h1>
                                        <input name={`content${i + 1}`} className="input input-bordered" type="text" placeholder={`Content ${i + 1}`} />
                                    </div>
                                ))}
                            </div>
                        </label>
                    </div>
                </div>
                <div className="flex flex-col justify-start gap-2">
                    <label className="form-control w-full max-w-xs">
                        <div className="label">
                            <span className="label-text">Delivery Time</span>
                        </div>
                        <input name="deliveryTime" className="input input-bordered" type="text" placeholder="Enter Delivery Time Here" />
                    </label>

                    <label className="form-control w-full max-w-xs">
                        <div className="label">
                            <span className="label-text">Express Delivery Time</span>
                        </div>
                        <input name="expressDeliveryTime" className="input input-bordered" type="text" placeholder="Enter Express Delivery Time Here" />
                    </label>

                    <label className="form-control w-full max-w-xs">
                        <div className="label">
                            <span className="label-text">Express Delivery Price</span>
                        </div>
                        <input name="expressDeliveryPrice" className="input input-bordered" type="text" placeholder="Enter Express Delivery Price Here" />
                    </label>
<label className="form-control mb-10">
                        <div className="label">
                            <span className="label-text">Package Requirements</span>
                        </div>
                         <ReactQuill
          theme="snow"
          value={packageRequirements}
          onChange={setpackageRequirements}
          className="bg-white rounded-lg w-[700px] h-[120px]"
        />
                    </label>

                    <label className="form-control mb-10">
                        <div className="label">
                            <span className="label-text">Package Details</span>
                        </div>
                       <ReactQuill
          theme="snow"
          value={packageDetails}
          onChange={setPackageDetails}
          className="bg-white rounded-lg w-[700px] h-[350px]"
        />
                    </label>

                    
                    <button type="submit" className="btn btn-wide">Add Package</button>
                </div>
            </div>
        </form>
        </div>
    );
};

export default AddPackages;
