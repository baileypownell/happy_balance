import React from 'react'
import { connect } from 'react-redux'
import RecentWeightLogs from './RecentWeightLogs/RecentWeightLogs'
import LineGraph from './LineGraph/LineGraph'
import WeightLogger from './WeightLogger/WeightLogger'
import Goal from '../Goal/Goal'
import './Dashboard.scss'
import { compare } from '../../compare'
import { calculateTodaysWeight } from '../../calculate-todays-weight'

class Dashboard extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      sortedWeights: [],
      loaded: false, 
      goal: null
    }

    // This binding is necessary to make `this` work in the callback
    this.updateWeightHistory = this.updateWeightHistory.bind(this);
  }

  updateWeightHistory() {
    const db = firebase.firestore();
    db.collection("users").doc(this.props.localId).get()
    .then((doc) => {
      let weightHistory = doc.data().weights;
      let sortedAllWeightsRecorded = weightHistory.sort(compare)
      this.setState({
        sortedWeights: sortedAllWeightsRecorded,
        loaded: true,
        goal: doc.data().goals[0]
      })
    })
    .catch(err => console.log(err))
  }

  componentDidMount() {
      this.updateWeightHistory(this.props.localId)
  }

  render() {
    const { sortedWeights, loaded, goal } = this.state;
    const todaysWeight = calculateTodaysWeight(this.state.sortedWeights)

    return (
        <div className="dashboard z-depth-15">
          { loaded ? 
            <>
              <h4 id="dashboard">Dashboard</h4>
              <WeightLogger 
                weights={sortedWeights} 
                todaysWeight={todaysWeight}
                updateWeightHistory={this.updateWeightHistory}
              />
              <div id="account-options">
                  <RecentWeightLogs 
                    weights={sortedWeights} 
                  /> 
                  <LineGraph 
                    weights={sortedWeights} 
                    key={sortedWeights}  
                  /> 
              </div>
              <Goal goal={goal} />
            </>
             : 
             <div id="center">
                <div className="preloader-wrapper big active">
                <div className="spinner-layer ">
                  <div className="circle-clipper left">
                    <div className="circle"></div>
                  </div>
                  <div className="gap-patch">
                    <div className="circle"></div>
                  </div>
                  <div className="circle-clipper right">
                    <div className="circle"></div>
                  </div>
                </div>
              </div>
            </div>}
        </div> 
    )
  }
}

const mapStateToProps = state => {
  return {
    userLoggedIn: state.userLoggedIn,
    localId: state.localId,
  }
}

export default connect(mapStateToProps)(Dashboard);