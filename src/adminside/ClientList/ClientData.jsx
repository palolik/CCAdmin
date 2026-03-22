import PropTypes from 'prop-types';


const ClientData = ({data}) => {
    const {id, name, email, country, address, phone, packageBought, actions} = data;
    // console.log(data)
    return (
        <tr>
            <td className='text-lg w-[80px]'>#{id}</td>
            <td className='text-lg  w-[200px]'>{name}</td>
            <td className='text-lg  w-[300px]'>{email}</td>
            <td className='text-lg  w-[150px]'>{country}</td>
            <td className='text-lg  w-[150px]'>{address}</td>
            <td className='text-lg  w-[150px]'>{phone}</td>
            <td className='text-lg  w-[200px]'>{packageBought}</td>
            <td className={`btn ${actions==='Active'?'btn-success':'btn-warning'}`}>{actions}</td>
        </tr>
    );
};

ClientData.propTypes = {

    data: PropTypes.object,
}

export default ClientData;