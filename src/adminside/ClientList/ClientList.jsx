// import { useEffect, useState } from "react";
// import ClientData from "./ClientData";

// const ClientList = () => {
//     const [clients, setClients] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         const fetchClients = async () => {
//             try {
//                 const response = await fetch("${base_url}/usersData");
//                 if (!response.ok) {
//                     throw new Error(`HTTP error! status: ${response.status}`);
//                 }
//                 const data = await response.json();
//                 setClients(data);
//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchClients();
//     }, []);

//     if (loading) return <p>Loading clients...</p>;
//     if (error) return <p>Error loading clients: {error}</p>;

//     return (
//         <table className="table">
//             <thead>
//                 <tr className="font-bold text-xl">
//                     <td colSpan={8}>
//                         <div className="flex flex-row justify-between items-center text-center">
//                             <p className="w-[80px]">ID</p>
//                             <p className="w-[200px]">Name</p>
//                             <p className="w-[300px]">Email</p>
//                             <p className="w-[150px]">Country</p>
//                             <p className="w-[150px]">City</p>
//                             <p className="w-[150px]">Phone</p>
//                             <p className="w-[200px]">Package Bought</p>
//                             <p className="bg-red-400 w-72">Actions</p>
//                         </div>
//                     </td>
//                 </tr>
//             </thead>
//             <tbody>
//                 {clients.map((client) => (
//                     <ClientData key={client.id} data={client} />
//                 ))}
//             </tbody>
//         </table>
//     );
// };

// export default ClientList;
