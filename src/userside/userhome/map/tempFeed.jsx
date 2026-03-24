import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { base_url } from "../../../config/config";
const worldMap = '/assets/world.svg';

const Mapfeed = () => {
    // const navigate = useNavigate()
    const [icons, setIcons] = useState([]);
    const [newIcon, setNewIcon] = useState({
        id: '',
        position: { top: '', left: '' },
        imageUrl: '',
        data: ''
    });

    useEffect(() => {
        const fetchIcons = async () => {
            try {
                const response = await fetch(`${base_url}/map`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setIcons(data);
            } catch (error) {
                console.error('Error fetching icons:', error);
            }
        };

        fetchIcons();
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
                fetch(`${base_url}/delmap/${_id}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.deletedCount > 0) {
                            Swal.fire({
                                title: "Deleted!",
                                text: "The icon has been deleted.",
                                icon: "success"
                            });
                            setIcons(icons.filter(icon => icon.id !== _id));
                            // navigate('/admin/map')
                        }
                    })
                    .catch(error => console.error('Error deleting icon:', error));
            }
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith("position.")) {
            const positionKey = name.split(".")[1];
            setNewIcon((prev) => ({
                ...prev,
                position: {
                    ...prev.position,
                    [positionKey]: value
                }
            }));
        } else {
            setNewIcon((prev) => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleMapClick = (e) => {
        const map = e.target;
        const rect = map.getBoundingClientRect();
        const top = e.clientY - rect.top;
        const left = e.clientX - rect.left;

        setNewIcon((prev) => ({
            ...prev,
            position: {
                top: `${top}px`,
                left: `${left}px`
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${base_url}/addmap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newIcon),
            });

            if (!response.ok) throw new Error('Failed to upload icon');

            const data = await response.json();
            setIcons((prev) => [...prev, data]);
            setNewIcon({ id: '', position: { top: '', left: '' }, imageUrl: '', data: '' });
            Swal.fire('Success!', 'Icon added successfully.', 'success');
        } catch (error) {
            console.error('Error uploading icon:', error);
            Swal.fire('Error!', 'There was an error uploading the icon.', 'error');
        }
    };

    return (
        <div className="flex flex-col">
            
            <div>
                <table className="table">
                    <thead>
                        <tr className="font-bold text-xl">
                            <th className='text-lg text-center'>ID</th>
                            <th className='text-lg text-center'>Position</th>
                            <th className='text-lg text-center'>Image URL</th>
                            <th className='text-lg text-center'>Tooltip Data</th>
                            <th className='text-lg text-center'>Action</th>
                        </tr>
                    </thead>
                    <tbody>{console.log(icons)}
                        {(icons != null) ? icons.map(icon => (
                            <tr key={icon.id}>
                                <td><p className='text-lg text-center'>{icon.id}</p></td>
                                <td><p className='text-lg text-center'>{`Top: ${icon.position.top ? icon.position.top : 0}, Left: ${icon.position.left ? icon.position.left : 0}`}</p></td>
                                <td><img src={icon.imageUrl} className="w-20 h-20" /></td>
                                <td><p className='text-lg text-center'>{icon.data}</p></td>
                                <td className="flex justify-center space-x-2">
                                    <Link className="btn btn-xs bg-blue-300 text-black" to={`/update-icon/${icon.id}`}>Update</Link>
                                    <button onClick={() => handleDelete(icon._id)} className="btn btn-xs btn-error">Delete</button>
                                </td>
                            </tr>
                        )) : <tr>loading</tr>}
                    </tbody>
                </table>
            </div>
            
            <div className="flex flex-row">
                <div>
                    <form onSubmit={handleSubmit} className="mb-4">
                        <h2 className="font-bold text-xl mb-2">Upload New Icon</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <input
                                type="text"
                                name="id"
                                value={newIcon.id}
                                onChange={handleInputChange}
                                placeholder="Icon ID"
                                required
                                className="input text-black"
                            />
                            <input
                                type="text"
                                name="position.top"
                                value={newIcon.position.top}
                                onChange={handleInputChange}
                                placeholder="Position Top (px)"
                                required
                                readOnly
                                className="input text-black"
                            />
                            <input
                                type="text"
                                name="position.left"
                                value={newIcon.position.left}
                                onChange={handleInputChange}
                                placeholder="Position Left (px)"
                                required
                                readOnly
                                className="input text-black"
                            />
                            <input
                                type="text"
                                name="imageUrl"
                                value={newIcon.imageUrl}
                                onChange={handleInputChange}
                                placeholder="Image URL"
                                required
                                className="input text-black"
                            />
                            <input
                                type="text"
                                name="data"
                                value={newIcon.data}
                                onChange={handleInputChange}
                                placeholder="Tooltip Data"
                                required
                                className="input text-black"
                            />
                            <button type="submit" className="btn bg-green-500">Add Icon</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="relative h-[500px] w-[1200px]">
                <img
                    src={worldMap}
                    alt="World Map"
                    onClick={handleMapClick}
                    className="mapimage" />
                {/* <img
                    src={worldMap}
                    className="h-[300px] w-[720px]absolute top-0 left-0 cursor-pointer"
                /> */}
                {(icons != null) ? icons.map(icon => (
                    <div
                        key={icon.id}
                        className="absolute"
                        style={{ top: (icon.position.top ? icon.position.top : 0), left: (icon.position.left ? icon.position.left : 0) }}>
                        <img src={icon.imageUrl} alt={icon.id} className="h-6 w-6" />
                    </div>
                )) : <div>loading</div>}
            </div>


        </div>
    );
};

export default Mapfeed;