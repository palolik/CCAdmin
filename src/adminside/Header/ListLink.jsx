import PropTypes from 'prop-types';
import {NavLink} from 'react-router-dom'
import './Header.css';

const ListLink = ({route, listClass}) => {
    
    const {name, path} = route;
    return (
            <NavLink className={listClass}  to={path} >{name}</NavLink>
    );
};

ListLink.propTypes = {
    route: PropTypes.object,
    listClass:PropTypes.string,

}
export default ListLink;