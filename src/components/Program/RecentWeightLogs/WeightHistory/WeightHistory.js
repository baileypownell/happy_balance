import React from 'react';
import Weight from './Weight/Weight';
import PriorRecords from './PriorRecords/PriorRecords'
// imports for connecting this component to Redux state store
import { connect } from 'react-redux';
import * as actions from '../../../../store/actionCreators';


class WeightHistory extends React.Component {

  // limitedForDisplay should remain as is for optimization; we should only make an array of subarrays if the length of the data we get back in the API is greater than 10 records. Thus, we should handle extra records in the API call.


  // the goal here is to use limitedForDisplay to always equal the current record set we are viewing as determined by the back and forth arrow buttons.

  // recordsByTens will be a complete data set (array) of all records divided into arrays, each ten in length. We use the back and forth arrows to increment and decrement which array of ten records we are viewing.

  state = {
    entireSortedWeightHistory: [],
    limitedForDisplay: [],
    noHistory: true,
    showingMore: false,
    showingPrior: false,
    extraRecordPosition: 0,
    recordsByTens: []
  }

  showLimitedRecs = (iterator) => {
    let limitedForDisplay = [];
    for (let i = 1; i < iterator; i++) {
      limitedForDisplay.push(this.state.entireSortedWeightHistory[i]);
    }
    this.setState({
      limitedForDisplay: limitedForDisplay
    });
  }


  // toggleMore should show 10 records if the length is 10 or more, or if it is less than 10 and greater than 6, should be whatever the length is
  toggleMore = () => {
    let limitedForDisplay = [];
    // find what number to limit it to
    let iterator;
    (this.state.entireSortedWeightHistory.length >= 10) ? iterator = 10 : iterator = this.state.entireSortedWeightHistory.length;
    if (!this.state.showingMore) {
      for (let i = 1; i < iterator; i++) {
        limitedForDisplay.push(this.state.entireSortedWeightHistory[i]);
      }
      this.setState({
        limitedForDisplay: limitedForDisplay,
        showingMore: true
      });
    } else {
      this.showLimitedRecs(6);
      this.setState({
        showingMore: false
      });
    }
  }

  // the function called when the page is loaded in turn calls this function
  buildMasterRecordSet = (weightHistory) => {
    console.log('buildMasterRecordSet weightHistory is equal to: ', weightHistory)
    let recordsByTensArray = [];
    let recordsByTens = [];
    weightHistory.forEach(rec => {
      recordsByTens.push(rec)
    });

    // then compile into a grander data structure, each item 10 in length
    // first 0 through 9, then 10 through 19, then 20 through 29, etc., so we need to find the max number to go to, which is the length of recordsByTens.
    let maxIteration = recordsByTens.length;

    const addToStateArray = (a, b) => {
      let tempArray = [];
      for (let i = a; i < b; i++) {
        if (recordsByTens[i] !== undefined) {
          tempArray.push(recordsByTens[i]);
        }
      }
      recordsByTensArray.push(tempArray);
    }

    let numberOfSubArrays = Math.ceil(maxIteration/10);

    // call addToStateArray() as many times as you need sub arrays
    function callAppropriately(a) {
      let i = 1;
        do {
          addToStateArray((i*10)-10, i*10);
          i++;
        }
        while (i <= a)
      }
    callAppropriately(numberOfSubArrays);

    this.setState({
      recordsByTens: recordsByTensArray
    })
  }


  goForward = () => {
    if (this.state.showingPrior === true) {
      this.setState(prevState => ({
          extraRecordPosition: prevState.extraRecordPosition+1
        }))
    } else {
      this.setState(prevState => ({
          showingPrior: !prevState.showingPrior,
          limitedForDisplay: prevState.recordsByTens[1],
          extraRecordPosition: prevState.extraRecordPosition+1
        }))
    }
  }

  goBack = () => {
    this.setState(prevState => ({
      extraRecordPosition: prevState.extraRecordPosition-1
    }))
  }

  // called when the page is loaded
  getUserWeightHistory = () => {
    function compare(a, b) {
      const secondsA = a.date.date.seconds;
      const secondsB = b.date.date.seconds;
      let comparison = 0;
     if (secondsA < secondsB) {
       comparison = 1;
     } else if (secondsA > secondsB) {
       comparison = -1;
     }
     return comparison;
    }
    // make API call
    const db = firebase.firestore();
    db.collection("users").doc(this.props.localId).get().then((doc) => {
      let weightHistory = doc.data().weights;
        // sort by date
        let sortedAllWeightsRecorded = weightHistory.sort(compare);
        // update redux so that <LineGraph/> can get this data
        this.props.setWeightHistory(sortedAllWeightsRecorded);
        if (sortedAllWeightsRecorded.length > 0) {
          this.setState({
            noHistory: false
          })
        }
        this.setState({
          entireSortedWeightHistory: sortedAllWeightsRecorded
        });
        let iterator = (weightHistory.length > 6) ? 6 : weightHistory.length;
        this.showLimitedRecs(iterator);
        // lastly, if there are 11 or more records, build an array of arrays, each sub array being 10 items in length, to go back and forth through in the Recent Weight Logs modal
        // update: always call this regardless of length
          this.buildMasterRecordSet(weightHistory);
      })
      .then(err => {
        console.log(err)
      });
  }


  componentDidMount() {
    this.getUserWeightHistory();
  }

  render() {
    return (
      <div>
        <div id="data-row">
          {this.props.todaysWeight && !this.state.showingPrior ? <Weight
            id="today"
            weight={this.props.todaysWeight}
            date="Today"
          />: null }
          {this.state.noHistory ? <p>You haven't recorded a weight yet.</p> :
           this.state.limitedForDisplay.map((weight) => {
            let date = (new Date(weight.date.date.seconds * 1000)).toString();
            let dateStringArray = date.split(' ');
            let dateString = [dateStringArray[1], dateStringArray[2], dateStringArray[3]].join(' ');
            return <Weight
              key={weight.date.date.seconds}
              weight={weight.weight}
              date={dateString}
            />
        })
      }


       {this.state.showingMore ?
         <>
         <button onClick={this.goBack} className="back-forth"><i className="fas fa-chevron-left"></i></button>
         <button onClick={this.goForward} className="back-forth"><i className="fas fa-chevron-right"></i></button>
         </>
         : null }
        </div>
        {!this.state.showingPrior ? <button onClick={this.toggleMore}>VIEW {this.state.showingMore ? "LESS" : "MORE"}</button> : null }
      </div>
      )
  }
}

const mapStateToProps = (state) => {
  return {
    todaysWeight: state.todaysWeight,
    localId: state.localId
  }
}

// map entire entireSortedWeightHistory to redux since LineGraph will need it but is not a child of WeightHistory
const mapDispatchToProps = dispatch => {
  return {
    setWeightHistory: (weightHistory) => dispatch(actions.setWeightHistory(weightHistory))
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(WeightHistory);