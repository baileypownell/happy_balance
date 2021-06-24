import React from 'react'
import { Link } from "react-router-dom"
import { connect } from 'react-redux'
import './Nav.scss'
import * as actions from '../../store/actionCreators'
import { withRouter } from 'react-router-dom'
import M from 'materialize-css'
import logo from '../../assets/default-dark-2.png'
import logoWide from '../../assets/default-dark-monochrome.svg'

class Nav extends React.Component {

  logout = () => {
    this.props.logoutUser()
    this.props.history.push('/')
  }

  componentDidMount() {
    var elems = document.querySelectorAll('.sidenav')
    M.Sidenav.init(elems, { edge: 'right'})
  }

  render() {
    return (
      <>
        <nav>      
            <Link to="/" ><img id="wide" src={logoWide}></img></Link>
            <a data-target="slide-out" className="sidenav-trigger"><i className="fas fa-bars"></i></a>   
        </nav>
        <ul id="slide-out" className="sidenav sidenav-close">
          <img src={logo}/>
          {
            this.props.userLoggedIn ? 
              <>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/settings">Settings</Link></li>
              </>
            : <li><Link to="/signup">Create Account</Link></li>
          }
            <li><div className="divider"></div></li>
            {this.props.userLoggedIn ? <li><a onClick={this.logout}>Log Out</a></li> : <li><Link to="/login">Login</Link></li>}
        </ul>         
      </>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    logoutUser: () => dispatch(actions.logoutUserAsync())
  }
}

const mapStateToProps = state => {
  return {
    userLoggedIn: state.userLoggedIn,
    expiresIn: state.expiresIn,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Nav));
