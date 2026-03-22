import { FaDollarSign } from 'react-icons/fa';
import PropTypes from 'prop-types';


const Card = ({cartItem}) => {
    const {name, number} = cartItem;

    return (
        <>
            <div className="shadow-xl p-5 rounded-xl flex flex-col items-center justify-center">
                <div className="flex flex-row items-center justify-between gap-5">
                    <div>
                        <h1 className='text-xl font-medium'>{name}</h1>
                    </div>
                    <div>
                        <FaDollarSign></FaDollarSign>
                    </div>
                </div>

                <div className='text-center text-3xl font-bold'>
                    {number}
                </div>
            </div>
        </>
    );
};


Card.propTypes = {
    cartItem: PropTypes.object,

}

export default Card;