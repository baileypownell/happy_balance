import React from 'react';
import Content from './Content';
import { Redirect } from 'react-router-dom'
import Program from './Program/Program';
// imports for connecting this component to Redux state store
import { connect } from 'react-redux';
import * as actions from '../store/actionCreators';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

class CreateAccount extends React.Component {
  state = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    firebaseAuthID: '',
    weights: [],
    errorMessage: ''
  }
  handleChange = (e) => {
    this.setState({
      [e.target.id]: e.target.value
    })
  }

  createAccount = (firstName, lastName, email, localId) => {
    console.log('here');
    const db = firebase.firestore();
      db.collection("users").add({
        firstName: firstName,
        lastName: lastName,
        email: email,
        firebaseAuthID: localId,
        weights: []
      })
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      email: this.state.email,
      password: this.state.email,
      returnSecureToken: true
    }
    axios.post("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBa2yI5F5kpQTAJAyACoxkA5UyCfaEM7Pk", payload)
    .then(response => {
      console.log(response);
      //update Redux state
      let email = response.data.email;
      let expiresIn = response.data.expiresIn;
      let idToken = response.data.idToken;
      let localId = response.data.localId;
      let refreshToken = response.data.refreshToken;
      this.props.login(email, expiresIn, idToken, localId, refreshToken);
      //console.log(this.state.firstName, this.state.lastName, email, localId)
      this.createAccount(this.state.firstName, this.state.lastName, email, localId);
      this.props.createAccount(this.state.firstName, this.state.lastName, email, localId);
      this.props.history.replace('/Program');
    })
    // .catch((error) => {
    //   console.log('Error: ', error.response.data.error);
    //   this.setState((prevState) => ({
    //     errorMessage: error.response.data.error.message
    //   }))
    // });
   }

  render() {
    let errorMessage = null;
    if (this.state.errorMessage) {
      let messageToUser = '';
      if (this.state.errorMessage === 'INVALID_EMAIL') {
        messageToUser = 'The email is invalid.';
      } else if (this.state.errorMessage === 'INVALID_PASSWORD') {
        messageToUser = 'The password is invalid';
      } else if (this.state.errorMessage === 'EMAIL_EXISTS') {
        messageToUser = 'The email address is already in use by another account.';
      } else if (this.state.errorMessage === 'WEAK_PASSWORD') {
        messageToUser = 'The password must be 6 characters long or more.';
      } else {
        messageToUser = "There has been an error."
      }
      errorMessage = (
        <h3>{messageToUser}</h3>
      )
    }
    return (
      <Content>
        <h1>CREATE AN ACCOUNT</h1>
        <form onSubmit={this.handleSubmit}>
          <label><h2>First Name:</h2></label>
          <input type="text" name="first_name" id="firstName" onChange={this.handleChange}>
          </input>
          <label><h2>Last Name:</h2></label>
          <input type="text" name="last_name" id="lastName" onChange={this.handleChange}>
          </input>
          <label><h2>Email:</h2></label>
          <input type="email" name="email" id="email" onChange={this.handleChange}>
          </input>
          <label><h2>Password:</h2></label>
          <input type="password" name="password" id="password" onChange={this.handleChange}>
          </input>
          <button>SIGN UP <i class="fas fa-arrow-circle-right"></i></button>
        </form>
        {errorMessage}
      </Content>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    createAccount: (firstName, lastName, email, firebaseAuthID) => dispatch(actions.createAccount(firstName, lastName, email, firebaseAuthID)),
    login: (email, expiresIn, idToken, localId, refreshToken) => dispatch(actions.loginUser(email, expiresIn, idToken, localId, refreshToken))
  }
}

export default connect(null, mapDispatchToProps)(withRouter(CreateAccount));
